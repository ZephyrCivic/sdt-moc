import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { GtfsEncoding } from '@/entities/gtfs/schema'
import { parseGtfsZip, summarizeGtfs } from '@/entities/gtfs/parser'
import type {
  GtfsImportResult,
  GtfsImportSummary,
} from '@/entities/gtfs/parser'

type UploadStatus = 'idle' | 'ready' | 'reading' | 'error'

export interface GtfsUploadState {
  file: File | null
  encoding: GtfsEncoding
  status: UploadStatus
  error: string | null
  lastUpdatedAt: number | null
  data: GtfsImportResult | null
  summary: GtfsImportSummary | null
  setFile: (file: File | null) => void
  setEncoding: (encoding: GtfsEncoding) => void
  setStatus: (status: UploadStatus) => void
  setError: (message: string | null) => void
  loadGtfs: () => Promise<void>
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
> = {
  file: null,
  encoding: 'auto',
  status: 'idle',
  error: null,
  lastUpdatedAt: null,
  data: null,
  summary: null,
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
        set((state) => {
          state.data = parsed
          state.summary = summary
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
    reset: () => set(() => ({ ...initialState })),
  })),
)
