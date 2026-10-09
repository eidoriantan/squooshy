import { create } from 'zustand'
import { detectFileKind } from '../lib/detect'
import { DEFAULT_SETTINGS } from '../lib/presets'
import type { AdvancedSettings, FileKind, Preset, Settings } from '../lib/types'

export type Status = 'queued' | 'working' | 'done' | 'error'

export interface Result {
  blob: Blob
  name: string
  format: FileKind
  url: string
  /** True when compressing didn't help, so the original is handed back. */
  keptOriginal: boolean
}

export interface Item {
  id: string
  file: File
  kind: FileKind
  originalUrl: string
  status: Status
  /** Bumped whenever the file needs (re)compressing; stale results are dropped. */
  run: number
  result?: Result
  error?: string
}

export interface Rejected {
  name: string
  reason: string
}

interface FilesState {
  items: Item[]
  rejected: Rejected[]
  settings: Settings
  addFiles(files: File[]): Promise<void>
  remove(id: string): void
  clear(): void
  retry(id: string): void
  dismissRejected(): void
  setPreset(preset: Preset): void
  setAdvanced(patch: Partial<AdvancedSettings>): void
  resetAdvanced(): void
  markWorking(id: string, run: number): void
  finish(id: string, run: number, result: Omit<Result, 'url'>): void
  fail(id: string, run: number, error: string): void
}

let nextId = 0

function revoke(item: Item) {
  URL.revokeObjectURL(item.originalUrl)
  if (item.result && item.result.url !== item.originalUrl) URL.revokeObjectURL(item.result.url)
}

/** Everything goes back in the queue, keeping the old result on screen until the new one lands. */
const requeueAll = (items: Item[]): Item[] =>
  items.map((item) => ({ ...item, status: 'queued', run: item.run + 1, error: undefined }))

export const useFiles = create<FilesState>((set, get) => ({
  items: [],
  rejected: [],
  settings: DEFAULT_SETTINGS,

  async addFiles(files) {
    const checked = await Promise.all(files.map(async (file) => ({ file, kind: await detectFileKind(file) })))
    const added: Item[] = []
    const rejected: Rejected[] = []
    for (const { file, kind } of checked) {
      if (!kind) {
        rejected.push({ name: file.name, reason: 'Squooshy handles JPEG, PNG, WebP, AVIF and PDF files.' })
        continue
      }
      added.push({
        id: `f${nextId++}`,
        file,
        kind,
        originalUrl: URL.createObjectURL(file),
        status: 'queued',
        run: 1,
      })
    }
    set((s) => ({ items: [...s.items, ...added], rejected: [...s.rejected, ...rejected] }))
  },

  remove(id) {
    const item = get().items.find((i) => i.id === id)
    if (item) revoke(item)
    set((s) => ({ items: s.items.filter((i) => i.id !== id) }))
  },

  clear() {
    get().items.forEach(revoke)
    set({ items: [], rejected: [] })
  },

  retry(id) {
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, status: 'queued', run: i.run + 1, error: undefined } : i)),
    }))
  },

  dismissRejected() {
    set({ rejected: [] })
  },

  setPreset(preset) {
    set((s) => ({ settings: { ...s.settings, preset }, items: requeueAll(s.items) }))
  },

  setAdvanced(patch) {
    set((s) => ({
      settings: { ...s.settings, advanced: { ...s.settings.advanced, ...patch } },
      items: requeueAll(s.items),
    }))
  },

  resetAdvanced() {
    set((s) => ({ settings: { ...s.settings, advanced: DEFAULT_SETTINGS.advanced }, items: requeueAll(s.items) }))
  },

  markWorking(id, run) {
    set((s) => ({ items: s.items.map((i) => (i.id === id && i.run === run ? { ...i, status: 'working' } : i)) }))
  },

  finish(id, run, result) {
    const item = get().items.find((i) => i.id === id)
    if (!item || item.run !== run) return
    if (item.result && item.result.url !== item.originalUrl) URL.revokeObjectURL(item.result.url)
    const url = result.keptOriginal ? item.originalUrl : URL.createObjectURL(result.blob)
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, status: 'done', result: { ...result, url } } : i)),
    }))
  },

  fail(id, run, error) {
    set((s) => ({
      items: s.items.map((i) => (i.id === id && i.run === run ? { ...i, status: 'error', error } : i)),
    }))
  },
}))
