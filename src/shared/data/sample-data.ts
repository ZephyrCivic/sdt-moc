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
    title: '市内循環の末端短縮案',
    reason: '混雑率↑ × 末端区間 × 区間短縮',
    measure: '区間短縮',
    strength: '中',
    annotations: [
      {
        kind: 'line',
        feature: {
          type: 'LineString',
          coordinates: [
            [139.72, 35.69],
            [139.71, 35.69],
          ],
        },
        note: '末端2停留所を短縮',
      },
    ],
    diversityFlags: {
      spatial: true,
      measureMix: true,
      strengthMix: true,
    },
    status: 'not_evaluated',
  },
  {
    id: 'C02',
    title: '停留所統廃合（S2-S3 統合）',
    reason: '乗降集中 × 商業軸 × 停留所統廃合',
    measure: '停留所統廃合',
    strength: '弱',
    annotations: [
      {
        kind: 'point',
        feature: {
          type: 'Point',
          coordinates: [139.715, 35.69],
        },
        note: 'S2/S3を統合してダブルベイ化',
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
  },
  {
    id: 'C03',
    title: 'DRTゾーン導入（郊外）',
    reason: '需要散在 × 外縁部 × DRTゾーン',
    measure: 'DRTゾーン',
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
        note: '外縁部にフレキシブル運行を導入',
      },
    ],
    diversityFlags: {
      spatial: true,
      measureMix: true,
      strengthMix: true,
    },
    status: 'not_evaluated',
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

