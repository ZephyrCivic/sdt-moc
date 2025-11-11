# 福津市バスルート最適化シミュレーター

福津市の既存バス停データ（GTFS）と Gemini API を組み合わせ、改善余地の大きいエリアを可視化しながら最適ルート案を生成するシミュレーターです。キャンバス上で選択したエリアをもとにシナリオ候補を生成し、採用シナリオを比較できます。

## スタック

- React 19 + Vite 6（TypeScript）
- Tailwind CSS CDN（軽量なテーマ適用のみ）
- Google Gemini API（`@google/genai`）

## ローカル開発

1. Node.js 18 以上を用意
2. 依存関係をインストール  
   ```bash
   npm install
   ```
3. `GEMINI_API_KEY` を [.env.local](.env.local) に設定
4. 開発サーバーを起動  
   ```bash
   npm run dev
   ```

## ビルド

```bash
npm run build
```

出力（`dist/`）を GitHub Pages で配信します。`vite.config.ts` の `base` はプロジェクトリポジトリ `sdt-moc` を想定し `/sdt-moc/` に設定しています。異なる公開パスに変更する場合は `base` を更新してください。

## GitHub Pages へのデプロイ

- `.github/workflows/deploy.yml` が GitHub Actions でビルド＆`gh-pages` 既定環境にデプロイします。
- `main` ブランチへ push すると自動で `npm ci && npm run build` が走り、`dist/` が Pages に公開されます。
- 初回のみリポジトリ設定の **Settings > Pages** で **Source: GitHub Actions** を選択してください。
- デプロイ URL: `https://<GitHubユーザー名>.github.io/sdt-moc/`

## フォルダ構成

```
.
├─ App.tsx            # UI ロジック（ステップ UI、マップ、シナリオ比較）
├─ index.tsx          # React エントリーポイント
├─ index.html         # Vite テンプレート & Tailwind CDN 設定
├─ services/
│  ├─ gtfsService.ts  # 福津市 GTFS データの解析
│  └─ geminiService.ts # Gemini でのシナリオ生成
├─ types.ts           # 型定義
└─ vite.config.ts     # Vite 設定（Pages 向け base など）
```

## 環境変数

| 変数            | 用途                         |
|-----------------|------------------------------|
| `GEMINI_API_KEY` | Gemini Generative Language API 認証 |

`.env.local` に書き込むと `process.env.GEMINI_API_KEY` として参照されます。README には鍵をコミットしないよう注意してください。
