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

function decodeContent(
  content: Uint8Array,
  encoding: GtfsEncoding,
): string {
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

export async function parseGtfsZip(
  file: File,
  encoding: GtfsEncoding,
): Promise<GtfsImportResult> {
  const arrayBuffer = await file.arrayBuffer()
  const binary = new Uint8Array(arrayBuffer)
  const files = unzipSync(binary, {
    filter: (file) => file.name.endsWith('.txt'),
  })

  REQUIRED_FILES.forEach((required) => {
    if (!files[required]) {
      throw new Error(`ZIP内に ${required} が見つかりません`)
    }
  })

  const readFile = (name: string): CsvRecord[] => {
    const entry = files[name]
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
