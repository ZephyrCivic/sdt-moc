import { Button } from '@/components/ui/button'
import { GtfsUploadPanel } from '@/widgets/gtfs-upload-panel'
import { NetworkMap } from '@/widgets/network-map'
import { useGtfsUploadStore } from '@/shared/state/gtfs-upload-store'

export function AppShell() {
  const { status, summary } = useGtfsUploadStore((state) => ({
    status: state.status,
    summary: state.summary,
  }))

  const statusLabel = (() => {
    switch (status) {
      case 'reading':
        return '解析中'
      case 'ready':
        return '表示中'
      case 'error':
        return 'エラー'
      default:
        return '未読込'
    }
  })()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-6 py-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">MLIT UI Mock</h1>
          <p className="text-sm text-muted-foreground">
            GTFS取込から候補生成・SDT評価・推奨抽出までを一気通貫で確認するデモ
          </p>
        </div>
      </header>

      <main className="grid h-[calc(100vh-4.5rem)] gap-4 px-6 py-4 lg:grid-cols-[320px_minmax(0,1fr)_360px]">
        <section className="flex flex-col gap-6 overflow-y-auto rounded-lg border border-border bg-card/40 p-4">
          <GtfsUploadPanel />

          <section className="space-y-3">
            <header>
              <h2 className="text-sm font-semibold text-foreground">
                優先KPIの選択
              </h2>
              <p className="text-xs text-muted-foreground">
                カバレッジ率や運行コストなど、主要指標を1つ選んでください。
              </p>
            </header>
            <div className="rounded-lg border border-dashed border-border bg-background/50 p-4 text-sm text-muted-foreground">
              KPIセレクタの実装予定地
            </div>
          </section>

          <section className="space-y-3">
            <header>
              <h2 className="text-sm font-semibold text-foreground">
                シナリオ生成
              </h2>
              <p className="text-xs text-muted-foreground">
                GTFSを読み込んだ後に10案を生成し、SDT評価へ送信します。
              </p>
            </header>
            <Button className="w-full" disabled>
              シナリオを生成
            </Button>
          </section>
        </section>

        <section className="flex flex-col rounded-lg border border-border bg-card/40 p-4">
          <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                地図ビュー
              </h2>
              <p className="text-xs text-muted-foreground">
                {summary
                  ? `${summary.routeCount.toLocaleString()}系統 / ${summary.stopCount.toLocaleString()}停留所 / ${summary.shapeCount.toLocaleString()}経路点`
                  : 'GTFSを読み込むと現状ネットワークを表示します'}
              </p>
            </div>
            <span className="text-xs text-muted-foreground">{statusLabel}</span>
          </header>
          <div className="mt-4 flex min-h-[320px] flex-1">
            <NetworkMap />
          </div>
        </section>

        <section className="flex flex-col overflow-hidden rounded-lg border border-border bg-card/40">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">
              候補シナリオ一覧
            </h2>
            <p className="text-xs text-muted-foreground">
              生成後に10件のカードを表示し、多様性ルールを可視化します。
            </p>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm text-muted-foreground">
            {[1, 2, 3].map((id) => (
              <div
                key={id}
                className="rounded-md border border-dashed border-muted bg-background/60 p-3"
              >
                候補カード {id}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
