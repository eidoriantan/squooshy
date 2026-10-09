import { useCallback, useEffect, useRef, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'
import App from './App.tsx'
import { LoadingScreen } from './components/LoadingScreen'
import type { UpdateState } from './components/UpdateBar'
import { warmUpEngines } from './lib/engines'
import { downloadEngines, planDownload, pruneEngines, type Progress } from './lib/preload'

type Phase = 'checking' | 'downloading' | 'warming' | 'ready' | 'error'

const errorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : 'Something went wrong while downloading. Check your connection and try again.'

export default function Root() {
  const [phase, setPhase] = useState<Phase>('checking')
  const [progress, setProgress] = useState<Progress>({ loaded: 0, total: 0, label: '' })
  const [error, setError] = useState<string>()
  const [update, setUpdate] = useState<UpdateState>({ phase: 'idle' })
  const applyUpdate = useRef<(reload?: boolean) => Promise<void>>(undefined)

  /** First visit: download every engine before showing the app. */
  const boot = useCallback(async () => {
    try {
      const plan = await planDownload()
      if (plan && plan.missing.length > 0) {
        setPhase('downloading')
        await downloadEngines(plan, setProgress)
        setPhase('warming')
        await warmUpEngines()
      } else {
        // Everything is cached (or this is the dev server): show the app now
        // and let the engines warm up behind it.
        void warmUpEngines()
      }
      if (plan) void pruneEngines(plan.manifest)
      setPhase('ready')
    } catch (e) {
      setError(errorMessage(e))
      setPhase('error')
    }
  }, [])

  /** A new deploy is waiting: fetch its engines, then offer a reload. */
  const prepareUpdate = useCallback(async () => {
    try {
      const plan = await planDownload(true)
      if (plan && plan.missing.length > 0) {
        setUpdate({ phase: 'downloading', progress: { loaded: 0, total: 0, label: '' } })
        await downloadEngines(plan, (p) => setUpdate({ phase: 'downloading', progress: p }))
      }
      setUpdate({ phase: 'ready' })
    } catch (e) {
      setUpdate({ phase: 'error', message: `The update couldn't download. ${errorMessage(e)}` })
    }
  }, [])

  useEffect(() => {
    // boot() only sets state after awaiting the cache check, so this is safe.
    // oxlint-disable-next-line react/set-state-in-effect
    void boot()
    if (import.meta.env.PROD) {
      applyUpdate.current = registerSW({ immediate: true, onNeedRefresh: () => void prepareUpdate() })
    }
  }, [boot, prepareUpdate])

  if (phase === 'checking') return null
  if (phase !== 'ready') {
    return (
      <LoadingScreen
        phase={phase}
        progress={progress}
        error={error}
        onRetry={() => {
          setPhase('checking')
          void boot()
        }}
      />
    )
  }
  return (
    <App update={update} onReload={() => void applyUpdate.current?.(true)} onRetryUpdate={() => void prepareUpdate()} />
  )
}
