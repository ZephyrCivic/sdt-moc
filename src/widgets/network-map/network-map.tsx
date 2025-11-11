import { useEffect, useMemo, useRef, useState } from 'react'
import maplibregl, { type GeoJSONSource, type Map } from 'maplibre-gl'
import type {
  Feature,
  FeatureCollection,
  LineString,
  Point,
  Polygon,
} from 'geojson'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useGtfsUploadStore } from '@/shared/state/gtfs-upload-store'
import type { Network } from '@/entities/gtfs/types'
import type { Annotation } from '@/shared/types/candidate'
import {
  getHighlightedCandidate,
  useScenarioStore,
} from '@/shared/state/scenario-store'
import { useShallow } from 'zustand/react/shallow'
import type { MeshScore } from '@/shared/lib/mesh-grid'

const MAP_STYLE_URL = 'https://demotiles.maplibre.org/style.json'
const ROUTES_SOURCE_ID = 'network-routes'
const ROUTES_LAYER_ID = 'network-routes-line'
const STOPS_SOURCE_ID = 'network-stops'
const STOPS_LAYER_ID = 'network-stops-circle'
const CANDIDATE_LINE_SOURCE_ID = 'candidate-line'
const CANDIDATE_LINE_LAYER_ID = 'candidate-line-layer'
const CANDIDATE_POINT_SOURCE_ID = 'candidate-point'
const CANDIDATE_POINT_LAYER_ID = 'candidate-point-layer'
const CANDIDATE_POLYGON_SOURCE_ID = 'candidate-polygon'
const CANDIDATE_POLYGON_LAYER_ID = 'candidate-polygon-layer'
const CANDIDATE_POLYGON_OUTLINE_LAYER_ID = 'candidate-polygon-outline-layer'
const MESH_SOURCE_ID = 'mesh-cells'
const MESH_FILL_LAYER_ID = 'mesh-cells-fill-layer'
const MESH_BORDER_LAYER_ID = 'mesh-cells-border-layer'
const MESH_HIGHLIGHT_LAYER_ID = 'mesh-cells-highlight-layer'
const EMPTY_ANNOTATIONS: Annotation[] = []

const EMPTY_FEATURE_COLLECTION: FeatureCollection = {
  type: 'FeatureCollection',
  features: [],
}

function toRouteCollection(network: Network): FeatureCollection<LineString> {
  return {
    type: 'FeatureCollection',
    features: network.routes.map((route) => ({
      type: 'Feature',
      id: route.id,
      properties: {
        id: route.id,
        name: route.name,
      },
      geometry: route.geometry,
    })),
  }
}

function toStopCollection(network: Network): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: network.stops.map((stop) => ({
      type: 'Feature',
      id: stop.id,
      properties: {
        id: stop.id,
        name: stop.name,
      },
      geometry: {
        type: 'Point',
        coordinates: [stop.lon, stop.lat],
      },
    })),
  }
}

type LngLatBounds = [[number, number], [number, number]]

function computeBounds(network: Network): LngLatBounds | null {
  let minLon = Number.POSITIVE_INFINITY
  let minLat = Number.POSITIVE_INFINITY
  let maxLon = Number.NEGATIVE_INFINITY
  let maxLat = Number.NEGATIVE_INFINITY

  for (const route of network.routes) {
    for (const [lon, lat] of route.geometry.coordinates) {
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue
      minLon = Math.min(minLon, lon)
      minLat = Math.min(minLat, lat)
      maxLon = Math.max(maxLon, lon)
      maxLat = Math.max(maxLat, lat)
    }
  }

  if (!Number.isFinite(minLon) || !Number.isFinite(minLat)) {
    for (const stop of network.stops) {
      const { lon, lat } = stop
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue
      minLon = Math.min(minLon, lon)
      minLat = Math.min(minLat, lat)
      maxLon = Math.max(maxLon, lon)
      maxLat = Math.max(maxLat, lat)
    }
  }

  if (
    !Number.isFinite(minLon) ||
    !Number.isFinite(minLat) ||
    !Number.isFinite(maxLon) ||
    !Number.isFinite(maxLat)
  ) {
    return null
  }

  return [
    [minLon, minLat],
    [maxLon, maxLat],
  ]
}

