import { useCallback, useMemo, useRef } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useGtfsUploadStore } from '@/shared/state/gtfs-upload-store'
import type { GtfsEncoding } from '@/entities/gtfs/schema'

const ACCEPTED_EXTENSIONS = ['.zip']
const ACCEPTED_MIME_TYPES = [
  'application/zip',
  'application/x-zip-compressed',
  'application/octet-stream',
]

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const value = bytes / Math.pow(k, i)
  return `${value.toFixed(value >= 10 || value % 1 === 0 ? 0 : 1)} ${sizes[i]}`
}

function validateGtfsFile(file: File): string | null {
  const nameLower = file.name.toLowerCase()
  const hasValidExtension = ACCEPTED_EXTENSIONS.some((ext) =>
    nameLower.endsWith(ext),
  )
  if (!hasValidExtension) {
    return 'ZIP形式（.zip）のGTFSファイルを選択してください'
  }

  const isAcceptedMime =
    !file.type || ACCEPTED_MIME_TYPES.includes(file.type.toLowerCase())
  if (!isAcceptedMime) {
    return 'ZIP形式のファイル以外はアップロードできません'
  }

  return null
}

function StatusBadge() {
  const status = useGtfsUploadStore((state) => state.status)
  const label = useMemo(() => {
    switch (status) {
      case 'ready':
        return { text: '読み込み完了', variant: 'secondary' as const }
      case 'reading':
        return { text: '解析中', variant: 'outline' as const }
      case 'error':
        return { text: 'エラー', variant: 'destructive' as const }
      default:
        return { text: '未選択', variant: 'outline' as const }
    }
  }, [status])

  return <Badge variant={label.variant}>{label.text}</Badge>
}

export function GtfsUploadPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { file, encoding, error, lastUpdatedAt, summary, status } =
    useGtfsUploadStore(
      useCallback(
        (state) => ({
          file: state.file,
          encoding: state.encoding,
          error: state.error,
          lastUpdatedAt: state.lastUpdatedAt,
          summary: state.summary,
          status: state.status,
        }),
        [],
      ),
    )
  const { setFile, setEncoding, setError, reset, loadGtfs } =
    useGtfsUploadStore(
      useCallback(
        (state) => ({
          setFile: state.setFile,
          setEncoding: state.setEncoding,
          setError: state.setError,
          reset: state.reset,
          loadGtfs: state.loadGtfs,
        }),
        [],
      ),
    )

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  const processFile = useCallback(
    (nextFile: File | null) => {
      if (!nextFile) {
        reset()
        return
      }

      const validationMessage = validateGtfsFile(nextFile)
      if (validationMessage) {
        setError(validationMessage)
        setFile(null)
        return
      }

      setFile(nextFile)
      setError(null)
    },
    [reset, setError, setFile],
  )

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextFile = event.target.files?.[0] ?? null
      processFile(nextFile)
    },
    [processFile],
  )

  const handleDrop = useCallback(
    (event: DragEvent<HTMLLabelElement>) => {
      event.preventDefault()
      const nextFile = event.dataTransfer.files?.[0] ?? null
      processFile(nextFile)
    },
    [processFile],
  )

  const handleDragOver = useCallback((event: DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleEncodingChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      setEncoding(event.target.value as GtfsEncoding)
    },
    [setEncoding],
  )

  const handleReset = () => {
    reset()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleLoad = () => {
    void loadGtfs()
  }

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            GTFSアップロード
          </h2>
          <p className="text-xs text-muted-foreground">
            ZIPファイルを選択またはドラッグ＆ドロップしてください。
          </p>
        </div>
        <StatusBadge />
      </header>

      <label
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/50 px-4 py-8 text-center transition hover:border-primary hover:bg-muted"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip"
          className="sr-only"
          onChange={handleFileChange}
        />
        <p className="text-sm font-medium text-foreground">
          ファイルをドロップ、または
          <Button
            type="button"
            variant="link"
            className="px-1 py-0 text-sm"
            onClick={(event) => {
              event.preventDefault()
              handleBrowseClick()
            }}
          >
            参照する
          </Button>
        </p>
        <p className="text-xs text-muted-foreground">
          対応形式: GTFS ZIP（Shift_JIS / UTF-8）
        </p>
      </label>

      <div className="space-y-3 rounded-lg border border-border bg-card/60 p-3 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">選択中のファイル</span>
          <span className="font-medium">
            {file ? file.name : '未選択'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>サイズ</span>
          <span>{file ? formatBytes(file.size) : '-'}</span>
        </div>
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>最終更新</span>
          <span>
            {lastUpdatedAt
              ? new Date(lastUpdatedAt).toLocaleString('ja-JP')
              : '-'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor="gtfs-encoding"
            className="text-xs text-muted-foreground"
          >
            文字コード
          </label>
          <select
            id="gtfs-encoding"
            value={encoding}
            onChange={handleEncodingChange}
            className="rounded-md border border-border bg-background px-2 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <option value="auto">自動判定（推奨）</option>
            <option value="utf8">UTF-8 固定</option>
            <option value="shift_jis">Shift_JIS 固定</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={!file || status === 'reading'}
            onClick={handleLoad}
          >
            GTFSを読み込む
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={!file}
            onClick={handleReset}
          >
            クリア
          </Button>
        </div>
      </div>

      {summary ? (
        <div className="rounded-lg border border-border bg-background/70 p-3 text-xs">
          <p className="font-semibold text-foreground">読み込み結果</p>
          <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
            <dt className="text-muted-foreground">停留所</dt>
            <dd>{summary.stopCount.toLocaleString()}</dd>
            <dt className="text-muted-foreground">系統</dt>
            <dd>{summary.routeCount.toLocaleString()}</dd>
            <dt className="text-muted-foreground">便</dt>
            <dd>{summary.tripCount.toLocaleString()}</dd>
            <dt className="text-muted-foreground">経路点</dt>
            <dd>{summary.shapeCount.toLocaleString()}</dd>
            <dt className="text-muted-foreground">停留所時刻</dt>
            <dd>{summary.stopTimeCount.toLocaleString()}</dd>
          </dl>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          読み込み完了後にシナリオ生成ボタンが有効になります。
        </p>
      )}
    </section>
  )
}
