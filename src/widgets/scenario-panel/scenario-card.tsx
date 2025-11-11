import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import {
  KPI_DEFINITIONS,
  KPI_PRIORITY_ORDER,
  type KpiKey,
} from '@/shared/types/kpi'
import type { Candidate } from '@/shared/types/candidate'

const STATUS_BADGES: Record<
  Candidate['status'],
  { label: string; variant: 'outline' | 'secondary' | 'default' | 'destructive' }
> = {
  not_evaluated: { label: '未評価', variant: 'outline' },
  evaluating: { label: '評価中', variant: 'secondary' },
  achieved: { label: '達成', variant: 'default' },
  not_achieved: { label: '非達成', variant: 'destructive' },
}

const DIVERSITY_TOKENS = [
  { key: 'spatial', label: '空間', description: 'エリア分散をクリア' },
  { key: 'measureMix', label: '施策', description: '施策の組み合わせを確保' },
  { key: 'strengthMix', label: '強度', description: '強度バランスを確保' },
] as const

interface ScenarioCardProps {
  candidate: Candidate
  active?: boolean
  onSelect: (candidateId: string) => void
  onHover: (candidateId: string) => void
  onHoverEnd: () => void
  onRetry?: (candidateId: string) => void
  priorityKpi: KpiKey
}

export function ScenarioCard({
  candidate,
  active,
  onSelect,
  onHover,
  onHoverEnd,
  onRetry,
  priorityKpi,
}: ScenarioCardProps) {
  const statusToken = STATUS_BADGES[candidate.status]
  const canRetry = candidate.status === 'not_achieved'
  const supportScore = computeSupportScore(candidate, priorityKpi)
  const reasonTokens = useMemo(() => parseReasonTokens(candidate.reason), [candidate.reason])

  const kpiEntries = useMemo(() => {
    if (!candidate.kpi) return []
    return KPI_PRIORITY_ORDER.map((key) => ({
      key,
      value: candidate.kpi?.[key],
    })).filter((item) => typeof item.value === 'number') as Array<{
      key: KpiKey
      value: number
    }>
  }, [candidate.kpi])

  return (
    <Card
      data-testid="scenario-card"
      data-candidate-id={candidate.id}
      data-status={candidate.status}
      data-recommended={candidate.recommended ? 'true' : 'false'}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(candidate.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect(candidate.id)
        }
      }}
      onMouseEnter={() => onHover(candidate.id)}
      onFocus={() => onHover(candidate.id)}
      onMouseLeave={onHoverEnd}
      onBlur={onHoverEnd}
      className={cn(
        'space-y-3 border-border/70 bg-card/70 p-4 text-sm transition-all',
        active && 'ring-2 ring-primary',
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">候補 {candidate.id}</p>
          <p className="text-sm font-semibold text-foreground">
            {candidate.title}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {candidate.recommended ? (
            <Badge variant="default">推奨</Badge>
          ) : null}
          <Badge variant={statusToken.variant}>{statusToken.label}</Badge>
        </div>
      </header>

      {reasonTokens.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {reasonTokens.map((token) => (
            <Badge key={token} variant="outline" className="text-[11px]">
              {token}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="font-mono text-xs text-foreground">{candidate.reason}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{candidate.measure}</Badge>
        <Badge variant="outline">強度: {candidate.strength}</Badge>
        <TooltipProvider delayDuration={100}>
          {DIVERSITY_TOKENS.filter((token) => candidate.diversityFlags[token.key])
            .map((token) => (
              <Tooltip key={token.key}>
                <TooltipTrigger asChild>
                  <Badge variant="outline">{token.label}</Badge>
                </TooltipTrigger>
                <TooltipContent>{token.description}</TooltipContent>
              </Tooltip>
            ))}
        </TooltipProvider>
      </div>

      {candidate.evidence ? (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="w-fit cursor-help text-[11px]">
                出典: {candidate.evidence.dataset}
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="text-xs">
              <p>
                {candidate.evidence.metric} {candidate.evidence.threshold}
              </p>
              <p>{formatEvidenceDate(candidate.evidence.updatedAt)}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : null}

      {candidate.kpi ? (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          {kpiEntries.map(({ key, value }) => {
            const definition = KPI_DEFINITIONS[key]
            const isPriority = key === priorityKpi
            return (
              <div key={key} className="space-y-1">
                <dt
                  className={cn(
                    'text-muted-foreground',
                    isPriority && 'text-primary font-semibold',
                  )}
                >
                  {definition.label}
                  {isPriority ? '（優先）' : ''}
                </dt>
                <dd
                  className={cn(
                    'text-base font-semibold text-foreground',
                    isPriority && 'text-primary',
                  )}
                >
                  {formatKpiValue(key, value)} {definition.unit}
                </dd>
              </div>
            )
          })}
        </dl>
      ) : (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-3 w-full" />
          ))}
          <p className="text-xs text-muted-foreground">SDT評価待ち</p>
        </div>
      )}

      <div className="space-y-2 text-xs text-muted-foreground">
        {supportScore != null ? (
          <p className="font-medium text-foreground">
            補助KPI平均: {supportScore.toFixed(1)}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          {candidate.progress != null ? (
            <>
              <span className="font-medium text-foreground">
                評価 {candidate.progress}%
              </span>
              <Progress
                value={candidate.progress}
                className="h-2 flex-1 min-w-[80px]"
              />
            </>
          ) : (
            <span>評価準備待ち</span>
          )}
          {candidate.lastUpdatedAt ? (
            <time dateTime={candidate.lastUpdatedAt}>
              最終更新 {formatTimestamp(candidate.lastUpdatedAt)}
            </time>
          ) : null}
        </div>
        <div className="flex items-center justify-end">
          <Button
            size="sm"
            variant="ghost"
            disabled={!canRetry || !onRetry}
            onClick={(event) => {
              event.stopPropagation()
              if (canRetry && onRetry) {
                onRetry(candidate.id)
              }
            }}
            className="px-3"
          >
            再送
          </Button>
        </div>
      </div>
    </Card>
  )
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString('ja-JP', {
    hour12: false,
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatKpiValue(key: KpiKey, value: number) {
  if (key === 'operatingCost') {
    return value.toFixed(0)
  }
  if (key === 'avgTravelTime') {
    return value.toFixed(1)
  }
  return value.toFixed(1)
}

function computeSupportScore(candidate: Candidate, priority: KpiKey) {
  if (!candidate.kpi) return null
  const keys = KPI_PRIORITY_ORDER.filter((key) => key !== priority)
  const values = keys
    .map((key) => candidate.kpi?.[key])
    .filter((value): value is number => typeof value === 'number')
  if (values.length === 0) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function parseReasonTokens(reason: string) {
  if (!reason) return []
  return reason
    .split('×')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
}

function formatEvidenceDate(value: string) {
  return new Date(value).toLocaleString('ja-JP', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
