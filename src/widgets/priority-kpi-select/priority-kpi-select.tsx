import { KPI_DEFINITIONS, KPI_PRIORITY_ORDER } from '@/shared/types/kpi'
import { useScenarioControlsStore } from '@/shared/state/scenario-controls-store'
import { useScenarioStore } from '@/shared/state/scenario-store'

export function PriorityKpiSelect() {
  const priorityKpi = useScenarioControlsStore((state) => state.priorityKpi)
  const setPriorityKpi = useScenarioControlsStore(
    (state) => state.setPriorityKpi,
  )
  const scenarioStatus = useScenarioStore((state) => state.status)

  const selected = KPI_DEFINITIONS[priorityKpi]
  const disabled = scenarioStatus === 'generating' || scenarioStatus === 'evaluating'

  return (
    <section className="space-y-3">
      <header>
        <p className="text-xs font-semibold text-muted-foreground">
          優先KPIの選択
        </p>
        <p className="text-xs text-muted-foreground">
          1つ選ぶだけで生成〜評価〜推奨までの優先度を固定します。
        </p>
      </header>
      <div className="space-y-2 rounded-lg border border-border bg-card/60 p-3">
        <label
          htmlFor="priority-kpi"
          className="text-xs font-medium text-muted-foreground"
        >
          比較軸
        </label>
        <select
          id="priority-kpi"
          value={priorityKpi}
          onChange={(event) =>
            setPriorityKpi(event.target.value as typeof priorityKpi)
          }
          disabled={disabled}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          {KPI_PRIORITY_ORDER.map((key) => {
            const definition = KPI_DEFINITIONS[key]
            return (
              <option key={key} value={key}>
                {definition.label}（{definition.unit}）
              </option>
            )
          })}
        </select>
        <p className="text-xs text-muted-foreground">
          {selected.label}：{selected.description}
        </p>
      </div>
    </section>
  )
}
