import { formatBytes } from '../lib/format'
import type { Progress } from '../lib/preload'
import { Mascot } from './Mascot'

interface LoadingScreenProps {
  phase: 'downloading' | 'warming' | 'error'
  progress: Progress
  error?: string
  onRetry(): void
}

export function LoadingScreen({ phase, progress, error, onRetry }: LoadingScreenProps) {
  const percent = progress.total > 0 ? Math.round((progress.loaded / progress.total) * 100) : 0
  const step =
    phase === 'warming'
      ? 'Warming up the engines…'
      : phase === 'error'
        ? 'Download stopped'
        : `Fetching ${progress.label}…`

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
        <div className="grid size-36 place-items-center rounded-[2.5rem] bg-mint shadow-sm">
          <Mascot mood={phase === 'error' ? 'idle' : 'pressing'} className="size-28" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold">Getting Squooshy ready</h1>
          <p className="text-muted">
            This happens once. Squooshy saves its engines on your device so it works offline from now on.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2" aria-live="polite">
          <div
            className="h-4 w-full overflow-hidden rounded-full bg-tint"
            role="progressbar"
            aria-label="Download progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={phase === 'warming' ? 100 : percent}
          >
            <div
              className="h-full rounded-full bg-jelly transition-[width] duration-200"
              style={{ width: `${phase === 'warming' ? 100 : percent}%` }}
            />
          </div>
          <div className="flex justify-between gap-4 text-sm text-muted tabular-nums">
            <span className="truncate">{step}</span>
            <span className="shrink-0">
              {formatBytes(progress.loaded)} / {formatBytes(progress.total)}
            </span>
          </div>
        </div>

        {phase === 'error' && (
          <div className="flex w-full flex-col items-center gap-3 rounded-2xl border border-line bg-surface p-4">
            <p className="text-bad">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="rounded-full bg-jelly px-5 py-2.5 font-display font-semibold text-ink hover:bg-jelly-deep hover:text-white"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
