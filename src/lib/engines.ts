import type { ImageWorkerApi } from '../workers/image.worker'
import type { PdfWorkerApi } from '../workers/pdf.worker'
import { WorkerPool } from './pool'

const cores = typeof navigator === 'undefined' ? 4 : navigator.hardwareConcurrency || 4

// The AVIF and PNG codecs already use several threads each, so a few image
// workers are enough to keep every core busy without running out of memory.
export const imagePool = new WorkerPool<ImageWorkerApi>(
  () => new Worker(new URL('../workers/image.worker.ts', import.meta.url), { type: 'module', name: 'image' }),
  Math.max(1, Math.min(3, Math.floor(cores / 2))),
)

// Ghostscript is single-threaded and memory-hungry, so two at a time.
export const pdfPool = new WorkerPool<PdfWorkerApi>(
  () => new Worker(new URL('../workers/pdf.worker.ts', import.meta.url), { type: 'module', name: 'pdf' }),
  Math.min(2, cores),
)

let warming: Promise<void> | undefined

export function warmUpEngines(): Promise<void> {
  warming ??= Promise.all([imagePool.init(), pdfPool.init()]).then(() => undefined)
  return warming
}
