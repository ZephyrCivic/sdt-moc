# GitHub Pages デプロイ手順（Vite + React + shadcn/ui）

## 1. リポジトリ前提

- リポジトリ: `https://github.com/ZephyrCivic/sdt-moc.git`
- Pages 公開URL: `https://ZephyrCivic.github.io/sdt-moc/`

## 2. Vite の `base` 設定

`vite.config.ts`

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/sdt-moc/',
})
```

## 3. GitHub Actions（Pages）

`.github/workflows/gh-pages.yml`

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - uses: pnpm/action-setup@v3
        with:
          version: 9
          run_install: true
      - name: Build
        run: pnpm build
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## 4. Pages 設定

- GitHub リポジトリ（ZephyrCivic/sdt-moc）→ Settings → Pages
- Source: GitHub Actions を選択

## 5. 動作確認

- Actions 成功後、`https://ZephyrCivic.github.io/sdt-moc/` へアクセス
- ルーティングは SPA（クライアントサイド）。404 対策が必要なら `404.html` を `index.html` に転送する方式を検討


