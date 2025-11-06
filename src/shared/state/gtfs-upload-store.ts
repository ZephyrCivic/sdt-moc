import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { GtfsEncoding } from '@/entities/gtfs/schema'

type UploadStatus = 'idle' | 'ready' | 'reading' | 'error'

export interface GtfsUploadState {
  file: File | null
  encoding: GtfsEncoding
  status: UploadStatus
  error: string | null
  lastUpdatedAt: number | null
  setFile: (file: File | null) => void
  setEncoding: (encoding: GtfsEncoding) => void
  setStatus: (status: UploadStatus) => void
  setError: (message: string | null) => void
  reset: () => void
}

const initialState = {
  file: null,
  encoding: 'auto' as GtfsEncoding,
  status: 'idle' as UploadStatus,
  error: null,
  lastUpdatedAt: null,
}

export const useGtfsUploadStore = create<GtfsUploadState>()(
  immer((set) => ({
    ...initialState,
    setFile: (file) =>
      set((state) => {
        state.file = file
        state.status = file ? 'ready' : 'idle'
        state.error = null
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
    reset: () => set(() => ({ ...initialState })),
  })),
)
