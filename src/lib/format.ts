import type { FileKind } from './types'

export const MIME: Record<FileKind, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  pdf: 'application/pdf',
}

const EXTENSION: Record<FileKind, string> = {
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
  avif: 'avif',
  pdf: 'pdf',
}

export const FORMAT_LABEL: Record<FileKind, string> = {
  jpeg: 'JPEG',
  png: 'PNG',
  webp: 'WebP',
  avif: 'AVIF',
  pdf: 'PDF',
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`
}

/** Percentage saved, rounded down so we never overstate it. */
export function savedPercent(before: number, after: number): number {
  if (before <= 0 || after >= before) return 0
  return Math.floor(((before - after) / before) * 100)
}

/** photo.PNG → photo.webp. Keeps the name when the format doesn't change. */
export function renameFor(name: string, from: FileKind, to: FileKind): string {
  if (from === to) return name
  const dot = name.lastIndexOf('.')
  const base = dot > 0 ? name.slice(0, dot) : name
  return `${base}.${EXTENSION[to]}`
}

/** Makes names unique for a ZIP: photo.jpg, photo (2).jpg, photo (3).jpg. */
export function uniqueNames(names: string[]): string[] {
  const taken = new Set<string>()
  return names.map((name) => {
    const dot = name.lastIndexOf('.')
    const base = dot > 0 ? name.slice(0, dot) : name
    const ext = dot > 0 ? name.slice(dot) : ''
    let candidate = name
    for (let n = 2; taken.has(candidate.toLowerCase()); n++) candidate = `${base} (${n})${ext}`
    taken.add(candidate.toLowerCase())
    return candidate
  })
}
