# Plans2: 改善エリア抽出〜施策探索ロードマップ

- ゴール: 「改善エリアを特定 → 網羅パターン生成 → SDT施策探索で絞り込み」を最短で繋ぐ検証基盤を整備する。
- 参照ドキュメント: `UIモック要件定義書.md`, `docs/architecture.md`, `docs/async-error-handling.md`
- 記号: [ ] 未着手 / [~] 進行中 / [x] 完了

---

## フェーズ1: 改善エリアを特定する

1. [ ] P10-MESH-GRID: メッシュ分割と評価指標の定義
   - DoD: 対象地域をメッシュ化し、需要/コスト/混雑などの閾値を設定した `mesh-score.ts` を用意。
   - メモ: GTFS + OD/需要データを ingest してメッシュ単位指標を算出。
2. [ ] P11-MARKER-VIS: 基準を満たすメッシュをマーク表示
   - DoD: MapLibre 上で改善候補エリアをポリゴン/ヒートマップで表示し、閾値と根拠をツールチップ表示。
   - 参照: `docs/ui-layout.md`
3. [ ] P12-FEASIBILITY: エリア選定ロジックの妥当性検証
   - DoD: メッシュ抽出の理由（例: 需要密度＞X, サービスレベル＜Y）をログ＋UIに表示し、フィージビリティを確認。

## フェーズ2: 改善エリアの変更パターンを生成する

4. [ ] P20-GTFS-PATTERNS: バス停有無や経路バリエーションの自動生成
   - DoD: 改善エリアごとに停留所追加/削除/統合案を GTFS 変換スクリプトで生成 (`scripts/generate_patterns.mjs`)。
5. [ ] P21-DEMAND-SHEET: デマンドパラメータシートの網羅生成
   - DoD: エリア内に一定間隔でデマンド配備するパターンをスプレッドシート/JSON 出力し、UI から選択可能にする。
6. [ ] P22-PATTERN-RANK: 「筋の良い」パターン評価ロジック策定
   - DoD: カバー率・投入コスト・既存路線影響など複合スコアを計算し、上位N案だけを SDT に送れるようにする。
   - 参照: `docs/recommendation-logic.md`

## フェーズ3: SDT施策探索で絞り込む

7. [ ] P30-SDT-ENQUEUE: 生成パターンを SDT にキュー投入
   - DoD: 一括評価API（モック→本番）でリトライ/タイムアウト処理を整備、進捗は `ScenarioPanel` へ反映。
8. [ ] P31-SDT-ANALYTICS: SDT 戻り値の可視化・差分比較
   - DoD: KPI 達成状況・閾値超過理由・再送結果をカード/地図で同期表示。
9. [ ] P32-RECOMMEND: SDT結果 × 改善エリア情報で推奨上位案を抽出
   - DoD: 改善エリア→パターン→SDT評価のトレーサビリティを保持し、最終 3 案を提示する。

## フェーズ4: クロージャ（UAT/デモ/Pages）

10. [ ] P40-UAT: 受入観点（改善エリアの可視性・パターン網羅・SDT結果連携）をチェックリスト化し合否判定。
11. [ ] P41-DEMO: `docs/demo-script.md` を Plans2 の新フローに合わせ更新し、録画またはE2Eログを残す。
12. [ ] P42-PAGES: GitHub Pages で公開・リンク共有（メッシュ表示やパターン生成が機能することを確認）。

---

## 実行コマンド例

- 改善エリア判定: `pnpm ts-node scripts/mesh_score.ts`
- パターン生成: `pnpm ts-node scripts/generate_patterns.mjs`
- デマンドシート出力: `pnpm ts-node scripts/demand_sheet.mjs`
- SDT送信テスト: `npm run test:e2e`（Desktop Chrome/Edge/Safari）
