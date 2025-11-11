import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useGtfsUploadStore } from '@/shared/state/gtfs-upload-store'
import type { MeshScore } from '@/shared/lib/mesh-grid'
import { cn } from '@/lib/utils'

const STATUS_BADGE: Record<
  MeshScore['status'],
  { label: string; variant: 'destructive' | 'default' | 'secondary' }
> = {
  improve: { label: '要改善', variant: 'destructive' },
  watch: { label: '監視', variant: 'default' },
  healthy: { label: '安定', variant: 'secondary' },
}

const MAX_ITEMS = 6

export function ImprovementAreaPanel() {
  const meshScores = useGtfsUploadStore((state) => state.meshScores)
  const activeCellId = useGtfsUploadStore(
    (state) => state.activeMeshCellId,
  )
  const setActiveMeshCell = useGtfsUploadStore(
    (state) => state.setActiveMeshCell,
  )

  const topScores = useMemo(
    () => meshScores.slice(0, MAX_ITEMS),
    [meshScores],
  )

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border bg-card/40 p-3">
      <header className="space-y-1">
        <p className="text-xs font-semibold text-muted-foreground">
          改善エリア
        </p>
        <p className="text-xs text-muted-foreground">
          メッシュ判定で需要に対してサービス不足のエリアを表示します。
        </p>
      </header>

      <div className="max-h-[320px] space-y-2 overflow-y-auto pr-2">
        {topScores.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            GTFSを読み込むと改善エリアを算出します。
          </p>
        ) : (
          topScores.map((cell) => {
            const badge = STATUS_BADGE[cell.status]
            return (
              <Card
                key={cell.id}
                className={cn(
                  'cursor-pointer space-y-2 border-border/70 bg-card/70 p-3 transition hover:border-primary/60',
                  activeCellId === cell.id && 'ring-2 ring-primary',
                )}
                onMouseEnter={() => setActiveMeshCell(cell.id)}
                onMouseLeave={() => setActiveMeshCell(null)}
                onFocus={() => setActiveMeshCell(cell.id)}
                onBlur={() => setActiveMeshCell(null)}
                tabIndex={0}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">セル {cell.id}</p>
                    <p className="text-sm font-semibold text-foreground">
                      {formatLocation(cell)}
                    </p>
                  </div>
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </div>
                <dl className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>
                    <dt>停留所</dt>
                    <dd className="font-semibold text-foreground">
                      {cell.metrics.stopCount} 箇所
                    </dd>
                  </div>
                  <div>
                    <dt>路線</dt>
                    <dd className="font-semibold text-foreground">
                      {cell.metrics.routeCount} 本
                    </dd>
                  </div>
                  <div>
                    <dt>需要/停留所</dt>
                    <dd className="font-semibold text-foreground">
                      {cell.metrics.demandPerStop.toFixed(0)} 人
                    </dd>
                  </div>
                  <div>
                    <dt>合計需要</dt>
                    <dd className="font-semibold text-foreground">
                      {cell.metrics.demand.toFixed(0)} 人
                    </dd>
                  </div>
                </dl>
                <p className="text-xs text-muted-foreground">{cell.reason}</p>
              </Card>
            )
          })
        )}
      </div>
    </section>
  )
}

function formatLocation(cell: MeshScore) {
  return `${cell.centroid.lat.toFixed(3)}°, ${cell.centroid.lon.toFixed(3)}°`
}
