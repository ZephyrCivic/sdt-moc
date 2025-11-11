# GitHub Pages公開（B案: sdt-moc で公開）

手順（GitHub UI）:
1) GitHub上でリポジトリを`sdt-moc`→`sdt-moc`にRename（Settings > General > Repository name）。
2) Settings > Pages で Source = GitHub Actions を選択（既定のWorkflowを使用）。
3) mainブランチにpush（またはREADMEを1行編集してcommit）するとActionsが走り、`https://ZephyrCivic.github.io/sdt-moc/` に公開。
4) 404になる場合は、Actionsの`Deploy to GitHub Pages`のログと`vite.config.ts`の`base: '/sdt-moc/'`を再確認。

CLIでの確認:
- `git remote -v` が `origin https://github.com/ZephyrCivic/sdt-moc.git` を指すこと。
- `npm run build` で `dist/` 生成後、ローカルでは `npm run preview` でも動作確認可能。


