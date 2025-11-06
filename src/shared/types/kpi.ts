import { z } from 'zod'

export const kpiSchema = z.object({
  coverageRate: z.number(),
  avgTravelTime: z.number(),
  operatingCost: z.number(),
  serviceLevelRetention: z.number(),
})

export type KPI = z.infer<typeof kpiSchema>

