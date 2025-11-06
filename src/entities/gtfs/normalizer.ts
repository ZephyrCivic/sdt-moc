import type { GtfsImportResult } from './parser'
import type {
  LineString,
  Network,
  Route,
  Stop,
  Usage,
} from './types'

function toFloat(value: string | undefined, fallback = 0) {
  if (!value) return fallback
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function toStop(record: Record<string, string>): Stop | null {
  const id = record.stop_id ?? record.stopId
  if (!id) {
    return null
  }

  const lon = toFloat(record.stop_lon ?? record.stopLon)
  const lat = toFloat(record.stop_lat ?? record.stopLat)

  return {
    id,
    name: record.stop_name ?? record.stopName ?? id,
    lon,
    lat,
  }
}

function toRouteName(record: Record<string, string>) {
  const shortName = record.route_short_name ?? record.routeShortName
  const longName = record.route_long_name ?? record.routeLongName

  if (shortName && longName) return `${shortName} / ${longName}`
  if (longName) return longName
  if (shortName) return shortName
  return record.route_id ?? '不明系統'
}

function buildGeometryFromShapes(
  shapeId: string,
  shapes: Record<string, string>[],
): LineString | null {
  const records = shapes
    .filter((shape) => shape.shape_id === shapeId)
    .sort(
      (a, b) =>
        Number.parseInt(a.shape_pt_sequence ?? '0', 10) -
        Number.parseInt(b.shape_pt_sequence ?? '0', 10),
    )
  if (records.length === 0) return null

  const coordinates = records.map<[number, number]>((shape) => [
    toFloat(shape.shape_pt_lon),
    toFloat(shape.shape_pt_lat),
  ])

  if (coordinates.length < 2) return null

  return {
    type: 'LineString',
    coordinates,
  }
}

function buildGeometryFromStopTimes(
  tripId: string,
  stopTimes: Record<string, string>[],
  stopMap: Map<string, Stop>,
): { geometry: LineString | null; stopIds: string[] } {
  const times = stopTimes
    .filter((stopTime) => stopTime.trip_id === tripId)
    .sort(
      (a, b) =>
        Number.parseInt(a.stop_sequence ?? '0', 10) -
        Number.parseInt(b.stop_sequence ?? '0', 10),
    )

  const coordinates: [number, number][] = []
  const stopIds: string[] = []

  for (const time of times) {
    const stopId = time.stop_id
    if (!stopId) continue
    const stop = stopMap.get(stopId)
    if (!stop) continue
    stopIds.push(stopId)
    coordinates.push([stop.lon, stop.lat])
  }

  if (coordinates.length < 2) {
    return { geometry: null, stopIds }
  }

  return {
    geometry: { type: 'LineString', coordinates },
    stopIds,
  }
}

function aggregateUsage(
  stopTimes: Record<string, string>[],
  stopIds: Set<string>,
): Usage[] {
  const counts = new Map<string, number>()
  stopIds.forEach((id) => counts.set(id, 0))

  for (const time of stopTimes) {
    const stopId = time.stop_id
    if (!stopId) continue
    counts.set(stopId, (counts.get(stopId) ?? 0) + 1)
  }

  return Array.from(counts.entries()).map(([stopId, value]) => ({
    stopId,
    boardings: value,
    alightings: value,
  }))
}

export function buildNetwork(data: GtfsImportResult): Network {
  const stopMap = new Map<string, Stop>()
  for (const record of data.stops) {
    const stop = toStop(record)
    if (stop) {
      stopMap.set(stop.id, stop)
    }
  }

  const routes: Route[] = []
  const usedStopIds = new Set<string>()

  for (const record of data.routes) {
    const routeId = record.route_id ?? record.routeId
    if (!routeId) continue

    const relatedTrips = data.trips.filter(
      (trip) => trip.route_id === routeId,
    )

    let geometry: LineString | null = null
    let stopIds: string[] = []

    const tripWithShape = relatedTrips.find(
      (trip) => trip.shape_id && trip.shape_id.length > 0,
    )

    if (tripWithShape?.shape_id) {
      geometry = buildGeometryFromShapes(tripWithShape.shape_id, data.shapes)
    }

    if (!geometry && relatedTrips.length > 0) {
      const fallback = buildGeometryFromStopTimes(
        relatedTrips[0].trip_id,
        data.stopTimes,
        stopMap,
      )
      geometry = fallback.geometry
      stopIds = fallback.stopIds
    }

    if (!geometry) {
      continue
    }

    if (stopIds.length === 0) {
      stopIds = geometry.coordinates
        .map((coord) => {
          const entry = Array.from(stopMap.values()).find(
            (stop) => stop.lon === coord[0] && stop.lat === coord[1],
          )
          return entry?.id
        })
        .filter((id): id is string => Boolean(id))
    }

    stopIds.forEach((id) => usedStopIds.add(id))

    routes.push({
      id: routeId,
      name: toRouteName(record),
      geometry,
      stopIds,
    })
  }

  const stops = Array.from(stopMap.values())
  const usage =
    data.stopTimes.length > 0
      ? aggregateUsage(data.stopTimes, usedStopIds)
      : undefined

  return {
    stops,
    routes,
    usage,
  }
}
