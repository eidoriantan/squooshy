import { formatBytes } from '../lib/format'
import type { Progress } from '../lib/preload'

export type UpdateState =
  | { phase: 'idle' }
  | { phase: 'downloading'; progress: Progress }
  | { phase: 'ready' }
  | { phase: 'error'; message: string }

interface UpdateBarProps {
  state: UpdateState
  onReload(): void
  onRetry(): void
}

/** A slim banner while a new version's engines download in the background. */
export function UpdateBar({ state, onReload, onRetry }: UpdateBarProps) {
  if (state.phase === 'idle') return null
  const percent =
    state.phase === 'downloading' && state.progress.total > 0
      ? Math.round((state.progress.loaded / state.progress.total) * 100)
      : 100

  return (
    <div className="relative overflow-hidden rounded-2xl bg-ink text-white" role="status">
      {state.phase === 'downloading' && (
        <div
          className="absolute inset-y-0 left-0 bg-jelly/30 transition-[width]"
          style={{ width: `${percent}%` }}
          aria-hidden="true"
        />
      )}
      <div className="relative flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
        {state.phase === 'downloading' && (
          <span className="tabular-nums">
            Updating Squooshy… {formatBytes(state.progress.loaded)} of {formatBytes(state.progress.total)}
          </span>
        )}
        {state.phase === 'ready' && (
          <>
            <span>A new version of Squooshy is ready.</span>
            <button
              type="button"
              onClick={onReload}
              className="rounded-full bg-jelly px-4 py-1.5 font-semibold text-ink"
            >
              Reload
            </button>
          </>
        )}
        {state.phase === 'error' && (
          <>
            <span>{state.message}</span>
            <button type="button" onClick={onRetry} className="rounded-full bg-white/15 px-4 py-1.5 font-semibold">
              Try again
            </button>
          </>
        )}
      </div>
    </div>
  )
}
