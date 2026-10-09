export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'avif'
export type FileKind = ImageFormat | 'pdf'
export type Preset = 'light' | 'balanced' | 'max'
export type OutputFormat = 'original' | ImageFormat

export interface AdvancedSettings {
  format: OutputFormat
  /** 1–100. Overrides the preset's quality for lossy formats. */
  quality: number | null
  /** Longest allowed side in pixels. Overrides the preset's limit. */
  maxSide: number | null
  /** Image resolution inside PDFs. Overrides the preset. */
  pdfDpi: number | null
}

export interface Settings {
  preset: Preset
  advanced: AdvancedSettings
}

export interface ImageJob {
  format: ImageFormat
  quality: number
  /** OxiPNG optimisation level, 0–6. */
  pngLevel: number
  maxSide: number | null
  /** Re-run OxiPNG on the original bytes instead of re-encoding. */
  losslessPassthrough: boolean
}

export interface PdfJob {
  args: string[]
}

export interface CompressResult {
  buffer: ArrayBuffer
  format: FileKind
}
