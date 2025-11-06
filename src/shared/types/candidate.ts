import { z } from 'zod'
import {
  lineStringSchema,
  pointSchema,
  polygonSchema,
} from './network'
import { kpiSchema } from './kpi'

export const candidateIdSchema = z.string().min(1)

export const measureSchema = z.enum([
  '減便',
  '停留所統廃合',
  '区間短縮',
  'DRTゾーン',
])

export const strengthSchema = z.enum(['弱', '中', '強'])

export const geometryKindSchema = z.enum(['line', 'point', 'polygon'])

export const annotationSchema = z.object({
  kind: geometryKindSchema,
  feature: z.union([lineStringSchema, pointSchema, polygonSchema]),
  note: z.string().min(1).optional(),
})

export const diversityFlagsSchema = z.object({
  spatial: z.boolean(),
  measureMix: z.boolean(),
  strengthMix: z.boolean(),
})

export const candidateStatusSchema = z.enum([
  'not_evaluated',
  'evaluating',
  'achieved',
  'not_achieved',
])

export const candidateSchema = z.object({
  id: candidateIdSchema,
  title: z.string().min(1),
  reason: z.string().min(1),
  measure: measureSchema,
  strength: strengthSchema,
  annotations: z.array(annotationSchema),
  diversityFlags: diversityFlagsSchema,
  status: candidateStatusSchema,
  progress: z.number().min(0).max(100).optional(),
  lastUpdatedAt: z.string().datetime().optional(),
  kpi: kpiSchema.optional(),
  recommended: z.boolean().optional(),
})

export type CandidateId = z.infer<typeof candidateIdSchema>
export type Measure = z.infer<typeof measureSchema>
export type Strength = z.infer<typeof strengthSchema>
export type GeometryKind = z.infer<typeof geometryKindSchema>
export type Annotation = z.infer<typeof annotationSchema>
export type CandidateStatus = z.infer<typeof candidateStatusSchema>
export type Candidate = z.infer<typeof candidateSchema>

