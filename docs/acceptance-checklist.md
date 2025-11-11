# 受入チェックリスト（UAT）

- [x] GTFS ZIP を読み込むと現状ネットワークが地図表示される（2025-11-07: `GtfsUploadPanel` + `NetworkMap` で確認）
- [x] 「シナリオ抽出」で 10 枚のカードが出現し、各カードに「1行理由」「未評価」バッジが付与される（`ScenarioPanel` 実装）
- [x] 「SDTで評価」で 10 案が一括評価され、実測KPIと達成/非達がカード=地図で一致反映される（`scenario-store` SSE 反映）
- [x] 優先KPIに基づく自動推奨が表示される（バッジ）。「推奨のみ表示」で絞り込める
- [x] 体験は「見る・送る・選ぶ」で完結（手動編集UIは存在しない）
- [x] 非同期進捗/再送/最終更新がカード小UIで確認できる
- [x] フィルタ/並び替えがカード=地図で同期適用される
- [x] 文言/表記が `labels-and-terminology.md` と一致
- [x] GitHub Pages で公開URL（`https://ZephyrCivic.github.io/sdt-moc/`）から正常表示される（2025-11-11: `Invoke-WebRequest` で HTTP 200 を確認）
 - [x] GTFS 未読込時は「シナリオ抽出」ボタンが非活性（`AppShell`で `canGenerate` 判定）
 - [x] 候補 0 件時は「SDTで評価」ボタンが非活性（`AppShell`で `candidateCount` 判定）
