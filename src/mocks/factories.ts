import type { CandidateKpiKey } from './types'
import type { MockCandidate } from './types'

const MEASURES = ['減便', '停留所統廃合', '区間短縮', 'DRT導入'] as const
const STRENGTHS = ['弱', '中', '強'] as const
const GEOMETRY_KINDS = ['line', 'point', 'polygon'] as const
const INDICATORS = ['混雑率↑', '収支悪化', '需要分散', 'アクセス不均衡', '高齢化率↑'] as const
const AREAS = ['幹線北部', '南端区間', '中心医療圏', '連節支線', '丘陵地区'] as const

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
        note: '周辺停留所の統合候補',
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
      note: '幹線への短絡ルート案',
    },
  ]
}

function createReason(index: number, measure: (typeof MEASURES)[number]) {
  const indicator = INDICATORS[index % INDICATORS.length]
  const area = AREAS[index % AREAS.length]
  return `${indicator} × ${area} × ${measure}`
}

function createTitle(index: number, measure: (typeof MEASURES)[number]) {
  const prefix = ['A', 'B', 'C', 'D', 'E', 'F'][index % 6]
  return `${prefix}${index + 1}案: ${measure}`
}

function createEvidence(priorityKpi: CandidateKpiKey) {
  const metricMap: Record<CandidateKpiKey, { label: string; threshold: string }> = {
    coverageRate: { label: 'カバー率', threshold: '>= 80%' },
    avgTravelTime: { label: '平均所要時間', threshold: '<= 32 分' },
    operatingCost: { label: '運行コスト', threshold: '<= 900 千円/日' },
    serviceLevelRetention: { label: 'サービスレベル維持率', threshold: '>= 95%' },
  }
  const meta = metricMap[priorityKpi]
  return {
    metric: meta.label,
    threshold: meta.threshold,
    dataset: `SDT-${priorityKpi} v1.2`,
    updatedAt: new Date().toISOString(),
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
    const annotations = createAnnotation(index)

    return {
      id: crypto.randomUUID(),
      title: createTitle(index, measure),
      reason: createReason(index, measure),
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
      evidence: createEvidence(priorityKpi),
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
