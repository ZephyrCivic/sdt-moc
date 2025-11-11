import { useEffect, useMemo, useRef, useState } from 'react'
import { Toggle } from '@/components/ui/toggle'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ScenarioCard } from './scenario-card'
import { useScenarioStore, type ScenarioStatus } from '@/shared/state/scenario-store'
import {
  useScenarioControlsStore,
  type ScenarioFilter,
} from '@/shared/state/scenario-controls-store'
import { KPI_PRIORITY_ORDER, type KpiKey } from '@/shared/types/kpi'

export function ScenarioPanel() {
  const candidates = useScenarioStore((state) => state.candidates)
  const scenarioStatus = useScenarioStore((state) => state.status)
  const retryCandidate = useScenarioStore((state) => state.retryCandidate)
  const activeCandidateId = useScenarioStore(
    (state) => state.activeCandidateId,
  )
  const hoveredCandidateId = useScenarioStore(
    (state) => state.hoveredCandidateId,
  )
  const setActiveCandidate = useScenarioStore(
    (state) => state.setActiveCandidate,
  )
  const setHoveredCandidate = useScenarioStore(
    (state) => state.setHoveredCandidate,
  )

  const filter = useScenarioControlsStore((state) => state.filter)
  const toggleFilter = useScenarioControlsStore((state) => state.toggleFilter)
  const resetFilter = useScenarioControlsStore((state) => state.resetFilter)
  const priorityKpi = useScenarioControlsStore((state) => state.priorityKpi)
  const sortMode = useScenarioControlsStore((state) => state.sortMode)
  const setSortMode = useScenarioControlsStore((state) => state.setSortMode)
  const showLoadingPlaceholder = useLoadingPlaceholder(scenarioStatus)

  const filteredCandidates = useMemo(() => {
    if (filter === 'recommended') {
      return candidates.filter((candidate) => candidate.recommended)
    }
    if (filter === 'achieved') {
      return candidates.filter((candidate) => candidate.status === 'achieved')
    }
    return candidates
  }, [candidates, filter])

  useEffect(() => {
    if (filter !== 'all' && filteredCandidates.length === 0) {
      resetFilter()
    }
  }, [filter, filteredCandidates.length, resetFilter])

  const sortedCandidates = useMemo(() => {
    const list = [...filteredCandidates]
    const fallbackOrder = KPI_PRIORITY_ORDER
    list.sort((a, b) => {
      const primary = sortMode === 'support' ? getSupportScore : getPriorityScore
      const aScore = primary(a, priorityKpi)
      const bScore = primary(b, priorityKpi)
      if (aScore !== bScore) {
        return bScore - aScore
      }
      // tie-breaker: iterate fallback KPIs
      for (const key of fallbackOrder) {
        const diff =
          (b.kpi?.[key] ?? Number.NEGATIVE_INFINITY) -
          (a.kpi?.[key] ?? Number.NEGATIVE_INFINITY)
        if (diff !== 0) {
          return diff
        }
      }
      return 0
    })
    return list
  }, [filteredCandidates, priorityKpi, sortMode])

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card/40">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">候補フィード</h2>
        <p className="text-xs text-muted-foreground">
          生成された10カードを固定表示し、評価と推奨の状態を同期表示します。
        </p>
      </div>

      <div className="border-b border-border px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <Toggle
            size="sm"
            variant="outline"
            pressed={filter === 'recommended'}
            onPressedChange={() => toggleFilter('recommended')}
          >
            推奨のみ表示
          </Toggle>
          <Toggle
            size="sm"
            variant="outline"
            pressed={filter === 'achieved'}
            onPressedChange={() => toggleFilter('achieved')}
          >
            達成のみ表示
          </Toggle>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          <p>
            {filterLabel(filter)}／{filteredCandidates.length}件
          </p>
          <p>状態: {statusLabel(scenarioStatus)}</p>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Toggle
            size="sm"
            variant="outline"
            pressed={sortMode === 'priority'}
            onPressedChange={() => setSortMode('priority')}
          >
            優先KPI順
          </Toggle>
          <Toggle
            size="sm"
            variant="outline"
            pressed={sortMode === 'support'}
            onPressedChange={() => setSortMode('support')}
          >
            補助KPI平均順
          </Toggle>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {showLoadingPlaceholder ? (
          <ScenarioSkeletonList />
        ) : sortedCandidates.length > 0 ? (
          sortedCandidates.map((candidate) => (
            <ScenarioCard
              key={candidate.id}
              candidate={candidate}
              active={
                candidate.id === activeCandidateId ||
                candidate.id === hoveredCandidateId
              }
              onSelect={(id) => setActiveCandidate(id)}
              onHover={(id) => setHoveredCandidate(id)}
              onHoverEnd={() => setHoveredCandidate(null)}
              onRetry={retryCandidate}
              priorityKpi={priorityKpi}
            />
          ))
        ) : (
          <p className="text-xs text-muted-foreground">
            フィルタ条件に一致する候補がありません。
          </p>
        )}
      </div>
    </section>
  )
}

