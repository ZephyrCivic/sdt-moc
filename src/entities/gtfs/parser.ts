import Papa from 'papaparse'
import iconv from 'iconv-lite'
import { unzipSync } from 'fflate'
import { Buffer } from 'buffer'
import type { GtfsEncoding } from './schema'

type CsvRecord = Record<string, string>

export interface GtfsImportResult {
  stops: CsvRecord[]
  routes: CsvRecord[]
  trips: CsvRecord[]
  shapes: CsvRecord[]
  stopTimes: CsvRecord[]
}

export interface GtfsImportSummary {
  stopCount: number
  routeCount: number
  tripCount: number
  shapeCount: number
  stopTimeCount: number
}

const REQUIRED_FILES = ['stops.txt', 'routes.txt'] as const

function decodeContent(content: Uint8Array, encoding: GtfsEncoding): string {
  if (encoding === 'utf8') {
    return new TextDecoder('utf-8').decode(content)
  }
  if (encoding === 'shift_jis') {
    return iconv.decode(Buffer.from(content), 'shift_jis')
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(content)
  } catch {
    return iconv.decode(Buffer.from(content), 'shift_jis')
  }
}

function parseCsv(content: string): CsvRecord[] {
  const result = Papa.parse<CsvRecord>(content, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  })

  if (result.errors.length > 0) {
    const message = result.errors[0]?.message ?? 'CSV parsing error'
    throw new Error(`CSVの解析に失敗しました: ${message}`)
  }

  return result.data
}

function buildNameResolver(files: Record<string, Uint8Array>) {
  const entries = Object.entries(files).map(([name, content]) => ({
    name,
    base: name.split('/').pop()!.toLowerCase(),
    content,
  }))

  return (target: string): Uint8Array | null => {
    if ((files as any)[target]) return (files as any)[target]
    const targetLower = target.toLowerCase()
    const hit = entries.find((e) => e.base === targetLower)
    return hit ? hit.content : null
  }
}

export async function parseGtfsZip(
  file: File,
  encoding: GtfsEncoding,
): Promise<GtfsImportResult> {
  const arrayBuffer = await file.arrayBuffer()
  const binary = new Uint8Array(arrayBuffer)
  const files = unzipSync(binary, {
    filter: (file) => file.name.endsWith('.txt'),
  })
  const resolve = buildNameResolver(files as any)

  // Validate required files exist somewhere in the zip (even under subfolders)
  for (const required of REQUIRED_FILES) {
    if (!resolve(required)) {
      throw new Error(`ZIP内に必要ファイルが見つかりません: ${required}`)
    }
  }

  const readFile = (name: string): CsvRecord[] => {
    const entry = resolve(name)
    if (!entry) return []
    const decoded = decodeContent(entry, encoding)
    return parseCsv(decoded)
  }

  return {
    stops: readFile('stops.txt'),
    routes: readFile('routes.txt'),
    trips: readFile('trips.txt'),
    shapes: readFile('shapes.txt'),
    stopTimes: readFile('stop_times.txt'),
  }
}

export function summarizeGtfs(result: GtfsImportResult): GtfsImportSummary {
  return {
    stopCount: result.stops.length,
    routeCount: result.routes.length,
    tripCount: result.trips.length,
    shapeCount: result.shapes.length,
    stopTimeCount: result.stopTimes.length,
  }
}

