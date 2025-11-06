# 状態機械（カード/評価/推奨）

## カード状態（`status`）

- `not_evaluated` → 初期。KPIは非表示。
- `evaluating` → SDTへ送信済。評価%/最終更新/再送UIを表示。
- `achieved` → 実測KPIが優先KPIの閾値を満たす。
- `not_achieved` → 実測KPIが閾値未満。

遷移:

```
not_evaluated --(bulk evaluate)--> evaluating --(progress)--> evaluating --(done: pass)--> achieved
                                                           └--(done: fail)--> not_achieved
evaluating --(timeout / error)--> evaluating (retry_count++)
```

更新は地図とカードを同一フレーム（同一レンダリングサイクル）で適用すること。

## 推奨フラグ（`recommended`）

 - 判定: 優先KPIの達成/差分順位を第一基準、補助KPIは閾値確認のみ（劣後なし）。
 - 優先KPI切替: KPI値は固定のまま（実測のみ）ランキングと推奨フラグだけが即時更新される。

詳細は `recommendation-logic.md` を参照。

## ガード（ボタン活性/非活性）

- `シナリオ抽出`: `Network`（GTFS取込）が存在しない場合は非活性。
- `SDTで評価`: 候補が 1 件以上存在しない場合は非活性。
