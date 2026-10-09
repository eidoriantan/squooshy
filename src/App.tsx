import { useEffect, useState } from 'react'
import { CompareDialog } from './components/CompareDialog'
import { DownloadBar } from './components/DownloadBar'
import { DropZone } from './components/DropZone'
import { FileCard } from './components/FileCard'
import { Header, LockIcon, REPO_URL } from './components/Header'
import { Settings } from './components/Settings'
import { UpdateBar, type UpdateState } from './components/UpdateBar'
import { startRunner } from './lib/runner'
import { useFiles, type Item } from './store/files'

interface AppProps {
  update: UpdateState
  onReload(): void
  onRetryUpdate(): void
}

export default function App({ update, onReload, onRetryUpdate }: AppProps) {
  const { items, rejected, dismissRejected } = useFiles()
  const [comparing, setComparing] = useState<Item | null>(null)

  useEffect(() => startRunner(), [])

  const hasFiles = items.length > 0

  return (
    <div className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-6 px-4 pt-5 sm:gap-8 sm:pt-8">
      <Header />
      <UpdateBar state={update} onReload={onReload} onRetry={onRetryUpdate} />

      <main className="flex flex-1 flex-col gap-6">
        {!hasFiles && (
          <div className="flex flex-col gap-3 pt-2 sm:pt-6">
            <h1 className="text-4xl leading-tight font-semibold sm:text-5xl">Squoosh your images and PDFs.</h1>
            <p className="max-w-[56ch] text-lg text-muted">
              Make files smaller right in your browser. Squooshy compresses everything on your own device, so nothing
              gets uploaded. It even works offline.
            </p>
          </div>
        )}

        <DropZone compact={hasFiles} />

        {rejected.length > 0 && (
          <div
            className="flex items-start justify-between gap-3 rounded-2xl border border-coral/50 bg-coral/10 p-4"
            role="alert"
          >
            <div className="text-sm">
              <p className="font-semibold">
                {rejected.length === 1
                  ? `${rejected[0].name} can't be squooshed.`
                  : `${rejected.length} files can't be squooshed.`}
              </p>
              <p className="text-muted">{rejected[0].reason}</p>
            </div>
            <button
              type="button"
              onClick={dismissRejected}
              className="rounded-full px-3 py-1 text-sm font-semibold hover:bg-tint"
            >
              OK
            </button>
          </div>
        )}

        <Settings />

        {hasFiles && (
          <section aria-labelledby="files-heading" className="flex flex-col gap-3">
            <h2 id="files-heading" className="text-xl font-semibold">
              Your files
            </h2>
            <ul className="flex flex-col gap-2.5">
              {items.map((item) => (
                <FileCard key={item.id} item={item} onCompare={setComparing} />
              ))}
            </ul>
          </section>
        )}
      </main>

      {hasFiles && <DownloadBar />}

      <footer className="flex flex-col gap-2 border-t border-line py-6 text-sm text-muted sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="flex items-center gap-1.5">
          <LockIcon />
          No uploads, no accounts, no tracking.
        </p>
        <p>
          © 2026{' '}
          <a
            className="font-semibold underline underline-offset-2 hover:text-fg"
            href="https://eidoriantan.com"
            target="_blank"
            rel="noreferrer"
          >
            @eidoriantan
          </a>
          . Open source under{' '}
          <a
            className="font-semibold underline underline-offset-2 hover:text-fg"
            href={`${REPO_URL}/blob/main/LICENSE`}
            target="_blank"
            rel="noreferrer"
          >
            AGPL-3.0
          </a>
          . Powered by Squoosh codecs and Ghostscript.
        </p>
      </footer>

      <CompareDialog item={comparing} onClose={() => setComparing(null)} />
    </div>
  )
}
