import { z } from 'zod'

export const kpiSchema = z.object({
  coverageRate: z.number(),
  avgTravelTime: z.number(),
  operatingCost: z.number(),
  serviceLevelRetention: z.number(),
})

export type KPI = z.infer<typeof kpiSchema>

export type KpiKey = keyof KPI

export interface KpiDefinition {
  key: KpiKey
  label: string
  unit: string
  description: string
}

export const KPI_DEFINITIONS: Record<KpiKey, KpiDefinition> = {
  coverageRate: {
    key: 'coverageRate',
    label: 'カバー率',
    unit: '%',
    description: '対象エリアに対して提供できるカバー範囲',
  },
  avgTravelTime: {
    key: 'avgTravelTime',
    label: '平均所要時間',
    unit: '分',
    description: '利用者が乗車区間で要する平均移動時間',
  },
  operatingCost: {
    key: 'operatingCost',
    label: '運行コスト',
    unit: '千円/日',
    description: '1日あたりの概算運行コスト（千円単位）',
  },
  serviceLevelRetention: {
    key: 'serviceLevelRetention',
    label: 'サービスレベル維持率',
    unit: '%',
    description: '現行サービス水準を維持できる割合',
  },
}

export const KPI_PRIORITY_ORDER: KpiKey[] = [
  'coverageRate',
  'avgTravelTime',
  'operatingCost',
  'serviceLevelRetention',
]
