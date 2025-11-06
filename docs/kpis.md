# KPI 定義（UI表示は実測のみ）

目的: 4軸の名称/単位/算出タイミングを固定し、比較の毀損を避ける。

## 軸と単位

- カバー率 `coverageRate` [%]
- 平均所要時間 `avgTravelTime` [min]
- 運行コスト `operatingCost` [千円/日]
- サービスレベル維持率 `serviceLevelRetention` [%]

## 表示ルール

- 生成直後は非表示。SDT 戻りの実測値のみ UI に表示。
- 疑似値/推定値は UI に出さない（内製ログには保持可）。

## 閾値（例・デモ値）

- coverageRate ≥ 80%
- avgTravelTime ≤ 35min
- operatingCost ≤ 900 千円/日
- serviceLevelRetention ≥ 95%

実値はデモ用の固定配列とし、出典は `recommendation-logic.md` に記載。

