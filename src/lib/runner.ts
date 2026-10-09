import { useFiles, type Item } from '../store/files'
import { imagePool, pdfPool } from './engines'
import { MIME, renameFor } from './format'
import { AbortedError } from './pool'
import { imageJob, pdfJob } from './presets'
import type { CompressResult, Settings } from './types'

const SETTLE_MS = 250

async function compress(item: Item, settings: Settings, signal: AbortSignal): Promise<CompressResult> {
  const buffer = await item.file.arrayBuffer()
  if (item.kind === 'pdf') {
    const job = pdfJob(settings)
    return pdfPool.run((api) => api.compress(buffer, job), signal)
  }
  const job = imageJob(item.kind, settings)
  return imagePool.run((api) => api.compress(buffer, item.kind as Exclude<typeof item.kind, 'pdf'>, job), signal)
}

/**
 * Watches the store and compresses every queued file. Changing a setting
 * re-queues everything; in-flight work for an outdated run is cancelled.
 */
export function startRunner(): () => void {
  const inFlight = new Map<string, { run: number; controller: AbortController }>()
  let timer: ReturnType<typeof setTimeout> | undefined

  function process(item: Item) {
    const { settings, markWorking, finish, fail } = useFiles.getState()
    const controller = new AbortController()
    inFlight.set(item.id, { run: item.run, controller })
    markWorking(item.id, item.run)

    compress(item, settings, controller.signal)
      .then(({ buffer, format }) => {
        const blob = new Blob([buffer], { type: MIME[format] })
        const keptOriginal = blob.size >= item.file.size && format === item.kind
        finish(item.id, item.run, {
          blob: keptOriginal ? item.file : blob,
          name: renameFor(item.file.name, item.kind, format),
          format,
          keptOriginal,
        })
      })
      .catch((error: unknown) => {
        if (error instanceof AbortedError) return
        fail(item.id, item.run, error instanceof Error ? error.message : String(error))
      })
      .finally(() => {
        if (inFlight.get(item.id)?.controller === controller) inFlight.delete(item.id)
      })
  }

  function sync() {
    const { items } = useFiles.getState()
    const live = new Map(items.map((i) => [i.id, i]))

    for (const [id, job] of inFlight) {
      const item = live.get(id)
      if (!item || item.run !== job.run) {
        job.controller.abort()
        inFlight.delete(id)
      }
    }
    for (const item of items) {
      if (item.status === 'queued' && !inFlight.has(item.id)) process(item)
    }
  }

  // A short pause lets a slider drag settle before work starts.
  const unsubscribe = useFiles.subscribe(() => {
    clearTimeout(timer)
    timer = setTimeout(sync, SETTLE_MS)
  })
  sync()

  return () => {
    unsubscribe()
    clearTimeout(timer)
    for (const job of inFlight.values()) job.controller.abort()
  }
}
