import { networkSchema } from '@/shared/types/network'
import { candidateSchema } from '@/shared/types/candidate'
import { sdtProgressEventSchema } from '@/shared/types/sdt'
import type { Network } from '@/shared/types/network'
import type { Candidate } from '@/shared/types/candidate'
import type { SdtProgressEvent } from '@/shared/types/sdt'
import type { GtfsImportSummary } from '@/entities/gtfs/parser'

const rawNetwork = {
  stops: [
    { id: 'S1', name: 'Alpha', lon: 139.7, lat: 35.69 },
    { id: 'S2', name: 'Bravo', lon: 139.71, lat: 35.69 },
    { id: 'S3', name: 'Charlie', lon: 139.72, lat: 35.69 },
    { id: 'S4', name: 'Delta', lon: 139.73, lat: 35.688 },
  ],
  routes: [
    {
      id: 'R1',
      name: '市内循環（西部）',
      geometry: {
        type: 'LineString',
        coordinates: [
          [139.7, 35.69],
          [139.71, 35.69],
          [139.72, 35.69],
        ],
      },
      stopIds: ['S1', 'S2', 'S3'],
    },
    {
      id: 'R2',
      name: '住宅地シャトル',
      geometry: {
        type: 'LineString',
        coordinates: [
          [139.71, 35.69],
          [139.73, 35.688],
        ],
      },
      stopIds: ['S2', 'S4'],
    },
  ],
  usage: [
    { stopId: 'S1', boardings: 120, alightings: 110 },
    { stopId: 'S2', boardings: 240, alightings: 230 },
    { stopId: 'S3', boardings: 180, alightings: 175 },
    { stopId: 'S4', boardings: 90, alightings: 95 },
  ],
}


