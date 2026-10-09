import { describe, expect, it } from 'vitest'
import { detectKind } from './detect'

const bytes = (...parts: (string | number[])[]) =>
  new Uint8Array(parts.flatMap((p) => (typeof p === 'string' ? [...p].map((c) => c.charCodeAt(0)) : p)))

describe('detectKind', () => {
  it('detects JPEG', () => {
    expect(detectKind(bytes([0xff, 0xd8, 0xff, 0xe0]))).toBe('jpeg')
  })

  it('detects PNG', () => {
    expect(detectKind(bytes([0x89], 'PNG\r\n\x1a\n'))).toBe('png')
  })

  it('detects WebP', () => {
    expect(detectKind(bytes('RIFF', [0, 0, 0, 0], 'WEBPVP8 '))).toBe('webp')
  })

  it('detects AVIF by its ftyp brand', () => {
    expect(detectKind(bytes([0, 0, 0, 0x20], 'ftypavif'))).toBe('avif')
    expect(detectKind(bytes([0, 0, 0, 0x20], 'ftypavis'))).toBe('avif')
  })

  it('rejects HEIC, which shares the ftyp box', () => {
    expect(detectKind(bytes([0, 0, 0, 0x18], 'ftypheic'))).toBeNull()
  })

  it('detects PDF, even after leading junk', () => {
    expect(detectKind(bytes('%PDF-1.7\n'))).toBe('pdf')
    expect(detectKind(bytes([0xef, 0xbb, 0xbf], '%PDF-1.4'))).toBe('pdf')
  })

  it('rejects unknown and empty input', () => {
    expect(detectKind(bytes('GIF89a'))).toBeNull()
    expect(detectKind(new Uint8Array())).toBeNull()
  })
})
