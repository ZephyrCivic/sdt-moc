import { Button } from '@/components/ui/button'
import { GtfsUploadPanel } from '@/widgets/gtfs-upload-panel'
import { NetworkMap } from '@/widgets/network-map'
import { PriorityKpiSelect } from '@/widgets/priority-kpi-select'
import { ScenarioPanel } from '@/widgets/scenario-panel'
import { useGtfsUploadStore } from '@/shared/state/gtfs-upload-store'
import { useScenarioControlsStore } from '@/shared/state/scenario-controls-store'
import { useScenarioStore } from '@/shared/state/scenario-store'
import { ImprovementAreaPanel } from '@/widgets/improvement-area-panel/improvement-area-panel'
import { useShallow } from 'zustand/react/shallow'

export function AppShell() {
  const { gtfsStatus, summary } = useGtfsUploadStore(
    useShallow((state) => ({
      gtfsStatus: state.status,
      summary: state.summary,
    })),
  )
  const priorityKpi = useScenarioControlsStore((state) => state.priorityKpi)
  const scenarioStatus = useScenarioStore((state) => state.status)
  const scenarioError = useScenarioStore((state) => state.error)
  const candidateCount = useScenarioStore((state) => state.candidates.length)
  const generateScenarios = useScenarioStore((state) => state.generate)
  const evaluateScenarios = useScenarioStore((state) => state.evaluate)
  const clearScenarioError = useScenarioStore((state) => state.clearError)

  const gtfsStatusLabel = (() => {
    switch (gtfsStatus) {
      case 'reading':
        return '読込中'
      case 'ready':
        return '完了'
      case 'error':
        return 'エラー'
      default:
        return '未読込'
    }
  })()

  const scenarioStatusLabel = (() => {
    switch (scenarioStatus) {
      case 'generating':
        return 'シナリオ生成中'
      case 'evaluating':
        return 'SDT評価中'
      case 'ready':
        return '候補準備完了'
      default:
        return '未生成'
    }
  })()

  const flowReady = gtfsStatus === 'ready'
  const isGenerating = scenarioStatus === 'generating'
  const isEvaluating = scenarioStatus === 'evaluating'
  const canGenerate = flowReady && !isGenerating && !isEvaluating
  const canEvaluate =
    flowReady && candidateCount > 0 && !isGenerating && !isEvaluating

  const handleGenerate = () => {
    clearScenarioError()
    void generateScenarios(priorityKpi)
  }

  const handleEvaluate = () => {
    clearScenarioError()
    void evaluateScenarios()
  }

  return (
    <div className="grid h-screen grid-rows-[auto_1fr] bg-background text-foreground">
      <header className="border-b border-border px-6 py-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            MLIT UI Mock / 見る・送る・選ぶ
          </p>
          <h1 className="text-lg font-semibold">
            GTFSから推奨3案までのワンフローを高速デモ
          </h1>
        </div>
      </header>

      <main className="grid h-full gap-4 px-6 py-4 lg:grid-cols-[minmax(280px,2fr)_minmax(0,5fr)_minmax(320px,3fr)]">
        <section className="flex flex-col gap-4 overflow-hidden rounded-lg border border-border bg-card/40 p-4">
          <GtfsUploadPanel />
          <PriorityKpiSelect />
          <ImprovementAreaPanel />
          <section className="space-y-3 rounded-lg border border-dashed border-border bg-background/40 p-3">
            <p className="text-sm font-semibold">シナリオ抽出</p>
            <p className="text-xs text-muted-foreground">
              GTFSを読み込むと10案を生成し、SDTへまとめて送信できます。
            </p>
            <div className="flex flex-col gap-2">
              <Button
                className="w-full"
                disabled={!canGenerate}
                onClick={handleGenerate}
              >
                シナリオ抽出
              </Button>
              <Button
                className="w-full"
                variant="outline"
                disabled={!canEvaluate}
                onClick={handleEvaluate}
              >
                SDTで評価
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              <p>状態: {scenarioStatusLabel}</p>
              <p>候補数: {candidateCount}件</p>
            </div>
            {scenarioError ? (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {scenarioError}
              </p>
            ) : null}
          </section>
        </section>

        <section className="flex flex-col rounded-lg border border-border bg-card/40 p-4">
          <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                ネットワーク
              </p>
              <p className="text-xs text-muted-foreground">
                {summary
                  ? `${summary.routeCount.toLocaleString()}路線 / ${summary.stopCount.toLocaleString()}停留所 / ${summary.shapeCount.toLocaleString()}形状`
                  : 'GTFSを読み込むと現況ネットワークを表示'}
              </p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p>GTFS: {gtfsStatusLabel}</p>
              <p>候補: {scenarioStatusLabel}</p>
            </div>
          </header>
          <div className="mt-4 flex min-h-[320px] flex-1">
            <NetworkMap />
          </div>
        </section>

        <ScenarioPanel />
      </main>
    </div>
  )
}
