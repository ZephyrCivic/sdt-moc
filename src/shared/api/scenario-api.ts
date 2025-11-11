import { candidateSchema } from '@/shared/types/candidate'
import type { CandidateId } from '@/shared/types/candidate'
import type { KpiKey } from '@/shared/types/kpi'
import {
  sdtProgressEventSchema,
  type SdtProgressEvent,
} from '@/shared/types/sdt'

async function requestJson<T>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, init)
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(
      text || `API request failed with status ${response.status}`,
    )
  }
  return (await response.json()) as T
}

export async function generateScenarios(priorityKpi: KpiKey) {
  const data = await requestJson<{ candidates: unknown }>('/mock/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priorityKpi }),
  })
  return candidateSchema.array().parse(data.candidates)
}

export async function evaluateScenarios(candidateIds: CandidateId[]) {
  if (candidateIds.length === 0) {
    throw new Error('評価対象候補が選択されていません')
  }
  return requestJson<{ accepted: CandidateId[] }>('/mock/sdt/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ candidateIds }),
  })
}

interface ProgressSubscriptionOptions {
  onEvent: (event: SdtProgressEvent) => void
  onComplete?: () => void
  onError?: (message: string) => void
}

export function subscribeSdtProgress({
  onEvent,
  onComplete,
  onError,
}: ProgressSubscriptionOptions) {
  if (typeof window === 'undefined') {
    throw new Error('SSE is not available in this environment')
  }

  const source = new EventSource('/mock/sdt/stream')

  source.onmessage = (event) => {
    try {
      const parsed = sdtProgressEventSchema.parse(JSON.parse(event.data))
      onEvent(parsed)
    } catch (error) {
      onError?.(
        error instanceof Error ? error.message : '進捗イベントの解析に失敗しました',
      )
    }
  }

  source.addEventListener('done', () => {
    onComplete?.()
    source.close()
  })

  source.onerror = () => {
    onError?.('SDT進捗ストリームの接続に失敗しました')
    source.close()
  }

  return () => {
    source.close()
  }
}
