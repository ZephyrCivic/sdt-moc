# データスキーマ（JSON / Zod）

目的: UIモックで扱うデータ構造の正準定義。GTFSは簡易表現に落とし、候補/評価/KPI/アノテーションの整合を確保する。

## 現状ネットワーク（簡易）

```ts
type Stop = { id: string; name: string; lon: number; lat: number };
type Route = { id: string; name: string; geometry: GeoJSON.LineString; stopIds: string[] };
type Usage = { stopId: string; boardings: number; alightings: number };

type Network = { stops: Stop[]; routes: Route[]; usage?: Usage[] };
```

## 候補（10案）

```ts
type CandidateId = string;
type Measure = '減便' | '停留所統廃合' | '区間短縮' | 'DRTゾーン';
type Strength = '弱' | '中' | '強';
type GeometryKind = 'line' | 'point' | 'polygon';

type Annotation = {
  kind: GeometryKind;
  feature: GeoJSON.LineString | GeoJSON.Point | GeoJSON.Polygon;
  note?: string; // 差分注記
};

type Candidate = {
  id: CandidateId;
  title: string; // 表示名（ID重ならない）
  reason: string; // 1行理由（特徴×地域×施策）
  measure: Measure;
  strength: Strength;
  annotations: Annotation[]; // 地図描画に使用
  diversityFlags: { spatial: boolean; measureMix: boolean; strengthMix: boolean };
  status: 'not_evaluated' | 'evaluating' | 'achieved' | 'not_achieved';
  progress?: number; // 0..100
  lastUpdatedAt?: string; // ISO8601
  kpi?: KPI; // 実測のみ（評価完了後）
  recommended?: boolean;
};
```

## KPI（4軸、実測のみ表示）

```ts
type KPI = {
  coverageRate: number; // カバー率 [%]
  avgTravelTime: number; // 平均所要時間 [min]
  operatingCost: number; // 運行コスト [千円/日]
  serviceLevelRetention: number; // サービスレベル維持率 [%]
};
```

## SDT 評価結果（モック）

```ts
type SdtProgressEvent = {
  candidateId: CandidateId;
  progress: number; // 0..100
  lastUpdatedAt: string;
  done?: boolean;
  result?: { kpi: KPI; achieved: boolean };
  errorCode?: string; // タイムアウト/一部失敗など
};
```

Zod スキーマは型に追随して `src/shared/types/` に配置すること（T10-SCHEMA）。

