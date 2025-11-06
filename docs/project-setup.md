# プロジェクトセットアップ（shadcn/ui + GitHub Pages）

## 前提

- Node.js LTS（v18+ 推奨）
- パッケージマネージャ: pnpm もしくは npm

## 初期化（Vite + React + TS）

```
# 任意: pnpm を使う場合
npm i -g pnpm

# Vite + React + TypeScript
pnpm create vite mlit-ui --template react-ts
cd mlit-ui
pnpm i

# 依存
pnpm add maplibre-gl zustand zod react-router-dom
pnpm add fflate papaparse
pnpm add -D msw @types/maplibre-gl tailwindcss postcss autoprefixer

# Tailwind 初期化
npx tailwindcss init -p

# shadcn/ui 初期化
npx shadcn@latest init -d

# 必要コンポーネントの追加（例）
npx shadcn@latest add button badge card tooltip skeleton toggle switch progress separator
```

## Tailwind 設定

- `tailwind.config.ts` の `content` に `./index.html`, `./src/**/*.{ts,tsx}` を指定
- `src/index.css` に以下を記述

```
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## shadcn/ui 生成物

- 既定では `src/components/ui/` にコンポーネントが配置されます。
- 色やラディウス等のテーマは `tailwind.config.ts` と `src/components/ui` 内の変数で調整。

## MSW の起動

- `src/main.tsx` で開発時のみ `msw` を起動（`import("./mocks/browser").then(...)` など）。

## GitHub Pages に合わせた Vite 設定

- `vite.config.ts` に `base: "/<REPO_NAME>/"` を設定（例: `"/mlit-ui/"`）。
- 詳細は `docs/deploy-gh-pages.md` を参照。