function updateNetworkData(map: Map, network: Network | null) {
  const routeSource = map.getSource(ROUTES_SOURCE_ID) as GeoJSONSource | undefined
  const stopSource = map.getSource(STOPS_SOURCE_ID) as GeoJSONSource | undefined

  if (network && network.routes.length > 0) {
    routeSource?.setData(toRouteCollection(network))
  } else {
    routeSource?.setData(EMPTY_FEATURE_COLLECTION)
  }

  if (network && network.stops.length > 0) {
    stopSource?.setData(toStopCollection(network))
  } else {
    stopSource?.setData(EMPTY_FEATURE_COLLECTION)
  }

  if (network) {
    const bounds = computeBounds(network)
    if (bounds) {
      const [southWest, northEast] = bounds
      const samePoint =
        southWest[0] === northEast[0] && southWest[1] === northEast[1]
      if (samePoint) {
        map.flyTo({
          center: southWest,
          zoom: Math.max(map.getZoom(), 12),
          essential: true,
        })
      } else {
        map.fitBounds(bounds, {
          padding: window.innerWidth < 1024 ? 32 : 56,
          duration: 800,
        })
      }
    }
  }
}

function toAnnotationCollections(annotations: Annotation[]) {
  const lineFeatures: Feature<LineString>[] = []
  const pointFeatures: Feature<Point>[] = []
  const polygonFeatures: Feature<Polygon>[] = []

  annotations.forEach((annotation, index) => {
    const baseFeature = {
      type: 'Feature' as const,
      id: `${annotation.kind}-${index}`,
      properties: {
        note: annotation.note ?? null,
      },
    }

    if (annotation.kind === 'line') {
      lineFeatures.push({
        ...baseFeature,
        geometry: annotation.feature as LineString,
      })
    } else if (annotation.kind === 'point') {
      pointFeatures.push({
        ...baseFeature,
        geometry: annotation.feature as Point,
      })
    } else if (annotation.kind === 'polygon') {
      polygonFeatures.push({
        ...baseFeature,
        geometry: annotation.feature as Polygon,
      })
    }
  })

  return {
    lines: {
      type: 'FeatureCollection',
      features: lineFeatures,
    } satisfies FeatureCollection<LineString>,
    points: {
      type: 'FeatureCollection',
      features: pointFeatures,
    } satisfies FeatureCollection<Point>,
    polygons: {
      type: 'FeatureCollection',
      features: polygonFeatures,
    } satisfies FeatureCollection<Polygon>,
  }
}

function toMeshFeatureCollection(meshScores: MeshScore[]) {
  const features = meshScores.map<Feature<Polygon>>((cell) => ({
    type: 'Feature',
    id: cell.id,
    properties: {
      id: cell.id,
      status: cell.status,
      priority: cell.priority,
      reason: cell.reason,
      demandPerStop: cell.metrics.demandPerStop,
    },
    geometry: cell.polygon,
  }))
  return {
    type: 'FeatureCollection' as const,
    features,
  }
}

function updateAnnotationLayers(map: Map, annotations: Annotation[]) {
  const { lines, points, polygons } = toAnnotationCollections(annotations)
  ;(map.getSource(CANDIDATE_LINE_SOURCE_ID) as GeoJSONSource | undefined)?.setData(
    lines,
  )
  ;(map.getSource(CANDIDATE_POINT_SOURCE_ID) as GeoJSONSource | undefined)?.setData(
    points,
  )
  ;(map.getSource(CANDIDATE_POLYGON_SOURCE_ID) as GeoJSONSource | undefined)?.setData(
    polygons,
  )
}

