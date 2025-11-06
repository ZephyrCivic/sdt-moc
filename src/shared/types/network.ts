import { z } from 'zod'

export const coordinateSchema = z.tuple([z.number(), z.number()])

export const lineStringSchema = z.object({
  type: z.literal('LineString'),
  coordinates: z.array(coordinateSchema).min(2),
})

export const pointSchema = z.object({
  type: z.literal('Point'),
  coordinates: coordinateSchema,
})

export const polygonSchema = z.object({
  type: z.literal('Polygon'),
  coordinates: z.array(z.array(coordinateSchema).min(4)).min(1),
})

export const stopSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  lon: z.number(),
  lat: z.number(),
})

export const routeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  geometry: lineStringSchema,
  stopIds: z.array(z.string().min(1)).min(1),
})

export const usageSchema = z.object({
  stopId: z.string().min(1),
  boardings: z.number().min(0),
  alightings: z.number().min(0),
})

export const networkSchema = z.object({
  stops: z.array(stopSchema),
  routes: z.array(routeSchema),
  usage: z.array(usageSchema).optional(),
})

export type Coordinate = z.infer<typeof coordinateSchema>
export type LineString = z.infer<typeof lineStringSchema>
export type Point = z.infer<typeof pointSchema>
export type Polygon = z.infer<typeof polygonSchema>
export type Stop = z.infer<typeof stopSchema>
export type Route = z.infer<typeof routeSchema>
export type Usage = z.infer<typeof usageSchema>
export type Network = z.infer<typeof networkSchema>
