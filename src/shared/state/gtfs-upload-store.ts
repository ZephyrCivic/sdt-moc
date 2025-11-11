import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { GtfsEncoding } from '@/entities/gtfs/schema'
import {
  parseGtfsZip,
  summarizeGtfs,
  type GtfsImportResult,
  type GtfsImportSummary,
} from '@/entities/gtfs/parser'
import { buildNetwork } from '@/entities/gtfs/normalizer'
import type { Network } from '@/entities/gtfs/types'
import {
  sampleGtfsSummary,
  sampleNetwork,
} from '@/shared/data/sample-data'
import {
  buildMeshScores,
  type MeshScore,
} from '@/shared/lib/mesh-grid'

type UploadStatus = 'idle' | 'ready' | 'reading' | 'error'

export interface GtfsUploadState {
  file: File | null
  encoding: GtfsEncoding
  status: UploadStatus
  error: string | null
  lastUpdatedAt: number | null
  data: GtfsImportResult | null
  summary: GtfsImportSummary | null
  network: Network | null
  meshScores: MeshScore[]
  activeMeshCellId: string | null
  setFile: (file: File | null) => void
  setEncoding: (encoding: GtfsEncoding) => void
  setStatus: (status: UploadStatus) => void
  setError: (message: string | null) => void
  loadGtfs: () => Promise<void>
  loadSampleNetwork: () => void
  setActiveMeshCell: (cellId: string | null) => void
  reset: () => void
}

const initialState: Pick<
  GtfsUploadState,
  | 'file'
  | 'encoding'
  | 'status'
  | 'error'
  | 'lastUpdatedAt'
  | 'data'
  | 'summary'
  | 'network'
  | 'meshScores'
  | 'activeMeshCellId'
> = {
  file: null,
  encoding: 'auto',
  status: 'idle',
  error: null,
  lastUpdatedAt: null,
  data: null,
  summary: null,
  network: null,
  meshScores: [],
  activeMeshCellId: null,
}

export const useGtfsUploadStore = create<GtfsUploadState>()(
  immer((set, get) => ({
    ...initialState,
    setFile: (file) =>
      set((state) => {
        state.file = file
        state.status = file ? 'ready' : 'idle'
        state.error = null
        state.data = null
        state.summary = null
        state.network = null
        state.meshScores = []
        state.activeMeshCellId = null
        state.lastUpdatedAt = file ? Date.now() : state.lastUpdatedAt
      }),
    setEncoding: (encoding) =>
      set((state) => {
        state.encoding = encoding
      }),
    setStatus: (status) =>
      set((state) => {
        state.status = status
      }),
    setError: (message) =>
      set((state) => {
        state.error = message
        if (message) {
          state.status = 'error'
        }
      }),
    loadGtfs: async () => {
      const file = get().file
      const encoding = get().encoding
      if (!file) {
        set((state) => {
          state.error = '先にGTFS ZIPファイルを選択してください'
          state.status = 'error'
        })
        return
      }

      set((state) => {
        state.status = 'reading'
        state.error = null
      })

      try {
        const parsed = await parseGtfsZip(file, encoding)
        const summary = summarizeGtfs(parsed)
        const network = buildNetwork(parsed)
        set((state) => {
          state.data = parsed
          state.summary = summary
          state.network = network
          state.meshScores = buildMeshScores(network)
          state.activeMeshCellId = null
          state.status = 'ready'
          state.lastUpdatedAt = Date.now()
        })
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'GTFSの読み込みに失敗しました'
        set((state) => {
          state.error = message
          state.status = 'error'
        })
      }
    },
    loadSampleNetwork: () =>
      set((state) => {
        state.file = null
        state.data = null
        state.summary = sampleGtfsSummary
        state.network = sampleNetwork
        state.meshScores = buildMeshScores(sampleNetwork)
        state.activeMeshCellId = null
        state.status = 'ready'
        state.error = null
        state.lastUpdatedAt = Date.now()
        state.encoding = 'auto'
      }),
    setActiveMeshCell: (cellId) =>
      set((state) => {
        state.activeMeshCellId = cellId
      }),
    reset: () => set(() => ({ ...initialState })),
  })),
)
