import { http, HttpResponse } from 'msw'

export const handlers = [
  http.post('/api/scenarios/generate', async () => {
    return HttpResponse.json(
      {
        message: 'シナリオ生成モック: 実装予定',
      },
      { status: 202 },
    )
  }),
]
