import { HttpResponse, http, delay } from 'msw'
import { generateMockCandidates, calculateMockKpi } from './factories'
import type { MockCandidate, CandidateKpiKey } from './types'

let cachedCandidates: MockCandidate[] = []

function ensureCandidates() {
  if (cachedCandidates.length === 0) {
    cachedCandidates = generateMockCandidates('coverageRate')
  }
}

export const handlers = [
  http.post('/mock/generate', async ({ request }) => {
    const body = (await request.json()) as { priorityKpi?: CandidateKpiKey }
    const priority = body.priorityKpi ?? 'coverageRate'
    cachedCandidates = generateMockCandidates(priority)
    await delay(400)
    return HttpResponse.json({ candidates: cachedCandidates })
  }),

  http.post('/mock/sdt/evaluate', async ({ request }) => {
    ensureCandidates()
    const body = (await request.json()) as { candidateIds?: string[] }
    const targetIds = body.candidateIds ?? cachedCandidates.map((c) => c.id)

    const accepted = targetIds.slice(0, 3)
    cachedCandidates = cachedCandidates.map((candidate) => {
      if (!targetIds.includes(candidate.id)) {
        return candidate
      }
      const achieved = accepted.includes(candidate.id)
      return {
        ...candidate,
        status: achieved ? 'achieved' : 'not_achieved',
        recommended: achieved,
        kpi: calculateMockKpi(candidate.id),
        lastUpdatedAt: new Date().toISOString(),
        progress: 100,
      }
    })

    await delay(300)
    return HttpResponse.json({ accepted })
  }),

  http.get('/mock/sdt/stream', () => {
    ensureCandidates()
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        for (const candidate of cachedCandidates) {
          const payload = {
            candidateId: candidate.id,
            progress: 100,
            lastUpdatedAt: new Date().toISOString(),
            done: true,
            result: {
              kpi: calculateMockKpi(candidate.id),
              achieved: candidate.recommended ?? false,
            },
          }
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
          )
          await delay(150)
        }
        controller.enqueue(encoder.encode('event: done\ndata: {}\n\n'))
        controller.close()
      },
      cancel() {
        // noop
      },
    })

    return new HttpResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  }),
]
