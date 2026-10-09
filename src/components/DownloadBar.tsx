import { useState } from 'react'
import { formatBytes, savedPercent } from '../lib/format'
import { zipFiles } from '../lib/zip'
import { useFiles } from '../store/files'

function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export function DownloadBar() {
  const { items, clear } = useFiles()
  const [zipping, setZipping] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const done = items.filter((i) => i.status === 'done' && i.result)
  const pending = items.filter((i) => i.status === 'queued' || i.status === 'working').length
  const before = done.reduce((sum, i) => sum + i.file.size, 0)
  const after = done.reduce((sum, i) => sum + i.result!.blob.size, 0)

  const downloadAll = async () => {
    if (done.length === 1) return saveBlob(done[0].result!.blob, done[0].result!.name)
    setZipping(true)
    try {
      const blob = await zipFiles(done.map((i) => ({ name: i.result!.name, blob: i.result!.blob })))
      saveBlob(blob, 'squooshed.zip')
    } finally {
      setZipping(false)
    }
  }

  return (
    <div className="sticky bottom-0 z-10 -mx-4 border-t border-line bg-bg/90 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm tabular-nums" aria-live="polite">
          {done.length > 0 ? (
            <>
              <span className="font-semibold">
                Saved {formatBytes(Math.max(0, before - after))} ({savedPercent(before, after)}%)
              </span>
              <span className="text-muted">
                {' '}
                across {done.length} {done.length === 1 ? 'file' : 'files'}
                {pending > 0 && `, ${pending} still squooshing`}
              </span>
            </>
          ) : (
            <span className="text-muted">
              Squooshing {pending} {pending === 1 ? 'file' : 'files'}…
            </span>
          )}
        </p>
        <div className="flex items-center gap-2">
          {confirming ? (
            <>
              <span className="text-sm font-semibold">Remove all files?</span>
              <button
                type="button"
                onClick={() => {
                  clear()
                  setConfirming(false)
                }}
                className="rounded-full px-3 py-2 text-sm font-semibold text-bad hover:bg-tint"
              >
                Remove
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-full px-3 py-2 text-sm font-semibold hover:bg-tint"
              >
                Keep
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="rounded-full px-4 py-2 text-sm font-semibold text-muted hover:bg-tint hover:text-fg"
            >
              Clear all
            </button>
          )}
          <button
            type="button"
            onClick={downloadAll}
            disabled={done.length === 0 || zipping || pending > 0}
            className="rounded-full bg-ink px-5 py-2.5 font-display font-semibold text-white disabled:opacity-40 dark:bg-jelly dark:text-ink"
          >
            {zipping ? 'Zipping…' : `Download all${done.length > 1 ? ' (ZIP)' : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}
