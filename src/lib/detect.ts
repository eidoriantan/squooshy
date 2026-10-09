import type { FileKind } from './types'

const ascii = (bytes: Uint8Array, start: number, length: number) =>
  String.fromCharCode(...bytes.subarray(start, start + length))

/**
 * Works out what a file really is from its first bytes, so a renamed file
 * still gets the right codec. Returns null for anything Squooshy can't handle.
 */
export function detectKind(bytes: Uint8Array): FileKind | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg'
  if (bytes.length >= 8 && ascii(bytes, 0, 8) === '\x89PNG\r\n\x1a\n') return 'png'
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WEBP') return 'webp'
  if (bytes.length >= 12 && ascii(bytes, 4, 4) === 'ftyp') {
    const brand = ascii(bytes, 8, 4)
    if (brand === 'avif' || brand === 'avis') return 'avif'
  }
  // The PDF header may come after some junk bytes, so search the first 1 KB.
  if (ascii(bytes, 0, Math.min(bytes.length, 1024)).includes('%PDF-')) return 'pdf'
  return null
}

export async function detectFileKind(file: Blob): Promise<FileKind | null> {
  const head = new Uint8Array(await file.slice(0, 1024).arrayBuffer())
  return detectKind(head)
}
