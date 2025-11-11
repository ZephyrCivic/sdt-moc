import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const shouldMock =
  (import.meta.env.VITE_USE_MOCK ?? 'true') !== 'false'

function enableMocking() {
  if (!shouldMock) {
    return Promise.resolve()
  }
  return import('./mocks/browser').then(async ({ worker }) => {
    await worker.start({
      serviceWorker: {
        url: `${import.meta.env.BASE_URL}mockServiceWorker.js`,
      },
      onUnhandledRequest: 'bypass',
    })
  })
}

enableMocking()
  .catch((error) => {
    console.error('MSW failed to start', error)
  })
  .finally(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
