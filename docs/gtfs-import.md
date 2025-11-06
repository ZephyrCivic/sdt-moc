# GTFS 取り込み仕様（ZIPアップロード → ネットワーク表示）

目的: ユーザーが `gtfs_data/AllLines-20250401_群馬中央バス株式会社.zip` を読み込み、地図に現状ネットワークを描画できるようにする。以降の「シナリオ抽出」は、この GTFS を前提に 10 案を提示する。

## ユーザーフロー

1. 画面左カラムに「GTFSを読み込む（.zip）」のファイル入力がある
2. ZIP を選択すると、クライアント側で解凍→CSV 解析→`Network` へ変換
3. 中央地図へ路線（LineString）と停留所（Point）を描画（利用状況は任意）
4. 「シナリオ抽出」を押すと、10 案のカードが右カラムに出現（未評価）

## 対応ファイル（最小）

- `stops.txt`（必須）: `stop_id, stop_name, stop_lon, stop_lat`
- `routes.txt`（必須）: `route_id, route_short_name|route_long_name`
- `trips.txt`（推奨）: `route_id, trip_id, shape_id?`
- `shapes.txt`（任意）: 可能なら線形復元に使用（`shape_id, shape_pt_lat, shape_pt_lon, shape_pt_sequence`）
- `stop_times.txt`（任意）: 停留所–経路関係の補助

`shapes.txt` が無い場合は、`stop_times` から区間を近似し簡略線を生成する（抽象表示で可）。

## 実装ライブラリ

- ZIP 解凍: `fflate`（軽量・ブラウザ対応）
- CSV 解析: `papaparse`

## 型マッピング

- `docs/data-schemas.md` の `Network`, `Stop`, `Route` にマップする
- 形状は GeoJSON として格納

## 例: ブラウザでの解凍→CSV 解析（擬似コード）

```ts
import { unzipSync, strFromU8 } from 'fflate'
import Papa from 'papaparse'

export async function parseGtfsZip(file: File): Promise<Network> {
  const ab = await file.arrayBuffer()
  const u8 = new Uint8Array(ab)
  const files = unzipSync(u8)

  const readCsv = (name: string) => Papa.parse(strFromU8(files[name]), { header: true }).data

  const stops = readCsv('stops.txt') as any[]
  const routes = readCsv('routes.txt') as any[]
  const trips = files['trips.txt'] ? (readCsv('trips.txt') as any[]) : []
  const shapes = files['shapes.txt'] ? (readCsv('shapes.txt') as any[]) : []
  const stopTimes = files['stop_times.txt'] ? (readCsv('stop_times.txt') as any[]) : []

  // ...必要な最小変換を実施して Network を返す（詳細は実装タスク T05/T12）。
  return { stops: [], routes: [] }
}
```

## Map 表示

- `MapLibre GL` の `geojson` ソースで `stops` と `routes` を描画
- 描画スタイルは `ui-layout.md` に従い、候補アノテーションと干渉しない配色にする

## エラーハンドリング

- 必須ファイル欠落時は、段階的劣化表示（停留所のみ→停留所＋簡易線）
- 解析エラーは左カラムにトースト表示（shadcn/ui の `Toast` か `Alert`）

## 初期ファイル配置（オプション）

- ローカルでの検証を容易にするため、`gtfs_data/` に ZIP を置けるようにする
- `.gitignore` で `gtfs_data/*.zip` を除外

