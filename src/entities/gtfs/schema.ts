import { z } from 'zod'

export const gtfsEncodingSchema = z.enum(['auto', 'utf8', 'shift_jis'])
export type GtfsEncoding = z.infer<typeof gtfsEncodingSchema>

export const gtfsFileMetadataSchema = z.object({
  name: z.string().min(1, 'ファイル名が空です'),
  size: z.number().int().nonnegative(),
  lastModified: z.number().int().nonnegative(),
  type: z.string().optional(),
})
export type GtfsFileMetadata = z.infer<typeof gtfsFileMetadataSchema>

export const gtfsUploadRequestSchema = z.object({
  file: gtfsFileMetadataSchema,
  encoding: gtfsEncodingSchema,
})
export type GtfsUploadRequest = z.infer<typeof gtfsUploadRequestSchema>

export function toGtfsFileMetadata(file: File): GtfsFileMetadata {
  return {
    name: file.name,
    size: file.size,
    lastModified: file.lastModified,
    type: file.type,
  }
}
