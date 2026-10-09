import { useState } from 'react'
import { FORMAT_LABEL } from '../lib/format'
import { DEFAULT_ADVANCED, PRESETS } from '../lib/presets'
import type { OutputFormat, Preset } from '../lib/types'
import { useFiles } from '../store/files'

const PRESET_ORDER: Preset[] = ['light', 'balanced', 'max']
const FORMATS: OutputFormat[] = ['original', 'jpeg', 'png', 'webp', 'avif']

/** Squish levels drawn as a cube that gets flatter. */
function PresetGlyph({ preset }: { preset: Preset }) {
  const height = { light: 26, balanced: 19, max: 12 }[preset]
  return (
    <svg viewBox="0 0 40 32" className="h-7 w-9" aria-hidden="true">
      <rect
        x={20 - (36 - height) / 2 - 8}
        y={30 - height}
        width={16 + (36 - height)}
        height={height}
        rx="5"
        fill="currentColor"
      />
    </svg>
  )
}

export function Settings() {
  const { settings, setPreset, setAdvanced, resetAdvanced } = useFiles()
  const { advanced } = settings
  const customised = JSON.stringify(advanced) !== JSON.stringify(DEFAULT_ADVANCED)
  const [open, setOpen] = useState(customised)

  return (
    <section aria-labelledby="settings-heading" className="flex flex-col gap-3">
      <h2 id="settings-heading" className="sr-only">
        Compression settings
      </h2>
      <div role="radiogroup" aria-label="How much to squoosh" className="grid grid-cols-3 gap-2 sm:gap-3">
        {PRESET_ORDER.map((key) => {
          const spec = PRESETS[key]
          const active = settings.preset === key
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setPreset(key)}
              className={`flex flex-col items-start gap-1 rounded-2xl border-2 p-3 text-left transition-colors sm:p-4 ${
                active
                  ? 'border-jelly bg-mint text-ink dark:bg-tint dark:text-fg'
                  : 'border-line bg-surface hover:border-jelly/60'
              }`}
            >
              <span className={active ? 'text-jelly-deep dark:text-jelly' : 'text-muted'}>
                <PresetGlyph preset={key} />
              </span>
              <span className="font-display text-base font-semibold sm:text-lg">{spec.label}</span>
              <span className={`hidden text-sm sm:block ${active ? 'text-ink/75 dark:text-muted' : 'text-muted'}`}>
                {spec.blurb}
              </span>
            </button>
          )
        })}
      </div>

      <div className="rounded-2xl border border-line bg-surface">
        <button
          type="button"
          aria-expanded={open}
          aria-controls="advanced-panel"
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left font-semibold"
        >
          <span>
            Advanced settings
            {customised && (
              <span className="ml-2 rounded-full bg-coral/20 px-2 py-0.5 text-xs font-bold text-coral">Custom</span>
            )}
          </span>
          <svg
            viewBox="0 0 16 16"
            className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          >
            <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
        </button>

        <div id="advanced-panel" hidden={!open} className="border-t border-line px-4 pb-4 pt-3">
          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <fieldset className="flex flex-col gap-2 sm:col-span-2">
              <legend className="mb-2 text-sm font-semibold">Image format</legend>
              <div className="flex flex-wrap gap-2">
                {FORMATS.map((format) => (
                  <label
                    key={format}
                    className={`cursor-pointer rounded-full border-2 px-3.5 py-1.5 text-sm font-semibold has-focus-visible:outline-3 has-focus-visible:outline-jelly-deep ${
                      advanced.format === format
                        ? 'border-jelly bg-mint text-ink dark:bg-tint dark:text-fg'
                        : 'border-line hover:border-jelly/60'
                    }`}
                  >
                    <input
                      type="radio"
                      name="format"
                      id={`format-${format}`}
                      value={format}
                      checked={advanced.format === format}
                      onChange={() => setAdvanced({ format })}
                      className="sr-only"
                    />
                    {format === 'original' ? 'Keep original' : FORMAT_LABEL[format]}
                  </label>
                ))}
              </div>
              <p className="text-sm text-muted">Applies to images. PDFs stay PDFs.</p>
            </fieldset>

            <OptionalSlider
              id="quality"
              label="Image quality"
              hint="Higher looks better, lower is smaller. PNG ignores this."
              value={advanced.quality}
              fallback={75}
              min={1}
              max={100}
              format={(v) => `${v}`}
              onChange={(quality) => setAdvanced({ quality })}
            />

            <OptionalNumber
              id="max-side"
              label="Longest side"
              hint="Shrink big images to fit, in pixels."
              value={advanced.maxSide}
              placeholder={PRESETS[settings.preset].maxSide ? `${PRESETS[settings.preset].maxSide}` : 'No limit'}
              onChange={(maxSide) => setAdvanced({ maxSide })}
            />

            <OptionalSlider
              id="pdf-dpi"
              label="PDF image resolution"
              hint="Pictures inside PDFs are scaled to this many dots per inch."
              value={advanced.pdfDpi}
              fallback={150}
              min={72}
              max={300}
              step={6}
              format={(v) => `${v} dpi`}
              onChange={(pdfDpi) => setAdvanced({ pdfDpi })}
            />
          </div>

          {customised && (
            <button
              type="button"
              onClick={resetAdvanced}
              className="mt-4 text-sm font-semibold text-jelly-deep underline-offset-4 hover:underline dark:text-jelly"
            >
              Reset to preset
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

interface OptionalSliderProps {
  id: string
  label: string
  hint: string
  value: number | null
  fallback: number
  min: number
  max: number
  step?: number
  format(value: number): string
  onChange(value: number | null): void
}

/** A slider with an "Auto" switch. Auto means the preset decides. */
function OptionalSlider({
  id,
  label,
  hint,
  value,
  fallback,
  min,
  max,
  step = 1,
  format,
  onChange,
}: OptionalSliderProps) {
  const auto = value === null
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-semibold">
          {label}
        </label>
        <label className="flex items-center gap-1.5 text-sm text-muted">
          <input
            id={`${id}-auto`}
            type="checkbox"
            checked={auto}
            onChange={(e) => onChange(e.target.checked ? null : fallback)}
            className="accent-jelly-deep"
          />
          Auto
        </label>
      </div>
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value ?? fallback}
          disabled={auto}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-jelly-deep disabled:opacity-40"
        />
        <span className="w-16 shrink-0 text-right text-sm font-semibold tabular-nums">
          {auto ? 'Preset' : format(value)}
        </span>
      </div>
      <p className="text-sm text-muted">{hint}</p>
    </div>
  )
}

interface OptionalNumberProps {
  id: string
  label: string
  hint: string
  value: number | null
  placeholder: string
  onChange(value: number | null): void
}

function OptionalNumber({ id, label, hint, value, placeholder, onChange }: OptionalNumberProps) {
  // Typing "800" passes through "8", so only commit once the field is left.
  const [draft, setDraft] = useState(value === null ? '' : String(value))
  const [synced, setSynced] = useState(value)
  if (synced !== value) {
    setSynced(value)
    setDraft(value === null ? '' : String(value))
  }
  const commit = () => {
    const n = Math.round(Number(draft))
    const next = draft.trim() === '' || !Number.isFinite(n) || n < 16 ? null : Math.min(n, 16384)
    setDraft(next === null ? '' : String(next))
    if (next !== value) onChange(next)
  }
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={16}
          max={16384}
          placeholder={placeholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
          className="w-full rounded-xl border-2 border-line bg-bg px-3 py-2 tabular-nums focus:border-jelly focus:outline-none"
        />
        <span className="text-sm text-muted">px</span>
      </div>
      <p className="text-sm text-muted">{hint}</p>
    </div>
  )
}
