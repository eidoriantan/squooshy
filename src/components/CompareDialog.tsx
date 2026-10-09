import { useEffect, useRef, useState } from 'react'
import { FORMAT_LABEL, formatBytes } from '../lib/format'
import type { Item } from '../store/files'

/** Before/after view: drag the handle (or use arrow keys) to reveal the original. */
export function CompareDialog({ item, onClose }: { item: Item | null; onClose(): void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [split, setSplit] = useState(50)

  useEffect(() => {
    const el = dialog.current
    if (!el) return
    if (item && !el.open) {
      setSplit(50)
      el.showModal()
    }
    if (!item && el.open) el.close()
  }, [item])

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onClick={(e) => e.target === dialog.current && onClose()}
      className="m-auto w-[min(64rem,calc(100vw-2rem))] rounded-3xl bg-surface p-0 text-fg backdrop:bg-ink/60 backdrop:backdrop-blur-sm"
      aria-labelledby="compare-title"
    >
      {item?.result && (
        <div className="flex flex-col gap-3 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 id="compare-title" className="min-w-0 truncate text-xl font-semibold">
              {item.result.name}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close comparison"
              className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-tint"
            >
              <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="relative overflow-hidden rounded-2xl has-focus-visible:outline-3 has-focus-visible:outline-jelly-deep bg-[repeating-conic-gradient(var(--color-tint)_0_25%,var(--color-surface)_0_50%)] bg-[length:20px_20px]">
            <img src={item.originalUrl} alt="Original" className="block max-h-[70dvh] w-full object-contain" />
            <img
              src={item.result.url}
              alt="Squooshed"
              className="absolute inset-0 block size-full object-contain"
              style={{ clipPath: `inset(0 0 0 ${split}%)` }}
            />
            <div
              className="pointer-events-none absolute inset-y-0 w-1 -translate-x-1/2 bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.2)]"
              style={{ left: `${split}%` }}
            >
              <div className="absolute top-1/2 left-1/2 grid size-9 -translate-1/2 place-items-center rounded-full bg-white text-ink shadow-md">
                <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
                  <path
                    d="M6 4L2 8l4 4M10 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
            <span className="absolute top-3 left-3 rounded-full bg-ink/75 px-2.5 py-1 text-xs font-bold text-white">
              Original · {formatBytes(item.file.size)}
            </span>
            <span className="absolute top-3 right-3 rounded-full bg-jelly px-2.5 py-1 text-xs font-bold text-ink">
              {FORMAT_LABEL[item.result.format]} · {formatBytes(item.result.blob.size)}
            </span>
            <input
              id="compare-split"
              type="range"
              min={0}
              max={100}
              step={0.5}
              value={split}
              onChange={(e) => setSplit(Number(e.target.value))}
              aria-label="Move the divider between original and squooshed"
              className="absolute inset-0 size-full cursor-ew-resize opacity-0"
            />
          </div>
        </div>
      )}
    </dialog>
  )
}
