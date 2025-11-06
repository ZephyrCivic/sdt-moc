import type { CandidateKpiKey } from './types'
import type { MockCandidate } from './types'

const MEASURES = ['減便', '停留所統合', '区間短縮', 'DRT導入'] as const
const STRENGTHS = ['弱', '中', '強'] as const
const GEOMETRY_KINDS = ['line', 'point', 'polygon'] as const

const SAMPLE_POINTS = [
  [139.063, 36.326],
  [139.067, 36.329],
  [139.071, 36.331],
  [139.076, 36.334],
]

function createAnnotation(index: number) {
  const kind = GEOMETRY_KINDS[index % GEOMETRY_KINDS.length]
  if (kind === 'point') {
    const point = SAMPLE_POINTS[index % SAMPLE_POINTS.length]
    return [
      {
        kind,
        feature: {
          type: 'Point' as const,
          coordinates: point,
        },
        note: '主要停留所の統合案',
      },
    ]
  }

  if (kind === 'polygon') {
    const base = SAMPLE_POINTS.map(([lon, lat]) => [lon + 0.01, lat + 0.01])
    return [
      {
        kind,
        feature: {
          type: 'Polygon' as const,
          coordinates: [[...base, base[0]]],
        },
        note: 'DRT導入を想定するサービスエリア',
      },
    ]
  }

  const start = SAMPLE_POINTS[index % SAMPLE_POINTS.length]
  const end = SAMPLE_POINTS[(index + 2) % SAMPLE_POINTS.length]
  return [
    {
      kind: 'line' as const,
      feature: {
        type: 'LineString' as const,
        coordinates: [start, end],
      },
      note: '現行便の短縮区間候補',
    },
  ]
}

function createReasonTitle(
  measure: (typeof MEASURES)[number],
  strength: (typeof STRENGTHS)[number],
  index: number,
) {
  const prefix = ['A', 'B', 'C', 'D', 'E', 'F'][index % 6]
  return {
    title: `${prefix}${index + 1}番案: ${measure}`,
    reason: `${measure}を${strength}強度で実施し、乗車効率と路線持続性を両立します。`,
  }
}

function generateDiversityFlags(index: number) {
  return {
    spatial: index % 2 === 0,
    measureMix: index % 3 === 0,
    strengthMix: index % 4 === 0,
  }
}

export function generateMockCandidates(
  priorityKpi: CandidateKpiKey,
): MockCandidate[] {
  return Array.from({ length: 10 }).map((_, index) => {
    const measure = MEASURES[index % MEASURES.length]
    const strength = STRENGTHS[index % STRENGTHS.length]
    const { title, reason } = createReasonTitle(measure, strength, index)
    const annotations = createAnnotation(index)

    return {
      id: crypto.randomUUID(),
      title,
      reason,
      measure,
      strength,
      annotations,
      diversityFlags: generateDiversityFlags(index),
      status: 'not_evaluated',
      priorityKpi,
      kpi: undefined,
      recommended: false,
      progress: 0,
      lastUpdatedAt: new Date().toISOString(),
    }
  })
}

export function calculateMockKpi(seed: string) {
  const base = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const rand = (offset: number, min: number, max: number) => {
    const range = max - min
    const value = (Math.sin(base + offset) + 1) / 2
    return min + value * range
  }

  return {
    coverageRate: Number(rand(1, 55, 98).toFixed(1)),
    avgTravelTime: Number(rand(2, 15, 45).toFixed(1)),
    operatingCost: Number(rand(3, 70, 180).toFixed(1)),
    serviceLevelRetention: Number(rand(4, 60, 100).toFixed(1)),
  }
}
