import { useEffect, useRef, useState } from 'react'
import { useFiles } from '../store/files'
import { Mascot } from './Mascot'

const ACCEPT = 'image/jpeg,image/png,image/webp,image/avif,application/pdf,.jpg,.jpeg,.png,.webp,.avif,.pdf'

export function DropZone({ compact }: { compact: boolean }) {
  const addFiles = useFiles((s) => s.addFiles)
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)

  // Pasting a screenshot anywhere on the page adds it.
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const files = [...(event.clipboardData?.files ?? [])]
      if (files.length) void addFiles(files)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [addFiles])

  const take = (list: FileList | null) => {
    if (list?.length) void addFiles([...list])
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        take(e.dataTransfer.files)
      }}
      className={`relative flex flex-col items-center gap-4 rounded-[2rem] border-[3px] border-dashed text-center transition-colors ${
        over ? 'border-jelly bg-mint/60 dark:bg-tint' : 'border-line bg-surface'
      } ${compact ? 'px-5 py-6 sm:flex-row sm:text-left' : 'px-6 py-12'}`}
    >
      <div className={`grid shrink-0 place-items-center rounded-[1.75rem] bg-mint ${compact ? 'size-16' : 'size-32'}`}>
        <Mascot
          mood={over ? 'pressing' : 'bob'}
          face={over ? 'squeezed' : 'happy'}
          className={compact ? 'size-12' : 'size-24'}
        />
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <p className={`font-display font-semibold ${compact ? 'text-lg' : 'text-2xl'}`}>
          {over ? 'Let go to squoosh!' : compact ? 'Add more files' : 'Drop your files here'}
        </p>
        <p className="text-muted">JPEG, PNG, WebP, AVIF and PDF. You can also paste images.</p>
      </div>
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="rounded-full bg-jelly px-6 py-3 font-display text-lg font-semibold text-ink shadow-[0_3px_0_var(--color-jelly-deep)] transition-transform hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
      >
        Choose files
      </button>
      <input
        ref={input}
        id="file-input"
        type="file"
        multiple
        accept={ACCEPT}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          take(e.target.files)
          e.target.value = ''
        }}
      />
    </div>
  )
}
