import { wrap, type Remote } from 'comlink'

interface WarmableApi {
  init(): Promise<void>
}

interface Slot<T> {
  worker: Worker
  api: Remote<T>
  ready: Promise<void>
  busy: boolean
}

export class AbortedError extends Error {
  constructor() {
    super('Cancelled')
    this.name = 'AbortedError'
  }
}

/**
 * A fixed set of warmed-up workers. Tasks wait for a free worker. Cancelling a
 * running task terminates its worker, since a WASM call can't be interrupted,
 * and a fresh worker takes its place.
 */
export class WorkerPool<T extends WarmableApi> {
  private slots: Slot<T>[] = []
  private waiting: (() => void)[] = []
  private readonly create: () => Worker
  readonly size: number

  constructor(create: () => Worker, size: number) {
    this.create = create
    this.size = size
  }

  private spawn(): Slot<T> {
    const worker = this.create()
    const api = wrap<T>(worker)
    const slot: Slot<T> = { worker, api, ready: api.init() as Promise<void>, busy: false }
    return slot
  }

  /** Starts every worker and resolves once all codecs are compiled. */
  init(): Promise<void> {
    if (this.slots.length === 0) {
      this.slots = Array.from({ length: this.size }, () => this.spawn())
    }
    return Promise.all(this.slots.map((s) => s.ready)).then(() => undefined)
  }

  private async acquire(signal?: AbortSignal): Promise<Slot<T>> {
    void this.init()
    for (;;) {
      if (signal?.aborted) throw new AbortedError()
      const free = this.slots.find((s) => !s.busy)
      if (free) {
        free.busy = true
        return free
      }
      await new Promise<void>((resolve) => this.waiting.push(resolve))
    }
  }

  private release(slot: Slot<T>) {
    slot.busy = false
    this.waiting.shift()?.()
  }

  async run<R>(task: (api: Remote<T>) => Promise<R>, signal?: AbortSignal): Promise<R> {
    const slot = await this.acquire(signal)
    let onAbort: (() => void) | undefined
    try {
      await slot.ready
      return await new Promise<R>((resolve, reject) => {
        onAbort = () => {
          // Swap in a fresh worker; the old one may be stuck mid-encode.
          slot.worker.terminate()
          const fresh = this.spawn()
          Object.assign(slot, { worker: fresh.worker, api: fresh.api, ready: fresh.ready })
          reject(new AbortedError())
        }
        if (signal?.aborted) return onAbort()
        signal?.addEventListener('abort', onAbort, { once: true })
        task(slot.api).then(resolve, reject)
      })
    } finally {
      if (onAbort) signal?.removeEventListener('abort', onAbort)
      this.release(slot)
    }
  }
}
