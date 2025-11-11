# 実装TODO表（順次実行で完成）

- 目的: `UIモック要件定義書.md` の体験要件（見る・送る・選ぶ）を最小構成で満たす Web モックを実装する。
- 前提: 候補抽出/SDT はブラックボックス。UI は多様性・根拠・推奨を可視化する。
- 参照: 必要仕様は各タスクの「参照ドキュメント」を確認。

記号: [ ] 未着手 / [~] 進行中 / [x] 完了

## フェーズ0: プロジェクト準備

1. [x] T00-ENV: 開発環境準備（Node LTS / pnpm or npm / Git）
   - DoD: `node -v` と `pnpm -v` が通る
   - 参照: docs/project-setup.md
2. [x] T01-INIT: Vite + React + TypeScript プロジェクト初期化
   - DoD: `pnpm dev` で空の画面が起動
   - 参照: docs/project-setup.md
3. [x] T02-DEPS: 依存導入（MapLibre GL JS, Zustand, MSW, Zod, React Router, Tailwind）
   - DoD: 依存が `package.json` に入りビルド成功
   - 参照: docs/architecture.md, docs/project-setup.md
4. [x] T03-STRUCT: ディレクトリ構成作成（`src/app`, `src/pages`, `src/widgets`, `src/entities`, `src/shared`）
   - DoD: 既定のフォルダ/エイリアス解決
   - 参照: docs/architecture.md
5. [x] T04-SHADCN: Tailwind + shadcn/ui 初期化と必須コンポーネント導入（button/badge/card/tooltip/skeleton/toggle/switch/progress/separator）
   - DoD: `src/components/ui/*` が生成され UI パーツが使用可能
   - 参照: docs/project-setup.md, docs/ui-layout.md
6. [x] T05-GTFS-UPLOAD: GTFS ZIP アップロードUI（ファイル入力/ドラッグ&ドロップ）
   - DoD: `AllLines-20250401_群馬中央バス株式会社.zip` を読み込める
   - 参照: docs/gtfs-import.md
   - メモ(2025-11-06): GTFSアップロードUI骨格＋Zustandストアに加え、ZIP解析・サマリー表示を実装
7. [x] T06-GTFS-PARSE: クライアントで ZIP 解凍→CSV 解析→`Network` 生成（fflate + papaparse）
   - DoD: 路線（LineString）と停留所（Point）が Network として得られる（shapes 無い場合は簡略線）
   - 参照: docs/gtfs-import.md, docs/data-schemas.md
   - メモ(2025-11-06): ZIP展開→CSV解析→Network整形ロジックを実装（LineString/StopTime補完対応）
8. [x] T07-MAP-BASE: 現状ネットワークの地図表示（MapLibre ソース/レイヤ定義）
   - DoD: 取込直後に地図へ路線/停留所が描画される
   - 参照: docs/ui-layout.md
   - メモ(2025-11-06): MapLibre GL で路線・停留所をGeoJSONソースとして描画し、GTFS読込後に自動フィットするマップを実装

## フェーズ1: データ/スキーマ

9. [x] T10-SCHEMA: JSON スキーマ定義（GTFS簡易、乗降、候補、評価結果）
   - DoD: `zod` スキーマと型が揃う
   - 参照: docs/data-schemas.md
   - メモ(2025-11-06): `src/shared/types` にNetwork/Candidate/KPI/SDT進捗のZodスキーマを作成、既存GTFS型を再エクスポートして整合性を確保
10. [x] T11-SAMPLE: サンプルデータ配置（`sample-data/` 一式）
   - DoD: 最小のネットワーク/候補/評価例で画面が動く
   - 参照: docs/data-schemas.md
   - メモ(2025-11-06): Zodスキーマ準拠のサンプルネットワーク・候補・進捗データをTS定数化し、左カラムから読み込めるショートカットを実装

## フェーズ2: 画面レイアウト（単一ページ・三カラム）

11. [x] T20-LAYOUT: 3カラム骨格（左=入力/中央=地図/右=候補フィード）
   - DoD: レスポンシブで横3分割、固定ヘッダなし
   - 参照: docs/ui-layout.md
11. [x] T21-LABELS: ラベル/表記統一（ボタン/バッジ/ツールチップ）
   - DoD: 文言が `labels-and-terminology.md` に一致
   - 参照: docs/labels-and-terminology.md

## フェーズ3: 候補生成（モック）

