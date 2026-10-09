import { FORMAT_LABEL, formatBytes, savedPercent } from '../lib/format'
import { useFiles, type Item } from '../store/files'
import { Mascot } from './Mascot'

interface FileCardProps {
  item: Item
  onCompare(item: Item): void
}

function Thumbnail({ item }: { item: Item }) {
  if (item.kind === 'pdf') {
    return (
      <div className="grid size-full place-items-center bg-mint text-ink">
        <svg viewBox="0 0 40 48" className="h-10 w-9" aria-hidden="true">
          <path
            d="M4 2h22l10 10v32a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"
            fill="#fff"
            stroke="currentColor"
            strokeWidth="2.5"
          />
          <path d="M26 2v10h10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
          <text
            x="19"
            y="36"
            textAnchor="middle"
            fontSize="11"
            fontWeight="800"
            fill="currentColor"
            fontFamily="system-ui"
          >
            PDF
          </text>
        </svg>
      </div>
    )
  }
  return (
    <img
      src={item.result?.url ?? item.originalUrl}
      alt=""
      className="size-full object-cover"
      loading="lazy"
      decoding="async"
    />
  )
}

export function FileCard({ item, onCompare }: FileCardProps) {
  const { remove, retry } = useFiles()
  const { result, status } = item
  const before = item.file.size
  const after = result?.blob.size
  const percent = after === undefined ? 0 : savedPercent(before, after)
  const busy = status === 'queued' || status === 'working'

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface p-3 sm:flex-nowrap sm:gap-4">
      <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-tint sm:size-20">
        <Thumbnail item={item} />
        {busy && (
          <div className="absolute inset-0 grid place-items-center bg-mint/80">
            <Mascot mood="pressing" className="size-11" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate font-semibold" title={result?.name ?? item.file.name}>
          {result?.name ?? item.file.name}
        </p>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted tabular-nums">
          <span className="rounded-md bg-tint px-1.5 py-0.5 text-xs font-bold tracking-wide text-fg">
            {FORMAT_LABEL[item.kind]}
            {result && result.format !== item.kind && ` → ${FORMAT_LABEL[result.format]}`}
          </span>
          <span>{formatBytes(before)}</span>
          {after !== undefined && (
            <>
              <span aria-hidden="true">→</span>
              <span className="font-semibold text-fg">{formatBytes(after)}</span>
            </>
          )}
        </div>

        <p className="text-sm" aria-live="polite">
          {status === 'queued' && <span className="text-muted">Waiting for a free engine…</span>}
          {status === 'working' && <span className="text-muted">Squooshing…</span>}
          {status === 'error' && <span className="text-bad">{item.error}</span>}
          {status === 'done' && result?.keptOriginal && (
            <span className="font-semibold text-muted">Already squooshed! Kept the original.</span>
          )}
          {status === 'done' && result && !result.keptOriginal && (
            <span
              key={item.run}
              className={`inline-block font-semibold ${percent > 0 ? 'animate-squish text-good' : 'text-muted'}`}
            >
              {percent > 0
                ? `${percent}% smaller`
                : after! > before
                  ? `${formatBytes(after! - before)} bigger after converting`
                  : 'Same size'}
            </span>
          )}
        </p>
      </div>

      <div className="flex w-full items-center justify-end gap-1.5 border-t border-line pt-2 sm:w-auto sm:shrink-0 sm:border-0 sm:pt-0">
        {status === 'done' && result && item.kind !== 'pdf' && !result.keptOriginal && (
          <button
            type="button"
            onClick={() => onCompare(item)}
            className="rounded-full px-3 py-1.5 text-sm font-semibold text-muted hover:bg-tint hover:text-fg"
          >
            Compare
          </button>
        )}
        {status === 'error' && (
          <button
            type="button"
            onClick={() => retry(item.id)}
            className="rounded-full px-3 py-1.5 text-sm font-semibold hover:bg-tint"
          >
            Try again
          </button>
        )}
        {result && (
          <a
            href={result.url}
            download={result.name}
            className={`rounded-full bg-jelly px-4 py-1.5 text-center text-sm font-semibold text-ink hover:bg-jelly-deep hover:text-white ${busy ? 'pointer-events-none opacity-50' : ''}`}
            aria-disabled={busy}
          >
            Download
          </a>
        )}
        <button
          type="button"
          onClick={() => remove(item.id)}
          aria-label={`Remove ${item.file.name}`}
          className="grid size-8 place-items-center rounded-full text-muted hover:bg-tint hover:text-fg"
        >
          <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </li>
  )
}
