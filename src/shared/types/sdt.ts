import { z } from 'zod'
import { candidateIdSchema } from './candidate'
import { kpiSchema } from './kpi'

export const sdtResultSchema = z.object({
  kpi: kpiSchema,
  achieved: z.boolean(),
})

export const sdtProgressEventSchema = z.object({
  candidateId: candidateIdSchema,
  progress: z.number().min(0).max(100),
  lastUpdatedAt: z.string().datetime(),
  done: z.boolean().optional(),
  result: sdtResultSchema.optional(),
  errorCode: z.string().min(1).optional(),
})

export type SdtResult = z.infer<typeof sdtResultSchema>
export type SdtProgressEvent = z.infer<typeof sdtProgressEventSchema>

