import { useEffect, useMemo, useRef, useState } from 'react'
import maplibregl, { type GeoJSONSource, type Map } from 'maplibre-gl'
import type { FeatureCollection, LineString, Point } from 'geojson'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useGtfsUploadStore } from '@/shared/state/gtfs-upload-store'
import type { Network } from '@/entities/gtfs/types'

const MAP_STYLE_URL = 'https://demotiles.maplibre.org/style.json'
const ROUTES_SOURCE_ID = 'network-routes'
const ROUTES_LAYER_ID = 'network-routes-line'
const STOPS_SOURCE_ID = 'network-stops'
const STOPS_LAYER_ID = 'network-stops-circle'

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
    const routes = toRouteCollection(network)
    routeSource?.setData(routes)
  } else {
    routeSource?.setData(EMPTY_FEATURE_COLLECTION)
  }

  if (network && network.stops.length > 0) {
    const stops = toStopCollection(network)
    stopSource?.setData(stops)
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
          maxZoom: 14,
          duration: 800,
          essential: true,
        })
      }
    }
  }
}

export function NetworkMap() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<Map | null>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const [mapReady, setMapReady] = useState(false)

  const network = useGtfsUploadStore((state) => state.network)
  const status = useGtfsUploadStore((state) => state.status)

  const placeholderMessage = useMemo(() => {
    switch (status) {
      case 'reading':
        return 'GTFSを解析中です…'
      case 'error':
        return 'GTFSの読み込みでエラーが発生しました。再試行してください。'
      default:
        return 'GTFSを読み込むと路線と停留所が地図に表示されます。'
    }
  }, [status])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: [139.7671, 35.6812],
      zoom: 9,
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
      {showPlaceholder ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
          <div className="rounded-md border border-border/70 bg-background/90 px-4 py-3 text-center text-xs text-muted-foreground shadow-sm backdrop-blur">
            {placeholderMessage}
          </div>
        </div>
      ) : null}
    </div>
  )
}