12. [x] T30-GEN-API: 「シナリオ抽出」モック API 実装（同期: 10案返却）
   - DoD: クリックで10カード出現、各カードに1行理由・未評価バッジ
   - 参照: docs/mock-api.md, docs/reason-phrases.md, docs/diversity-rules.md
   - メモ(2025-11-06): MSW初期化＋生成/評価/SSEハンドラを実装（候補10件モック生成）
13. [x] T31-DIVERSITY: 多様性ルール適用（空間/施策/強度×摂動）
   - DoD: 類似案に差分注記、ツールチップでフラグ確認可
   - 参照: docs/diversity-rules.md
14. [x] T32-ANNOT: 地図アノテーション（線/点/面の同期ハイライト）
   - DoD: カード選択で地図が同期強調
   - 参照: docs/ui-layout.md

## フェーズ4: SDT評価（非同期モック）

15. [x] T40-QUEUE: 非同期キュー表現（評価%・最終更新・再送）
    - DoD: 進捗がカードに表示、同一フレームでカード=地図更新
    - 参照: docs/async-error-handling.md, docs/mock-api.md
16. [x] T41-BULK: 「SDTで評価」一括送信と部分失敗/タイムアウト
    - DoD: 自動/手動再送をUIで選べ、失敗コードが残る
    - 参照: docs/async-error-handling.md

## フェーズ5: 推奨/並び替え/フィルタ

17. [x] T50-KPI: KPI4軸の表示制御（生成直後は非表示→実測のみ表示）
    - DoD: SDT戻り後にのみ KPI がカード/地図に反映
    - 参照: docs/kpis.md
18. [x] T51-RANK: 優先KPIによる並び替えと推奨判定（補助KPIで閾値確認）
    - DoD: 推奨バッジ付与、優先KPI切替で順位のみ即時変化
    - 参照: docs/recommendation-logic.md
19. [x] T52-FILTER: トグル（推奨のみ/達成のみ）と未評価の下段グレー表示
    - DoD: カード=地図で同時に適用、ゼロ件時の自動解除
    - 参照: docs/filters-and-sorting.md

## フェーズ6: 説明責任（Reason/出典/ヘルプ）

20. [x] T60-REASON: 1行理由テンプレ（特徴×地域×施策）と差分注記
    - DoD: 全カードに句型準拠の理由、差分は[]で追記
    - 参照: docs/reason-phrases.md
21. [x] T61-SOURCE: 推奨条件の簡易式と閾値出典ツールチップ
    - DoD: ヘルプアイコンで式/出典を開示
    - 参照: docs/recommendation-logic.md

## フェーズ7: 非機能/UX

22. [x] T70-SKEL: 体感2秒のスケルトン表示（生成→10カード表示）
    - DoD: ローディング骨格でタイムライン合格
    - 参照: docs/non-functional.md
23. [x] T71-BROWSERS: 対応ブラウザ（最新2世代）で動作確認
    - DoD: Chrome/Edge/Safari の最新版-1までOK
    - 参照: docs/non-functional.md, docs/test-plan.md
    - メモ(2025-11-11): `npm run test:e2e` で Desktop Chrome/Edge/Safari を一括検証（Playwright）。
    - メモ(2025-11-11): `npm run test:e2e` で Desktop Chrome/Edge/Safari を一括検証（Playwright）。

## フェーズ8: 受入/デモ

24. [x] T80-UAT: 受入チェックリストの全項目合格
    - DoD: `acceptance-checklist.md` のチェックが全て緑
    - 参照: docs/acceptance-checklist.md
    - メモ(2025-11-11): E2E結果をもとに GitHub Pages 含む全項目を更新済み。
25. [x] T81-DEMO: デモ台本通りの一気通貫操作確認
    - メモ(2025-11-11): `tests/e2e.spec.ts` が demo-script の 10 工程を自動再生。
26. [x] T90-PAGES: GitHub Pages デプロイ（Actions 設定 + Vite base=/sdt-moc/）
    - DoD: `https://ZephyrCivic.github.io/sdt-moc/` でアプリが動作
    - 参照: docs/deploy-gh-pages.md
    - DoD: `demo-script.md` に沿って動画/手順で再現
    - 参照: docs/demo-script.md
    - メモ(2025-11-11): `Invoke-WebRequest https://ZephyrCivic.github.io/sdt-moc/` が 200 応答を返すことを確認。

---

## 実行コマンド例（参考）

- 開発起動: `pnpm dev`
- モックAPI/MSW: 開発起動時に自動有効（詳細は mock-api.md）
- 型検査: `pnpm typecheck`
- ビルド: `pnpm build`

