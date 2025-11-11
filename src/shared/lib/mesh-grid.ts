import type { Polygon } from 'geojson'
import type { Network, Stop, Usage } from '@/shared/types/network'

const DEFAULT_CELL_SIZE_DEGREES = 0.01 // ≒1.1km
const HIGH_DEMAND_PER_STOP = 180
const MODERATE_DEMAND_PER_STOP = 90

export type MeshCellStatus = 'improve' | 'watch' | 'healthy'

export interface MeshCellMetrics {
  stopCount: number
  routeCount: number
  demand: number
  demandPerStop: number
}

export interface MeshScore {
  id: string
  bbox: [[number, number], [number, number]]
  polygon: Polygon
  centroid: { lon: number; lat: number }
  metrics: MeshCellMetrics
  status: MeshCellStatus
  reason: string
  priority: number
}

interface Aggregation {
  key: string
  lonMin: number
  latMin: number
  stops: Stop[]
  routeIds: Set<string>
  demand: number
}

interface BuildOptions {
  cellSizeDegrees?: number
}

export function buildMeshScores(
  network: Network | null,
  options?: BuildOptions,
): MeshScore[] {
  if (!network) return []

  const cellSize = options?.cellSizeDegrees ?? DEFAULT_CELL_SIZE_DEGREES
  const usageMap = new Map<string, Usage>()
  network.usage?.forEach((usage) => usageMap.set(usage.stopId, usage))

  const stopRouteMap = mapStopToRoutes(network)
  const cells = new Map<string, Aggregation>()

  for (const stop of network.stops) {
    const keyData = buildCellKey(stop.lon, stop.lat, cellSize)
    const key = keyData.id
    if (!cells.has(key)) {
      cells.set(key, {
        key,
        lonMin: keyData.lonMin,
        latMin: keyData.latMin,
        stops: [],
        routeIds: new Set<string>(),
        demand: 0,
      })
    }
    const cell = cells.get(key)!
    cell.stops.push(stop)
    const stopRoutes = stopRouteMap.get(stop.id)
    stopRoutes?.forEach((routeId) => cell.routeIds.add(routeId))
    const usage = usageMap.get(stop.id)
    if (usage) {
      cell.demand += usage.boardings + usage.alightings
    }
  }

  return Array.from(cells.values())
    .map<MeshScore>((cell) => {
      const stopCount = cell.stops.length
      const routeCount = cell.routeIds.size
      const demand = cell.demand
      const demandPerStop = stopCount > 0 ? demand / stopCount : 0
      const status = classifyStatus(demandPerStop, routeCount)
      const reason = buildReason(status, demandPerStop, routeCount)
      const priority = buildPriority(status, demandPerStop, routeCount)
      const lonMax = cell.lonMin + cellSize
      const latMax = cell.latMin + cellSize
      return {
        id: cell.key,
        bbox: [
          [cell.lonMin, cell.latMin],
          [lonMax, latMax],
        ],
        polygon: {
          type: 'Polygon',
          coordinates: [
            [
              [cell.lonMin, cell.latMin],
              [lonMax, cell.latMin],
              [lonMax, latMax],
              [cell.lonMin, latMax],
              [cell.lonMin, cell.latMin],
            ],
          ],
        },
        centroid: {
          lon: (cell.lonMin + lonMax) / 2,
          lat: (cell.latMin + latMax) / 2,
        },
        metrics: {
          stopCount,
          routeCount,
          demand,
          demandPerStop,
        },
        status,
        reason,
        priority,
      }
    })
    .filter((cell) => cell.metrics.stopCount > 0)
    .sort((a, b) => b.priority - a.priority)
}

function buildCellKey(lon: number, lat: number, size: number) {
  const lonMin = Math.floor(lon / size) * size
  const latMin = Math.floor(lat / size) * size
  return {
    id: `${lonMin.toFixed(4)}_${latMin.toFixed(4)}`,
    lonMin,
    latMin,
  }
}

function mapStopToRoutes(network: Network) {
  const map = new Map<string, Set<string>>()
  for (const route of network.routes) {
    for (const stopId of route.stopIds) {
      if (!map.has(stopId)) {
        map.set(stopId, new Set<string>())
      }
      map.get(stopId)!.add(route.id)
    }
  }
  return map
}

function classifyStatus(demandPerStop: number, routeCount: number): MeshCellStatus {
  if (demandPerStop >= HIGH_DEMAND_PER_STOP && routeCount <= 1) {
    return 'improve'
  }
  if (demandPerStop >= MODERATE_DEMAND_PER_STOP && routeCount <= 2) {
    return 'watch'
  }
  return 'healthy'
}

function buildReason(status: MeshCellStatus, demandPerStop: number, routeCount: number) {
  const demandText = `${Math.round(demandPerStop)}人/停留所`
  if (status === 'improve') {
    return `${demandText} に対し路線 ${routeCount} 本のみ`
  }
  if (status === 'watch') {
    return `${demandText} に対し路線 ${routeCount} 本、混雑予兆`
  }
  return `需要 ${demandText} は適正範囲`
}

function buildPriority(status: MeshCellStatus, demandPerStop: number, routeCount: number) {
  const base =
    status === 'improve' ? 100 : status === 'watch' ? 60 : 20
  return base + demandPerStop - routeCount * 5
}