const rawCandidates = [
  {
    id: 'C01',
    title: '幹線リムジン南北短縮',
    reason: '混雑率↑ × 幹線北部 × 区間短縮',
    measure: '区間短縮',
    strength: '中',
    annotations: [
      {
        kind: 'line',
        feature: {
          type: 'LineString',
          coordinates: [
            [139.72, 35.692],
            [139.71, 35.689],
          ],
        },
        note: '北部末端2停留所を圧縮',
      },
    ],
    diversityFlags: {
      spatial: true,
      measureMix: true,
      strengthMix: true,
    },
    status: 'not_evaluated',
    evidence: {
      metric: 'カバー率',
      threshold: '>= 80%',
      dataset: 'SDT-coverage v1.2',
      updatedAt: '2025-05-01T08:00:00Z',
    },
  },
  {
    id: 'C02',
    title: '停留所集約（S2-S3 区間）',
    reason: '収支悪化 × 連節支線 × 停留所統廃合',
    measure: '停留所統廃合',
    strength: '弱',
    annotations: [
      {
        kind: 'point',
        feature: {
          type: 'Point',
          coordinates: [139.715, 35.69],
        },
        note: 'S2/S3を統合してダブルレーン化',
      },
    ],
    diversityFlags: {
      spatial: true,
      measureMix: true,
      strengthMix: true,
    },
    status: 'evaluating',
    progress: 60,
    lastUpdatedAt: '2025-05-01T08:30:00Z',
    evidence: {
      metric: '運行コスト',
      threshold: '<= 900 千円/日',
      dataset: 'SDT-cost beta',
      updatedAt: '2025-05-01T08:20:00Z',
    },
  },
  {
    id: 'C03',
    title: 'DRT導入エリア（北側）',
    reason: '高齢化率↑ × 丘陵地区 × DRT導入',
    measure: 'DRT導入',
    strength: '強',
    annotations: [
      {
        kind: 'polygon',
        feature: {
          type: 'Polygon',
          coordinates: [
            [
              [139.728, 35.686],
              [139.734, 35.686],
              [139.734, 35.692],
              [139.728, 35.692],
              [139.728, 35.686],
            ],
          ],
        },
        note: '丘陵地にフレキシブルなサービスを想定',
      },
    ],
    diversityFlags: {
      spatial: true,
      measureMix: true,
      strengthMix: true,
    },
    status: 'not_evaluated',
    evidence: {
      metric: 'サービスレベル維持率',
      threshold: '>= 95%',
      dataset: 'SDT-service v1.0',
      updatedAt: '2025-05-01T07:55:00Z',
    },
  },
  {
    id: 'C04',
    title: '南側区間の減便＋区間短縮',
    reason: '利用低迷 × 南端区間 × 減便',
    measure: '減便',
    strength: '弱',
    annotations: [
      {
        kind: 'line',
        feature: {
          type: 'LineString',
          coordinates: [
            [139.705, 35.685],
            [139.71, 35.685],
          ],
        },
        note: 'ピーク外の運行を間引き',
      },
    ],
    diversityFlags: {
      spatial: true,
      measureMix: true,
      strengthMix: true,
    },
    status: 'achieved',
    kpi: {
      coverageRate: 82.1,
      avgTravelTime: 31.4,
      operatingCost: 870,
      serviceLevelRetention: 95.2,
    },
    lastUpdatedAt: '2025-05-01T09:05:00Z',
    evidence: {
      metric: '平均所要時間',
      threshold: '<= 32 分',
      dataset: 'SDT-travel v1.1',
      updatedAt: '2025-05-01T09:00:00Z',
    },
  },
  {
    id: 'C05',
    title: '幹線中央の停留所統廃合',
    reason: 'アクセス不均衡 × 中央区間 × 停留所統廃合',
    measure: '停留所統廃合',
    strength: '中',
    annotations: [
      {
        kind: 'line',
        feature: {
          type: 'LineString',
          coordinates: [
            [139.71, 35.688],
            [139.72, 35.688],
          ],
        },
        note: '中央2停留所を集約',
      },
    ],
    diversityFlags: {
      spatial: true,
      measureMix: true,
      strengthMix: true,
    },
    status: 'not_achieved',
    kpi: {
      coverageRate: 73.8,
      avgTravelTime: 36.1,
      operatingCost: 910,
      serviceLevelRetention: 90.2,
    },
    lastUpdatedAt: '2025-05-01T09:12:00Z',
    evidence: {
      metric: 'カバー率',
      threshold: '>= 75%',
      dataset: 'SDT-coverage v1.2',
      updatedAt: '2025-05-01T09:10:00Z',
    },
  },
  {
    id: 'C06',
    title: '停留所間隔の時間帯調整',
    reason: 'サービス過剰 × 中心市街地 × 減便',
    measure: '減便',
    strength: '中',
    annotations: [
      {
        kind: 'line',
        feature: {
          type: 'LineString',
          coordinates: [
            [139.708, 35.69],
            [139.712, 35.69],
          ],
        },
        note: '夜間のみ本数削減',
      },
    ],
    diversityFlags: {
      spatial: true,
      measureMix: true,
      strengthMix: true,
    },
    status: 'evaluating',
    progress: 35,
    lastUpdatedAt: '2025-05-01T08:55:00Z',
    evidence: {
      metric: '運行コスト',
      threshold: '<= 920 千円/日',
      dataset: 'SDT-cost beta',
      updatedAt: '2025-05-01T08:50:00Z',
    },
  },
  {
    id: 'C07',
    title: 'DRT導入エリア（南側）',
    reason: '需要分散 × 南丘陵部 × DRT導入',
    measure: 'DRT導入',
    strength: '強',
    annotations: [
      {
        kind: 'polygon',
        feature: {
          type: 'Polygon',
          coordinates: [
            [
              [139.722, 35.682],
              [139.728, 35.682],
              [139.728, 35.688],
              [139.722, 35.688],
              [139.722, 35.682],
            ],
          ],
        },
        note: '南側丘陵エリアを面的サービスで代替',
      },
    ],
    diversityFlags: {
      spatial: true,
      measureMix: true,
      strengthMix: true,
    },
    status: 'not_evaluated',
    evidence: {
      metric: 'サービスレベル維持率',
      threshold: '>= 93%',
      dataset: 'SDT-service v1.0',
      updatedAt: '2025-05-01T07:50:00Z',
    },
  },
  {
    id: 'C08',
    title: '末端フィーダー強化',
    reason: 'アクセス不均衡 × 末端支線 × 区間短縮',
    measure: '区間短縮',
    strength: '弱',
    annotations: [
      {
        kind: 'line',
        feature: {
          type: 'LineString',
          coordinates: [
            [139.698, 35.691],
            [139.703, 35.689],
          ],
        },
        note: '末端区間をシャトル化',
      },
    ],
    diversityFlags: {
      spatial: true,
      measureMix: true,
      strengthMix: true,
    },
    status: 'evaluating',
    progress: 15,
    lastUpdatedAt: '2025-05-01T08:40:00Z',
    evidence: {
      metric: '平均所要時間',
      threshold: '<= 30 分',
      dataset: 'SDT-travel v1.1',
      updatedAt: '2025-05-01T08:35:00Z',
    },
  },
  {
    id: 'C09',
    title: '中心部の停留所増設とDRT接続',
    reason: '高齢化率↑ × 中心医療圏 × DRT導入',
    measure: 'DRT導入',
    strength: '中',
    annotations: [
      {
        kind: 'polygon',
        feature: {
          type: 'Polygon',
          coordinates: [
            [
              [139.71, 35.687],
              [139.717, 35.687],
              [139.717, 35.693],
              [139.71, 35.693],
              [139.71, 35.687],
            ],
          ],
        },
        note: '中心部でDRTと幹線を接続',
      },
    ],
    diversityFlags: {
      spatial: true,
      measureMix: true,
      strengthMix: true,
    },
    status: 'achieved',
    kpi: {
      coverageRate: 88.5,
      avgTravelTime: 28.8,
      operatingCost: 930,
      serviceLevelRetention: 97.1,
    },
    lastUpdatedAt: '2025-05-01T09:20:00Z',
    recommended: true,
    evidence: {
      metric: 'カバー率',
      threshold: '>= 85%',
      dataset: 'SDT-coverage v1.2',
      updatedAt: '2025-05-01T09:18:00Z',
    },
  },
  {
    id: 'C10',
    title: '支線の停留所統廃合＋減便',
    reason: '混雑率↓ × 支線エリア × 停留所統廃合',
    measure: '停留所統廃合',
    strength: '中',
    annotations: [
      {
        kind: 'line',
        feature: {
          type: 'LineString',
          coordinates: [
            [139.7, 35.684],
            [139.706, 35.684],
          ],
        },
        note: '支線4停留所→2停留所へ圧縮',
      },
    ],
    diversityFlags: {
      spatial: true,
      measureMix: true,
      strengthMix: true,
    },
    status: 'not_evaluated',
    evidence: {
      metric: '運行コスト',
      threshold: '<= 880 千円/日',
      dataset: 'SDT-cost beta',
      updatedAt: '2025-05-01T07:45:00Z',
    },
  },
]

