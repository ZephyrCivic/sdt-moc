# アーキテクチャ/技術選定（shadcn/ui + GitHub Pages）

- 目的: 最小工数で「見る・送る・選ぶ」の体験検証を成立させる。
- 方針: 生成/評価はモック化し、UIの同期・説明責任・非同期進行を重視。UIは shadcn/ui（Tailwind + Radix）を採用。

## 推奨スタック

- ビルド: Vite
- UI: React + TypeScript
- ルーティング: React Router（単一ページだが将来拡張見据え）
- 状態管理: Zustand（軽量）
- 地図: MapLibre GL JS（OSS）
- APIモック: MSW（Mock Service Worker）
- スキーマ/型: Zod（JSONバリデーション）
- UIキット: shadcn/ui（Radix + Tailwind）
- CSS: Tailwind CSS（shadcn/ui 前提）

## ディレクトリ構成（推奨）

```
src/
  app/            # エントリ, プロバイダ, ルータ
  pages/
    HomePage/     # 単一ページ（3カラム）
  widgets/
    MapView/
    CandidateFeed/
    ControlsPane/
  entities/
    Candidate/
    KPI/
  shared/
    api/          # MSWハンドラ/クライアント
    config/
    lib/
    components/   # shadcn/ui が生成する `components/ui` を含む
    types/        # zod スキーマ/型
```

- 命名: パスカルケース（Reactコンポーネント）, ケバブケース（ファイル）可。
- CSS: Tailwind を採用。カスタムは `src/index.css` と `tailwind.config.ts` に集約。

## 主要データフロー

1) 「シナリオ抽出」クリック → `POST /mock/generate`（同期）→ 10候補をストアへ投入（未評価/KPI非表示）
2) 「SDTで評価」クリック → `POST /mock/sdt/evaluate`（非同期キュー起動）→ 進捗ストリーム
3) 進捗イベント到着 → カード状態/最終更新/評価% を更新 → 評価完了で実測KPIを反映
4) 優先KPI選択変更 → ソート/推奨再判定（KPI値は固定のまま並びのみ変化）
5) フィルタ（推奨のみ/達成のみ） → カード=地図に同時適用

詳細は `mock-api.md`, `state-machine.md`, `filters-and-sorting.md` を参照。

## GitHub Pages デプロイ方針

- ビルドターゲット: 静的 SPA（Vite）
- `vite.config.ts` の `base` を `/<REPO_NAME>/` に設定（例: `"/mlit-ui/"`）
- GitHub Actions（Pages）で `pnpm build` → `dist` を公開
- 追加資料: `docs/deploy-gh-pages.md`
