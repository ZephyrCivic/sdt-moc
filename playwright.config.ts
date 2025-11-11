import { defineConfig, devices } from '@playwright/test'

const HOST = '127.0.0.1'
const PORT = 4173
const isDevServer = process.env.PLAYWRIGHT_MODE === 'dev'
const BASE_PATH = normalizeBasePath(
  process.env.PLAYWRIGHT_BASE_PATH ?? '/sdt-moc/',
)
const ORIGIN = `http://${HOST}:${PORT}`
const SERVER_URL = `${ORIGIN}${BASE_PATH}`
process.env.PLAYWRIGHT_APP_PATH = BASE_PATH
const webServerCommand = isDevServer
  ? `npm run dev -- --host ${HOST} --port ${PORT}`
  : `npm run preview -- --host ${HOST} --port ${PORT}`

function normalizeBasePath(value: string) {
  const withLeading = value.startsWith('/') ? value : `/${value}`
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`
}

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: ORIGIN,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: webServerCommand,
    url: SERVER_URL,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Desktop Edge',
      use: { ...devices['Desktop Edge'] },
    },
    {
      name: 'Desktop Safari',
      use: { ...devices['Desktop Safari'] },
    },
  ],
})
