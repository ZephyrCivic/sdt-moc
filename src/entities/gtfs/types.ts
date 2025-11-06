import type { LineString } from 'geojson'

export interface Stop {
  id: string
  name: string
  lon: number
  lat: number
}

export interface Route {
  id: string
  name: string
  geometry: LineString
  stopIds: string[]
}

export interface Usage {
  stopId: string
  boardings: number
  alightings: number
}

export interface Network {
  stops: Stop[]
  routes: Route[]
  usage?: Usage[]
}
