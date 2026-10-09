import { deflateSync } from 'node:zlib'
import type { Page } from '@playwright/test'

/** A one-page PDF with a large, lightly compressed image and some text. */
export function samplePdf(): Buffer {
  const w = 800
  const h = 800
  const raw = Buffer.alloc(w * h * 3)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3
      raw[i] = (x * 255) / w
      raw[i + 1] = (y * 255) / h
      raw[i + 2] = ((x + y) * 3) % 256
    }
  }
  const image = deflateSync(raw, { level: 1 })
  const content = Buffer.from('q 500 0 0 500 50 250 cm /Im1 Do Q BT /F1 24 Tf 50 200 Td (Hello Squooshy) Tj ET')
  const objects: Buffer[] = [
    Buffer.from('<< /Type /Catalog /Pages 2 0 R >>'),
    Buffer.from('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'),
    Buffer.from(
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /XObject << /Im1 5 0 R >> /Font << /F1 6 0 R >> >> >>',
    ),
    Buffer.concat([Buffer.from(`<< /Length ${content.length} >>\nstream\n`), content, Buffer.from('\nendstream')]),
    Buffer.concat([
      Buffer.from(
        `<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${image.length} >>\nstream\n`,
      ),
      image,
      Buffer.from('\nendstream'),
    ]),
    Buffer.from('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'),
  ]
  const parts: Buffer[] = [Buffer.from('%PDF-1.4\n')]
  const offsets: number[] = []
  let length = parts[0].length
  objects.forEach((body, i) => {
    offsets.push(length)
    const obj = Buffer.concat([Buffer.from(`${i + 1} 0 obj\n`), body, Buffer.from('\nendobj\n')])
    parts.push(obj)
    length += obj.length
  })
  const xref =
    `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n` +
    offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('') +
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${length}\n%%EOF\n`
  parts.push(Buffer.from(xref))
  return Buffer.concat(parts)
}

/** A high-quality JPEG photo stand-in, drawn in the browser. */
export async function sampleJpeg(page: Page): Promise<Buffer> {
  const base64 = await page.evaluate(async () => {
    const canvas = new OffscreenCanvas(1600, 1200)
    const ctx = canvas.getContext('2d')!
    const gradient = ctx.createLinearGradient(0, 0, 1600, 1200)
    gradient.addColorStop(0, '#2ec4a6')
    gradient.addColorStop(1, '#ff8a5c')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 1600, 1200)
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = `hsl(${(i * 37) % 360} 70% 60% / 0.5)`
      ctx.beginPath()
      ctx.arc((i * 97) % 1600, (i * 53) % 1200, 20 + (i % 60), 0, Math.PI * 2)
      ctx.fill()
    }
    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.98 })
    const bytes = new Uint8Array(await blob.arrayBuffer())
    let binary = ''
    for (const b of bytes) binary += String.fromCharCode(b)
    return btoa(binary)
  })
  return Buffer.from(base64, 'base64')
}
