# AGENTS.md（本リポジトリ専用ガイド）

本ファイルは、このディレクトリ配下すべて（リポジトリ全体）に適用されるエージェント向け作業規約です。目的は「最適な Web UI モック」を素早く安全に仕上げることです。

## 目的と対象
- 対象: MLIT UI モック（Web、単一ページ、三カラム、地図＋カード）。
- ゴール: 「見る・送る・選ぶ」の体験を、GTFS 取込→10案生成→SDT評価→約3案推奨まで一気通貫で実証。
- 参照の起点: `docs/実装TODO表.md`（順に実行すると完成）。

## コミュニケーション
- チャットは必ず日本語で応答してください。
- コマンド実行やファイル編集前に、短いプレアブルで意図を共有（1–2文）。
- 進捗は小刻みに共有。大きな変更は理由と影響範囲を添える。

## 作業原則（小さく・安全・整合）
- 小さな差分で安全に前進（設定→スキーマ→UI→モック→検証の順）。
- 「仕様の単一情報源」はドキュメント。変更時は `docs/` を先に更新→実装。
- `docs/実装TODO表.md` の順序を基本とし、前後依存を崩さない。
- 受入は `docs/acceptance-checklist.md` 準拠。満たせない場合は理由と代替案を明記。

## スナップショットに関する方針
- 旧方針（UIスナップショット生成・比較ルール）は採用しません。本モックは速度重視のため、目視デモ・受入チェックリストで品質を確認します。

## 技術スタックと前提
- ビルド: Vite / UI: React + TypeScript / 状態: Zustand
- 地図: MapLibre GL JS / APIモック: MSW / スキーマ: Zod
- UIキット: shadcn/ui（Radix + Tailwind）。CSS は Tailwind を使用。
- デプロイ: GitHub Pages。`vite.config.ts` の `base` は `/sdt-moc/`。
- 参考: `docs/architecture.md`, `docs/project-setup.md`, `docs/deploy-gh-pages.md`。

## ディレクトリと命名
- 構成: `docs/architecture.md` の推奨レイアウトに従う。
- React コンポーネント: パスカルケース。ファイルはケバブケース可。
- `src/components/ui/` は shadcn/ui の自動生成領域。直接改変は最小限に。

## データ取り扱い（GTFS/サンプル）
- 初期 GTFS: `gtfs_data/AllLines-20250401_群馬中央バス株式会社.zip`。
  - Git 管理外（`.gitignore` 済）。公開リポジトリにコミットしない。
- シナリオ自動生成（10案）: `npm run gen:scenarios`。
- 評価付与（擬似KPI）: `npm run eval:scenarios`。
- 推奨3件抽出: `npm run rec:top3` または `scripts/recommend_top3.mjs`。
- 生成物は `sample-data/`。UI モックが読み取る前提で整形すること。

## 実装の進め方（TODO 準拠）
1. 依存導入と shadcn/ui 初期化（T02–T04）
2. GTFS アップロードと解析（T05–T06）。Shift_JIS/UTF-8 両対応。
3. 地図基盤表示（T07）→ 三カラム UI 骨格（T20）
4. 「シナリオ抽出」API（MSW）で10案提示（T30–T32）
5. 非同期評価・リトライ（T40–T41）
6. KPI表示・並替・推奨3件・フィルタ（T50–T52）
7. 非機能・受入・デモ・Pages（T70–T90）

## 検証・品質保証（軽量）
- 型検査: `pnpm typecheck`（設定がある場合）。
- 動作確認: `pnpm dev` で UI 目視、受入チェックを一項目ずつ実施。
- 非同期挙動: 進捗・最終更新・再送 UI を確認（`docs/async-error-handling.md`）。
- ブラウザ互換: 最新2世代を目視確認（最低 Chrome/Edge、可能なら Safari）。

## デプロイと公開
- `main` へ push で GitHub Actions が `dist` を Pages に公開。
- 公開URL: https://ZephyrCivic.github.io/sdt-moc/
- 不具合時は `docs/deploy-gh-pages.md` を先に点検（`base` 設定・Actions 成否）。

## 禁止・注意
- 大量/破壊的変更は禁止。削除や仕様変更は理由・影響を先に共有。
- 機密/個人情報を含むデータのコミット禁止。`.env` はサンプルのみ。
- ラベル/語彙は `docs/labels-and-terminology.md` に統一（表記ゆれ不可）。

## 衝突時の優先度
1. システム/ユーザーの明示指示
2. `docs/実装TODO表.md` と関連設計ドキュメント
3. 本 `AGENTS.md`

---
このガイドは Web UI モックの俊敏な検証に最適化されています。運用で不足が出た場合は、まず `docs/` の該当仕様を更新し、続けて本ファイルを改訂してください。



