import decodeAvif, { init as initAvifDecode } from '@jsquash/avif/decode'
import encodeAvif, { init as initAvifEncode } from '@jsquash/avif/encode'
import decodeJpeg, { init as initJpegDecode } from '@jsquash/jpeg/decode'
import encodeJpeg, { init as initJpegEncode } from '@jsquash/jpeg/encode'
import optimisePng, { init as initOxipng } from '@jsquash/oxipng/optimise'
import decodePng, { init as initPngDecode } from '@jsquash/png/decode'
import resize, { initResize } from '@jsquash/resize'
import decodeWebp, { init as initWebpDecode } from '@jsquash/webp/decode'
import encodeWebp, { init as initWebpEncode } from '@jsquash/webp/encode'
import { expose, transfer } from 'comlink'
import { fitWithin } from '../lib/presets'
import type { CompressResult, ImageFormat, ImageJob } from '../lib/types'

const fallbackDecoders: Record<ImageFormat, (buffer: ArrayBuffer) => Promise<ImageData | null>> = {
  jpeg: decodeJpeg,
  png: decodePng,
  webp: decodeWebp,
  avif: decodeAvif,
}

/**
 * Prefers the browser's own decoder because it applies EXIF orientation, so
 * phone photos don't come out sideways. Falls back to the WASM decoders for
 * formats the browser can't read (for example AVIF on older Safari).
 */
async function decode(buffer: ArrayBuffer, format: ImageFormat): Promise<ImageData> {
  try {
    const bitmap = await createImageBitmap(new Blob([buffer]), { imageOrientation: 'from-image' })
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(bitmap, 0, 0)
    bitmap.close()
    return ctx.getImageData(0, 0, canvas.width, canvas.height)
  } catch {
    const image = await fallbackDecoders[format](buffer)
    if (!image) throw new Error(`This ${format.toUpperCase()} file couldn't be read. It may be damaged.`)
    return image
  }
}

/** JPEG has no transparency, so see-through pixels are placed on white. */
function flattenOnWhite(image: ImageData): ImageData {
  const data = image.data
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3] / 255
    if (alpha === 1) continue
    data[i] = data[i] * alpha + 255 * (1 - alpha)
    data[i + 1] = data[i + 1] * alpha + 255 * (1 - alpha)
    data[i + 2] = data[i + 2] * alpha + 255 * (1 - alpha)
    data[i + 3] = 255
  }
  return image
}

function encode(image: ImageData, job: ImageJob): Promise<ArrayBuffer> {
  switch (job.format) {
    case 'jpeg':
      return encodeJpeg(flattenOnWhite(image), { quality: job.quality })
    case 'webp':
      return encodeWebp(image, { quality: job.quality })
    case 'avif':
      return encodeAvif(image, { quality: job.quality, speed: 6 })
    case 'png':
      return optimisePng(image, { level: job.pngLevel })
  }
}

const api = {
  /** Compiles every codec up front so the first file starts right away. */
  async init() {
    await Promise.all([
      initJpegDecode(),
      initJpegEncode(),
      initPngDecode(),
      initOxipng(),
      initWebpDecode(),
      initWebpEncode(),
      initAvifDecode(),
      initAvifEncode(),
      initResize(),
    ])
  },

  async compress(buffer: ArrayBuffer, input: ImageFormat, job: ImageJob): Promise<CompressResult> {
    if (job.losslessPassthrough) {
      const out = await optimisePng(buffer, { level: job.pngLevel })
      return transfer({ buffer: out, format: 'png' }, [out])
    }

    let image = await decode(buffer, input)
    const target = fitWithin(image.width, image.height, job.maxSide)
    if (target.width !== image.width || target.height !== image.height) {
      image = await resize(image, { ...target, method: 'lanczos3' })
    }
    const out = await encode(image, job)
    return transfer({ buffer: out, format: job.format }, [out])
  },
}

export type ImageWorkerApi = typeof api

expose(api)
