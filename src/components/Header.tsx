import { Mascot } from './Mascot'

export const REPO_URL = 'https://github.com/eidoriantan/squooshy'

export function Header() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <a href="/" className="flex items-center gap-2.5 rounded-xl" aria-label="Squooshy home">
        <span className="grid size-11 place-items-center rounded-2xl bg-mint">
          <Mascot className="size-9" />
        </span>
        <span className="font-display text-2xl font-bold tracking-tight">Squooshy</span>
      </a>
      <nav className="flex items-center gap-2 text-sm">
        <span className="hidden items-center gap-1.5 rounded-full bg-tint px-3 py-1.5 font-semibold sm:inline-flex">
          <LockIcon />
          Files never leave your device
        </span>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold text-muted hover:bg-tint hover:text-fg"
        >
          <GitHubIcon />
          Source
        </a>
      </nav>
    </header>
  )
}

export function LockIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4 text-jelly-deep" aria-hidden="true">
      <rect x="3" y="7" width="10" height="7" rx="2" fill="currentColor" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.6" fill="none" />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}
