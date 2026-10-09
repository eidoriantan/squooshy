import type { AdvancedSettings, ImageFormat, ImageJob, PdfJob, Preset, Settings } from './types'

interface PresetSpec {
  label: string
  blurb: string
  quality: Record<Exclude<ImageFormat, 'png'>, number>
  pngLevel: number
  maxSide: number | null
  pdfSettings: '/printer' | '/ebook' | '/screen'
}

export const PRESETS: Record<Preset, PresetSpec> = {
  light: {
    label: 'Light',
    blurb: 'Barely touched. Best for print and photos you care about.',
    quality: { jpeg: 85, webp: 85, avif: 70 },
    pngLevel: 2,
    maxSide: null,
    pdfSettings: '/printer',
  },
  balanced: {
    label: 'Balanced',
    blurb: 'Much smaller and still looks great on screen.',
    quality: { jpeg: 75, webp: 75, avif: 55 },
    pngLevel: 3,
    maxSide: null,
    pdfSettings: '/ebook',
  },
  max: {
    label: 'Max squoosh',
    blurb: 'As small as it gets. Good for email and chat.',
    quality: { jpeg: 60, webp: 60, avif: 40 },
    pngLevel: 4,
    maxSide: 2560,
    pdfSettings: '/screen',
  },
}

export const DEFAULT_ADVANCED: AdvancedSettings = {
  format: 'original',
  quality: null,
  maxSide: null,
  pdfDpi: null,
}

export const DEFAULT_SETTINGS: Settings = {
  preset: 'balanced',
  advanced: DEFAULT_ADVANCED,
}

export function imageJob(input: ImageFormat, settings: Settings): ImageJob {
  const spec = PRESETS[settings.preset]
  const { advanced } = settings
  const format = advanced.format === 'original' ? input : advanced.format
  const maxSide = advanced.maxSide ?? spec.maxSide
  return {
    format,
    quality: advanced.quality ?? (format === 'png' ? 100 : spec.quality[format]),
    pngLevel: spec.pngLevel,
    maxSide,
    // A PNG staying a PNG at full size is optimised losslessly from its own
    // bytes, which keeps every pixel exactly as it was.
    losslessPassthrough: input === 'png' && format === 'png' && maxSide === null,
  }
}

export function pdfJob(settings: Settings, input = 'in.pdf', output = 'out.pdf'): PdfJob {
  const spec = PRESETS[settings.preset]
  const args = [
    '-sDEVICE=pdfwrite',
    '-dCompatibilityLevel=1.5',
    `-dPDFSETTINGS=${spec.pdfSettings}`,
    '-dDetectDuplicateImages=true',
    '-dCompressFonts=true',
    '-dSubsetFonts=true',
  ]
  const dpi = settings.advanced.pdfDpi
  if (dpi !== null) {
    args.push(
      '-dDownsampleColorImages=true',
      '-dDownsampleGrayImages=true',
      '-dDownsampleMonoImages=true',
      `-dColorImageResolution=${dpi}`,
      `-dGrayImageResolution=${dpi}`,
      `-dMonoImageResolution=${Math.min(dpi * 2, 600)}`,
    )
  }
  args.push('-dNOPAUSE', '-dBATCH', '-dQUIET', '-dSAFER', `-sOutputFile=${output}`, input)
  return { args }
}

/** Fits width × height inside a square of maxSide, never enlarging. */
export function fitWithin(width: number, height: number, maxSide: number | null) {
  if (maxSide === null || (width <= maxSide && height <= maxSide)) return { width, height }
  const scale = maxSide / Math.max(width, height)
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}
