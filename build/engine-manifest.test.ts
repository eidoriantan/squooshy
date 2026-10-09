import { describe, expect, it } from 'vitest'
import { labelFor } from './engine-manifest.ts'

describe('labelFor', () => {
  it('names engines the way the loading screen shows them', () => {
    expect(labelFor('gs-BxR2.wasm')).toBe('PDF engine')
    expect(labelFor('avif_enc_mt-a1.wasm')).toBe('AVIF codec')
    expect(labelFor('mozjpeg_enc-a1.wasm')).toBe('JPEG codec')
    expect(labelFor('webp_enc_simd-a1.wasm')).toBe('WebP codec')
    expect(labelFor('squoosh_oxipng_bg-a1.wasm')).toBe('PNG codec')
    expect(labelFor('squoosh_resize_bg-a1.wasm')).toBe('Image resizer')
    expect(labelFor('image.worker-a1.js')).toBe('Workers')
  })
})
