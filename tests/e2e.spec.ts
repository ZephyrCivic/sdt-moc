import { test, expect } from '@playwright/test'

type MockCandidate = ReturnType<typeof createCandidate>

const BASE_CANDIDATES: MockCandidate[] = Array.from({ length: 10 }, (_, index) =>
  createCandidate(index),
)
const ACCEPTED_IDS = BASE_CANDIDATES.slice(0, 3).map((candidate) => candidate.id)

function createCandidate(index: number) {
  return {
    id: `PX${(index + 1).toString().padStart(2, '0')}`,
    title: `テスト案 ${index + 1}`,
    reason: `混雑率↑ × テスト地区${index + 1} × 区間短縮`,
    measure: index % 2 === 0 ? '区間短縮' : '減便',
    strength: ['弱', '中', '強'][index % 3],
    annotations: [
      {
        kind: 'line' as const,
        feature: {
          type: 'LineString' as const,
          coordinates: [
            [139.7 + index * 0.001, 35.68],
            [139.71 + index * 0.001, 35.69],
          ],
        },
        note: 'テスト線形',
      },
    ],
    diversityFlags: {
      spatial: true,
      measureMix: index % 2 === 0,
      strengthMix: index % 3 === 0,
    },
    status: 'not_evaluated' as const,
    progress: 0,
    recommended: false,
    evidence: {
      metric: 'カバー率',
      threshold: '>= 80%',
      dataset: 'SDT-mock',
      updatedAt: new Date().toISOString(),
    },
  }
}

function buildMockCandidates() {
  return BASE_CANDIDATES.map((candidate) => ({
    ...candidate,
    status: 'not_evaluated' as const,
    recommended: false,
    progress: 0,
    kpi: undefined,
  }))
}

function buildSseStream() {
  const events = BASE_CANDIDATES.map((candidate, index) => ({
    candidateId: candidate.id,
    progress: 100,
    lastUpdatedAt: new Date(Date.now() + index * 1000).toISOString(),
    done: true,
    result: {
      kpi: {
        coverageRate: 82 + index,
        avgTravelTime: 24 + index,
        operatingCost: 920 - index * 5,
        serviceLevelRetention: 96 - index,
      },
      achieved: index < 3,
    },
  }))
  return (
    events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join('') +
    'event: done\ndata: {}\n\n'
  )
}

test.beforeEach(async ({ page }) => {
  await page.route('https://demotiles.maplibre.org/style.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        version: 8,
        sources: {
          simple: {
            type: 'vector',
            tiles: ['https://example.com/{z}/{x}/{y}.pbf'],
            minzoom: 0,
            maxzoom: 14,
          },
        },
        layers: [
          {
            id: 'background',
            type: 'background',
            paint: { 'background-color': '#f0f9ff' },
          },
        ],
      }),
    })
  })

  await page.route('**/mock/generate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ candidates: buildMockCandidates() }),
    })
  })

  await page.route('**/mock/sdt/evaluate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ accepted: ACCEPTED_IDS }),
    })
  })

  await page.route('**/mock/sdt/stream', async (route) => {
    await route.fulfill({
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        Connection: 'keep-alive',
        'Cache-Control': 'no-cache',
      },
      body: buildSseStream(),
    })
  })
})

const APP_PATH = process.env.PLAYWRIGHT_APP_PATH ?? '/sdt-moc/'

test('シナリオ生成から評価・推奨表示まで一気通貫で操作できる', async ({ page }) => {
  page.on('console', (message) => {
    console.log(`[browser:${message.type()}] ${message.text()}`)
  })
  page.on('requestfailed', (request) => {
    const failure = request.failure()
    console.log('[request-failed]', request.url(), failure?.errorText)
  })
  page.on('pageerror', (error) => {
    console.log('[page-error]', error.message)
  })
  await page.goto(APP_PATH, { waitUntil: 'domcontentloaded' })
  const initialHtml = await page.content()
  console.log('[html]', initialHtml.slice(0, 200))
  const bodyHtml = await page.evaluate(() => document.body.innerHTML)
  console.log('[body]', bodyHtml.slice(0, 200))
  await expect(
    page.getByRole('heading', { name: 'GTFSから推奨3案までのワンフローを高速デモ' }),
  ).toBeVisible()

  const generateButton = page.getByRole('button', { name: 'シナリオ抽出' })
  const evaluateButton = page.getByRole('button', { name: 'SDTで評価' })

  await expect(generateButton).toBeDisabled()
  await expect(evaluateButton).toBeDisabled()

  await page.getByRole('button', { name: 'サンプルデータを読み込む' }).click()
  await expect(page.getByText('GTFS: 完了').first()).toBeVisible()
  await expect(generateButton).toBeEnabled()

  await generateButton.click()
  await expect(page.getByText('候補数: 10件')).toBeVisible()
  await expect(page.getByTestId('scenario-card')).toHaveCount(10)

  await evaluateButton.click()
  await expect(page.getByText('状態: SDT評価中').first()).toBeVisible()
  await expect(page.getByText('状態: 候補準備完了').first()).toBeVisible({ timeout: 15_000 })

  const recommendedCards = page.locator('[data-testid="scenario-card"][data-recommended="true"]')
  await expect(recommendedCards).toHaveCount(3)

  const recommendedToggle = page.getByRole('button', { name: '推奨のみ表示' })
  await recommendedToggle.click()
  await expect(page.getByTestId('scenario-card')).toHaveCount(3)
  await recommendedToggle.click()
  await expect(page.getByTestId('scenario-card')).toHaveCount(10)

  const firstCard = page.getByTestId('scenario-card').first()
  await firstCard.click()
  await expect(firstCard).toHaveClass(/ring-2/)

  await page.selectOption('#priority-kpi', 'operatingCost')
  await expect(page.locator('dt', { hasText: '運行コスト' }).first()).toContainText('優先')
})