const rawProgress = [
  {
    candidateId: 'C01',
    progress: 100,
    lastUpdatedAt: '2025-05-01T09:05:00Z',
    done: true,
    result: {
      kpi: {
        coverageRate: 84.2,
        avgTravelTime: 24.5,
        operatingCost: 92.1,
        serviceLevelRetention: 88.4,
      },
      achieved: true,
    },
  },
  {
    candidateId: 'C02',
    progress: 60,
    lastUpdatedAt: '2025-05-01T08:30:00Z',
  },
  {
    candidateId: 'C03',
    progress: 0,
    lastUpdatedAt: '2025-05-01T08:10:00Z',
  },
]

export const sampleNetwork: Network = networkSchema.parse(rawNetwork)

export const sampleGtfsSummary: GtfsImportSummary = {
  stopCount: sampleNetwork.stops.length,
  routeCount: sampleNetwork.routes.length,
  tripCount: 0,
  shapeCount: sampleNetwork.routes.reduce(
    (total, route) => total + route.geometry.coordinates.length,
    0,
  ),
  stopTimeCount: 0,
}

export const sampleCandidates: Candidate[] =
  candidateSchema.array().parse(rawCandidates)

export const sampleProgressEvents: SdtProgressEvent[] =
  sdtProgressEventSchema.array().parse(rawProgress)