function filterLabel(filter: ScenarioFilter) {
  switch (filter) {
    case 'recommended':
      return '推奨のみ'
    case 'achieved':
      return '達成のみ'
    default:
      return '全件'
  }
}

function statusLabel(status: ScenarioStatus) {
  switch (status) {
    case 'generating':
      return '生成中'
    case 'evaluating':
      return '評価中'
    case 'ready':
      return '準備完了'
    default:
      return '未生成'
  }
}

function getPriorityScore(candidate: { kpi?: Record<KpiKey, number> }, priority: KpiKey) {
  return candidate.kpi?.[priority] ?? Number.NEGATIVE_INFINITY
}

function getSupportScore(candidate: { kpi?: Record<KpiKey, number> }, priority: KpiKey) {
  if (!candidate.kpi) return Number.NEGATIVE_INFINITY
  const supportKeys = KPI_PRIORITY_ORDER.filter((key) => key !== priority)
  const values = supportKeys.map((key) => candidate.kpi?.[key]).filter((value): value is number => typeof value === 'number')
  if (values.length === 0) return Number.NEGATIVE_INFINITY
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length
  return avg
}

const LOADING_MIN_DURATION_MS = 2000
const LOADING_CARD_COUNT = 10

function useLoadingPlaceholder(status: ScenarioStatus) {
  const [visible, setVisible] = useState(false)
  const deadlineRef = useRef<number | null>(null)

  useEffect(() => {
    const now = Date.now()
    const isGenerating = status === 'generating'
    if (isGenerating) {
      deadlineRef.current = now + LOADING_MIN_DURATION_MS
      setVisible(true)
      return
    }

    const deadline = deadlineRef.current
    if (deadline && now < deadline) {
      const timeout = window.setTimeout(() => {
        deadlineRef.current = null
        setVisible(false)
      }, deadline - now)
      return () => window.clearTimeout(timeout)
    }

    deadlineRef.current = null
    setVisible(false)
    return
  }, [status])

  return visible
}

function ScenarioSkeletonList() {
  return (
    <div className="space-y-3">
      {Array.from({ length: LOADING_CARD_COUNT }).map((_, index) => (
        <ScenarioSkeletonCard key={index} />
      ))}
    </div>
  )
}

function ScenarioSkeletonCard() {
  return (
    <Card className="space-y-4 border-border/70 bg-card/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-16" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {[0, 1, 2].map((token) => (
          <Skeleton key={token} className="h-5 w-16" />
        ))}
      </div>
      <div className="space-y-2">
        {[0, 1, 2].map((line) => (
          <Skeleton key={line} className="h-3 w-full" />
        ))}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-2 w-full" />
        <div className="flex justify-end">
          <Skeleton className="h-6 w-12" />
        </div>
      </div>
    </Card>
  )
}
