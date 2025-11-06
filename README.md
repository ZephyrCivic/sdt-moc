# MLIT UI モック（shadcn/ui + Vite + Pages）

- リポジトリ: https://github.com/ZephyrCivic/sdt-moc.git
- 公開URL（GitHub Pages）: https://ZephyrCivic.github.io/sdt-moc/

本プロジェクトは `docs/実装TODO表.md` に沿って実装を進めると、GTFS 読み込み→シナリオ抽出→SDT評価→推奨表示までの UI モックが完成します。

## クイックリンク

- 実装TODO表: `docs/実装TODO表.md`
- 総覧ドキュメント: `docs/README.md`
- デプロイ手順: `docs/deploy-gh-pages.md`
- GTFS 取り込み仕様: `docs/gtfs-import.md`

## セットアップ（抜粋）

詳細は `docs/project-setup.md` を参照。

```
# 依存インストール
pnpm i

# 開発起動
pnpm dev
```

GTFS ZIP は `gtfs_data/AllLines-20250401_群馬中央バス株式会社.zip` を用意し、画面左カラムの「GTFSを読み込む」から選択してください。

## GitHub リモート設定とプッシュ

```
git init
git remote add origin https://github.com/ZephyrCivic/sdt-moc.git
git add .
git commit -m "chore: bootstrap docs and config"
git branch -M main
git push -u origin main
```

## GitHub Pages

- `vite.config.ts` の `base` は `/sdt-moc/` に設定してください。
- GitHub Actions により `main` へ push すると自動デプロイされます。
- 公開URL: https://ZephyrCivic.github.io/sdt-moc/

