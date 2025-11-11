import type { LineString, Point, Polygon } from 'geojson'

export type CandidateKpiKey =
  | 'coverageRate'
  | 'avgTravelTime'
  | 'operatingCost'
  | 'serviceLevelRetention'

export interface MockCandidate {
  id: string
  title: string
  reason: string
  measure: '減便' | '停留所統廃合' | '区間短縮' | 'DRT導入'
  strength: '弱' | '中' | '強'
  annotations: Array<{
    kind: 'line' | 'point' | 'polygon'
    feature: Point | LineString | Polygon
    note?: string
  }>
  diversityFlags: {
    spatial: boolean
    measureMix: boolean
    strengthMix: boolean
  }
  status: 'not_evaluated' | 'evaluating' | 'achieved' | 'not_achieved'
  progress: number
  lastUpdatedAt: string
  priorityKpi: CandidateKpiKey
  kpi?: {
    coverageRate: number
    avgTravelTime: number
    operatingCost: number
    serviceLevelRetention: number
  }
  recommended?: boolean
}
