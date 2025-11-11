import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { KpiKey } from '@/shared/types/kpi'
import { KPI_PRIORITY_ORDER } from '@/shared/types/kpi'

export type ScenarioFilter = 'all' | 'recommended' | 'achieved'
export type ScenarioSortMode = 'priority' | 'support'

interface ScenarioControlsState {
  priorityKpi: KpiKey
  filter: ScenarioFilter
  sortMode: ScenarioSortMode
  setPriorityKpi: (kpi: KpiKey) => void
  toggleFilter: (target: Exclude<ScenarioFilter, 'all'>) => void
  resetFilter: () => void
  setSortMode: (mode: ScenarioSortMode) => void
}

export const useScenarioControlsStore = create<ScenarioControlsState>()(
  immer((set, get) => ({
    priorityKpi: KPI_PRIORITY_ORDER[0],
    filter: 'all',
    sortMode: 'priority',
    setPriorityKpi: (kpi) =>
      set((state) => {
        state.priorityKpi = kpi
      }),
    toggleFilter: (target) =>
      set((state) => {
        const current = get().filter
        const next = current === target ? 'all' : target
        state.filter = next
      }),
    resetFilter: () =>
      set((state) => {
        state.filter = 'all'
      }),
    setSortMode: (mode) =>
      set((state) => {
        state.sortMode = mode
      }),
  })),
)
