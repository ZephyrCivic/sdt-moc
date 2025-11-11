import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Candidate, CandidateId } from '@/shared/types/candidate'
import { sampleCandidates } from '@/shared/data/sample-data'
import type { KpiKey } from '@/shared/types/kpi'
import {
  evaluateScenarios,
  generateScenarios,
  subscribeSdtProgress,
} from '@/shared/api/scenario-api'

export type ScenarioStatus = 'idle' | 'generating' | 'ready' | 'evaluating'

const initialCandidates: Candidate[] = sampleCandidates

let progressUnsubscribe: (() => void) | null = null

function stopProgressStream() {
  if (progressUnsubscribe) {
    progressUnsubscribe()
    progressUnsubscribe = null
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : '不明なエラーが発生しました'
}

interface ScenarioState {
  candidates: Candidate[]
  status: ScenarioStatus
  error: string | null
  activeCandidateId: CandidateId | null
  hoveredCandidateId: CandidateId | null
  generate: (priorityKpi: KpiKey) => Promise<void>
  evaluate: (candidateIds?: CandidateId[]) => Promise<void>
  retryCandidate: (candidateId: CandidateId) => Promise<void>
  setActiveCandidate: (candidateId: CandidateId | null) => void
  setHoveredCandidate: (candidateId: CandidateId | null) => void
  updateCandidate: (
    candidateId: CandidateId,
    updater: (candidate: Candidate) => void,
  ) => void
  clearError: () => void
}

export const useScenarioStore = create<ScenarioState>()(
  immer((set, get) => ({
    candidates: initialCandidates,
    status: 'ready',
    error: null,
    activeCandidateId: null,
    hoveredCandidateId: null,
    async generate(priorityKpi) {
      stopProgressStream()
      set((state) => {
        state.status = 'generating'
        state.error = null
      })
      try {
        const candidates = await generateScenarios(priorityKpi)
        set((state) => {
          state.candidates = candidates.map((candidate) => ({
            ...candidate,
            status: 'not_evaluated',
            recommended: false,
            progress: 0,
          }))
          state.activeCandidateId = null
          state.hoveredCandidateId = null
          state.status = 'ready'
        })
      } catch (error) {
        set((state) => {
          state.error = getErrorMessage(error)
          state.status = 'idle'
        })
      }
    },
    async evaluate(candidateIds) {
      const targetIds =
        candidateIds && candidateIds.length > 0
          ? candidateIds
          : get().candidates.map((candidate) => candidate.id)

      if (targetIds.length === 0) {
        set((state) => {
          state.error = '評価対象の候補がありません'
        })
        return
      }

      const isBulk = !candidateIds

      set((state) => {
        state.error = null
        if (isBulk) {
          state.status = 'evaluating'
        }
        state.candidates.forEach((candidate) => {
          if (targetIds.includes(candidate.id)) {
            candidate.status = 'evaluating'
            candidate.progress = candidate.progress ?? 0
          }
        })
      })

      try {
        await evaluateScenarios(targetIds)
        stopProgressStream()
        progressUnsubscribe = subscribeSdtProgress({
          onEvent: (event) => {
            set((state) => {
              const candidate = state.candidates.find(
                (item) => item.id === event.candidateId,
              )
              if (!candidate) return
              candidate.progress = event.progress
              candidate.lastUpdatedAt = event.lastUpdatedAt
              if (event.result) {
                candidate.kpi = event.result.kpi
                candidate.status = event.result.achieved
                  ? 'achieved'
                  : 'not_achieved'
                candidate.recommended = event.result.achieved
              }
              if (event.errorCode) {
                candidate.status = 'not_achieved'
              }
            })
          },
          onComplete: () => {
            if (isBulk) {
              set((state) => {
                state.status = 'ready'
              })
            }
            stopProgressStream()
          },
          onError: (message) => {
            set((state) => {
              state.error = message
              state.status = 'ready'
            })
            stopProgressStream()
          },
        })
      } catch (error) {
        set((state) => {
          state.error = getErrorMessage(error)
          state.status = 'ready'
        })
      }
    },
    async retryCandidate(candidateId) {
      await get().evaluate([candidateId])
    },
    setActiveCandidate: (candidateId) =>
      set((state) => {
        state.activeCandidateId = candidateId
      }),
    setHoveredCandidate: (candidateId) =>
      set((state) => {
        state.hoveredCandidateId = candidateId
      }),
    updateCandidate: (candidateId, updater) =>
      set((state) => {
        const target = state.candidates.find(
          (candidate) => candidate.id === candidateId,
        )
        if (target) {
          updater(target)
        }
      }),
    clearError: () =>
      set((state) => {
        state.error = null
      }),
  })),
)

export const getCandidateById = (state: ScenarioState, id: CandidateId | null) =>
  state.candidates.find((candidate) => candidate.id === id) ?? null

export const getHighlightedCandidate = (state: ScenarioState) => {
  const targetId = state.hoveredCandidateId ?? state.activeCandidateId
  return getCandidateById(state, targetId)
}
