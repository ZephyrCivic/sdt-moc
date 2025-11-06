# MLIT UI モック ドキュメントパック

このフォルダは、`UIモック要件定義書.md` を運用可能な実装レベルへ落とし込んだ設計・手順・受入基準を集約したものです。開発者は本ドキュメントに沿って TODO を順次消化することで、Web モックを完成できます。

構成:

- `実装TODO表.md` — 実装の全タスクを網羅したチェックリスト（順次実行で完成）。
- `architecture.md` — 技術選定とプロジェクト構成（shadcn/ui + Tailwind, GitHub Pages）。
- `ui-layout.md` — 画面レイアウト（単一ページ・三カラム）と各領域の要件。
- `state-machine.md` — カード状態（未評価→評価中→達成/非達）等の状態機械定義。
- `data-schemas.md` — 入出力データ（GTFS簡易化/乗降/候補/評価結果）の JSON スキーマ。
- `mock-api.md` — 候補生成/SDT評価モック API と非同期キューの仕様。
- `diversity-rules.md` — 候補多様性ルール（空間/施策/強度の3軸と摂動）。
- `recommendation-logic.md` — 推奨ロジック（優先KPI×補助KPI、しきい値出典の扱い）。
- `filters-and-sorting.md` — 表示・フィルタ・並び替え規則（カード＝地図の同期）。
- `reason-phrases.md` — 「特徴×地域×施策」の1行理由テンプレートと語彙表。
- `async-error-handling.md` — 非同期進捗・リトライ・エラー表示の仕様。
- `kpis.md` — KPI 4軸の定義・単位・算出タイミング（UI上は実測のみ表示）。
- `labels-and-terminology.md` — ラベル/語彙/表記統一ルール。
- `non-functional.md` — 非機能要件（体感2秒・スケルトンUI・対応ブラウザ）。
- `acceptance-checklist.md` — 受入基準（要件→検証手順へのトレーサビリティ）。
- `demo-script.md` — デモ進行台本（想定ストーリーの一気通貫）。
- `project-setup.md` — セットアップ手順（Vite + React + TS + Tailwind + shadcn/ui）。
- `deploy-gh-pages.md` — GitHub Pages へのデプロイ手順と Actions テンプレート（公開先: https://ZephyrCivic.github.io/sdt-moc/）。
 - `gtfs-import.md` — GTFS ZIP の取り込みと `Network` への変換仕様。

初期データ: `gtfs_data/AllLines-20250401_群馬中央バス株式会社.zip` を読み込み、左カラムの「シナリオ抽出」で 10 案を提示する流れが基本ジャーニーです。

GitHub リポジトリ: https://github.com/ZephyrCivic/sdt-moc.git
公開URL（Pages）: https://ZephyrCivic.github.io/sdt-moc/
- `test-plan.md` — 画面/状態/APIモックの試験観点。

補助リソース:

- `../sample-data/` — 最小の地図/候補/評価データ例。

本パックは UI モックの「見る・送る・選ぶ」で体験妥当性を確認することに特化しています。データ連携や最適化アルゴリズムはスコープ外（ブラックボックス）です。
