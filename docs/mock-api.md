# モック API 仕様（MSW）

目的: 生成と評価を API らしく扱い、UI の非同期挙動を検証する。

## エンドポイント

- `POST /mock/generate`
  - 入力: `{ priorityKpi: 'coverageRate' | 'avgTravelTime' | 'operatingCost' | 'serviceLevelRetention' }`
  - 出力: `{ candidates: Candidate[] }`（10件, すべて `not_evaluated`, `kpi` 欄なし）
  - ロジック: `diversity-rules.md` に基づき、空間/施策/強度を満たすよう擬似生成。
  - 前提: 直前に GTFS がロード済みで `Network` がストアに存在（`docs/gtfs-import.md`）。

- `POST /mock/sdt/evaluate`
  - 入力: `{ candidateIds: string[] }`（10件）
  - 出力: `{ accepted: string[] }`（受理ID）
  - 効果: サーバ側（MSW 内）で進捗ストリームを生成開始。

- `GET /mock/sdt/stream`
  - 方式: Server-Sent Events（SSE）風。開発では `setInterval` でポーリング代替も可。
  - 出力: `SdtProgressEvent` の逐次配信。部分失敗/タイムアウトも混在。

## 進捗とリトライ

- 進捗は 5–15% 刻み、10–60秒で収束（デモ用）。
- タイムアウト時は `errorCode='TIMEOUT'` を返し、UI が自動/手動再送を提示。
- 再送は `POST /mock/sdt/evaluate` を同一 `candidateId` で再呼び出し。

## 実装メモ

- MSW のハンドラは `src/shared/api/handlers.ts` に実装。
- ストアとの境界は `src/shared/api/client.ts` を経由させ、副作用を分離。

型定義は `data-schemas.md` を参照。
