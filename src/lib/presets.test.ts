import { describe, expect, it } from 'vitest'
import { DEFAULT_ADVANCED, fitWithin, imageJob, pdfJob } from './presets'
import type { Settings } from './types'

const settings = (overrides: Partial<Settings> = {}): Settings => ({
  preset: 'balanced',
  advanced: DEFAULT_ADVANCED,
  ...overrides,
})

describe('imageJob', () => {
  it('keeps the input format by default and uses preset quality', () => {
    expect(imageJob('jpeg', settings())).toMatchObject({ format: 'jpeg', quality: 75, maxSide: null })
  })

  it('caps size on the max preset', () => {
    expect(imageJob('webp', settings({ preset: 'max' }))).toMatchObject({ quality: 60, maxSide: 2560 })
  })

  it('applies advanced overrides', () => {
    const job = imageJob(
      'png',
      settings({ advanced: { ...DEFAULT_ADVANCED, format: 'avif', quality: 33, maxSide: 800 } }),
    )
    expect(job).toMatchObject({ format: 'avif', quality: 33, maxSide: 800, losslessPassthrough: false })
  })

  it('optimises PNG losslessly only when nothing changes its pixels', () => {
    expect(imageJob('png', settings()).losslessPassthrough).toBe(true)
    expect(imageJob('png', settings({ preset: 'max' })).losslessPassthrough).toBe(false)
    expect(imageJob('jpeg', settings({ advanced: { ...DEFAULT_ADVANCED, format: 'png' } })).losslessPassthrough).toBe(
      false,
    )
  })
})

describe('pdfJob', () => {
  it('maps presets to Ghostscript PDFSETTINGS', () => {
    expect(pdfJob(settings({ preset: 'light' })).args).toContain('-dPDFSETTINGS=/printer')
    expect(pdfJob(settings()).args).toContain('-dPDFSETTINGS=/ebook')
    expect(pdfJob(settings({ preset: 'max' })).args).toContain('-dPDFSETTINGS=/screen')
  })

  it('adds downsampling when a DPI is set and ends with the files', () => {
    const { args } = pdfJob(settings({ advanced: { ...DEFAULT_ADVANCED, pdfDpi: 100 } }))
    expect(args).toContain('-dColorImageResolution=100')
    expect(args).toContain('-dMonoImageResolution=200')
    expect(args.slice(-2)).toEqual(['-sOutputFile=out.pdf', 'in.pdf'])
  })
})

describe('fitWithin', () => {
  it('never enlarges', () => {
    expect(fitWithin(800, 600, 2560)).toEqual({ width: 800, height: 600 })
    expect(fitWithin(800, 600, null)).toEqual({ width: 800, height: 600 })
  })

  it('shrinks the longest side and keeps the aspect ratio', () => {
    expect(fitWithin(4000, 3000, 2000)).toEqual({ width: 2000, height: 1500 })
    expect(fitWithin(1000, 5000, 1000)).toEqual({ width: 200, height: 1000 })
  })
})