function updateMeshLayer(map: Map, meshScores: MeshScore[]) {
  const collection = toMeshFeatureCollection(meshScores)
  ;(map.getSource(MESH_SOURCE_ID) as GeoJSONSource | undefined)?.setData(
    collection,
  )
}

function updateMeshHighlight(map: Map, cellId: string | null) {
  const filter =
    cellId == null ? ['==', ['get', 'id'], '__none'] : ['==', ['get', 'id'], cellId]
  if (map.getLayer(MESH_HIGHLIGHT_LAYER_ID)) {
    map.setFilter(MESH_HIGHLIGHT_LAYER_ID, filter as any)
  }
}

export function NetworkMap() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<Map | null>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const { network, status, meshScores, activeMeshCellId } =
    useGtfsUploadStore(
      useShallow((state) => ({
        network: state.network,
        status: state.status,
        meshScores: state.meshScores,
        activeMeshCellId: state.activeMeshCellId,
      })),
    )
  const annotations = useScenarioStore((state) => {
    const candidate = getHighlightedCandidate(state)
    return candidate?.annotations ?? EMPTY_ANNOTATIONS
  })

  const placeholderMessage = useMemo(() => {
    switch (status) {
      case 'reading':
        return 'GTFSを読み込み中です'
      case 'error':
        return 'GTFSの読込に失敗しました'
      case 'idle':
        return 'GTFSを読み込むとネットワークを表示します'
      default:
        return null
    }
  }, [status])

  useEffect(() => {
    if (!containerRef.current) {
      return
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      locale: {
        'NavigationControl.ZoomIn': 'ズームイン',
        'NavigationControl.ZoomOut': 'ズームアウト',
        'NavigationControl.Compass': '方位',
      },
    })

    map.addControl(
      new maplibregl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right',
    )

    const onLoad = () => {
      map.addSource(ROUTES_SOURCE_ID, {
        type: 'geojson',
        data: EMPTY_FEATURE_COLLECTION,
      })
      map.addLayer({
        id: ROUTES_LAYER_ID,
        type: 'line',
        source: ROUTES_SOURCE_ID,
        paint: {
          'line-color': '#2563eb',
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8,
            1.2,
            12,
            3,
            16,
            6,
          ],
          'line-opacity': 0.85,
        },
      })

      map.addSource(STOPS_SOURCE_ID, {
        type: 'geojson',
        data: EMPTY_FEATURE_COLLECTION,
      })
      map.addLayer({
        id: STOPS_LAYER_ID,
        type: 'circle',
        source: STOPS_SOURCE_ID,
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8,
            2.5,
            12,
            4,
            16,
            6,
          ],
          'circle-color': '#0ea5e9',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1,
          'circle-opacity': 0.9,
        },
      })

      map.addSource(CANDIDATE_LINE_SOURCE_ID, {
        type: 'geojson',
        data: EMPTY_FEATURE_COLLECTION,
      })
      map.addSource(CANDIDATE_POINT_SOURCE_ID, {
        type: 'geojson',
        data: EMPTY_FEATURE_COLLECTION,
      })
      map.addSource(CANDIDATE_POLYGON_SOURCE_ID, {
        type: 'geojson',
        data: EMPTY_FEATURE_COLLECTION,
      })
      map.addSource(MESH_SOURCE_ID, {
        type: 'geojson',
        data: EMPTY_FEATURE_COLLECTION,
      })

      map.addLayer({
        id: CANDIDATE_POLYGON_LAYER_ID,
        type: 'fill',
        source: CANDIDATE_POLYGON_SOURCE_ID,
        paint: {
          'fill-color': '#f97316',
          'fill-opacity': 0.18,
        },
      })

      map.addLayer({
        id: CANDIDATE_POLYGON_OUTLINE_LAYER_ID,
        type: 'line',
        source: CANDIDATE_POLYGON_SOURCE_ID,
        paint: {
          'line-color': '#f97316',
          'line-width': 2,
          'line-dasharray': [1.5, 1.5],
        },
      })

      map.addLayer({
        id: CANDIDATE_LINE_LAYER_ID,
        type: 'line',
        source: CANDIDATE_LINE_SOURCE_ID,
        paint: {
          'line-color': '#f97316',
          'line-width': 4,
          'line-opacity': 0.9,
        },
      })

      map.addLayer({
        id: CANDIDATE_POINT_LAYER_ID,
        type: 'circle',
        source: CANDIDATE_POINT_SOURCE_ID,
        paint: {
          'circle-color': '#f97316',
          'circle-radius': 6,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      })
      map.addLayer({
        id: MESH_FILL_LAYER_ID,
        type: 'fill',
        source: MESH_SOURCE_ID,
        paint: {
          'fill-color': [
            'match',
            ['get', 'status'],
            'improve',
            '#f97316',
            'watch',
            '#facc15',
            '#22c55e',
          ],
          'fill-opacity': [
            'match',
            ['get', 'status'],
            'improve',
            0.42,
            'watch',
            0.28,
            0.12,
          ],
        },
      })
      map.addLayer({
        id: MESH_BORDER_LAYER_ID,
        type: 'line',
        source: MESH_SOURCE_ID,
        paint: {
          'line-color': '#f97316',
          'line-width': 1,
          'line-opacity': 0.6,
        },
      })
      map.addLayer({
        id: MESH_HIGHLIGHT_LAYER_ID,
        type: 'line',
        source: MESH_SOURCE_ID,
        paint: {
          'line-color': '#f97316',
          'line-width': 3,
        },
        filter: ['==', ['get', 'id'], '__none'],
      })

      setMapReady(true)
    }

    map.on('load', onLoad)
    mapRef.current = map

    const resizeObserver = new ResizeObserver(() => {
      map.resize()
    })
    resizeObserver.observe(containerRef.current)
    resizeObserverRef.current = resizeObserver

    return () => {
      resizeObserver.disconnect()
      resizeObserverRef.current = null
      map.off('load', onLoad)
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!mapReady || !mapRef.current) {
      return
    }
    updateNetworkData(mapRef.current, network ?? null)
  }, [network, mapReady])

  useEffect(() => {
    if (!mapReady || !mapRef.current) {
      return
    }
    updateAnnotationLayers(mapRef.current, annotations)
  }, [annotations, mapReady])

  useEffect(() => {
    if (!mapReady || !mapRef.current) {
      return
    }
    updateMeshLayer(mapRef.current, meshScores)
  }, [meshScores, mapReady])

  useEffect(() => {
    if (!mapReady || !mapRef.current) {
      return
    }
    updateMeshHighlight(mapRef.current, activeMeshCellId)
  }, [activeMeshCellId, mapReady])

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        const routeSource = mapRef.current.getSource(
          ROUTES_SOURCE_ID,
        ) as GeoJSONSource | undefined
        const stopSource = mapRef.current.getSource(
          STOPS_SOURCE_ID,
        ) as GeoJSONSource | undefined
        routeSource?.setData(EMPTY_FEATURE_COLLECTION)
        stopSource?.setData(EMPTY_FEATURE_COLLECTION)
      }
    }
  }, [])

  const showPlaceholder = !network || status === 'reading' || status === 'error'

  return (
    <div className="relative flex-1">
      <div
        ref={containerRef}
        className="h-full min-h-[280px] w-full overflow-hidden rounded-md bg-muted/40 ring-1 ring-border/50"
      />
      {showPlaceholder && placeholderMessage ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
          <div className="rounded-md border border-border/70 bg-background/90 px-4 py-3 text-center text-xs text-muted-foreground shadow-sm backdrop-blur">
            {placeholderMessage}
          </div>
        </div>
      ) : null}
    </div>
  )
}
