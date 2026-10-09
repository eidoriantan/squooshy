interface MascotProps {
  /** pressing: the press squashes the jelly in a loop. squish: one happy bounce. */
  mood?: 'idle' | 'pressing' | 'squish' | 'bob'
  face?: 'squeezed' | 'happy'
  className?: string
  title?: string
}

/** Jelly, the Squooshy mascot: a jelly cube under a press. */
export function Mascot({ mood = 'idle', face = 'squeezed', className, title }: MascotProps) {
  const body = mood === 'pressing' ? 'animate-press' : mood === 'squish' ? 'animate-squish' : ''
  const plate = mood === 'pressing' ? 'animate-plate' : ''
  return (
    <svg
      viewBox="0 0 100 100"
      className={`${mood === 'bob' ? 'animate-bob' : ''} ${className ?? ''}`}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <g className={`mascot-plate ${plate}`}>
        <rect x="45" y="6" width="10" height="18" rx="3" fill="#133238" />
        <rect x="18" y="22" width="64" height="10" rx="5" fill="#133238" />
      </g>
      <g className={`mascot-body ${body}`}>
        <path d="M14 46 Q14 34 26 34 L74 34 Q86 34 86 46 L88 76 Q88 88 76 88 L24 88 Q12 88 12 76Z" fill="#2EC4A6" />
        <path
          d="M20 44 Q20 40 26 40 L52 40"
          stroke="#fff"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          opacity=".6"
        />
        {face === 'squeezed' ? (
          <g stroke="#133238" strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M38 58 L44 62 L38 66" />
            <path d="M62 58 L56 62 L62 66" />
          </g>
        ) : (
          <g stroke="#133238" strokeWidth="3.4" fill="none" strokeLinecap="round">
            <path d="M36 63 Q40 57 44 63" />
            <path d="M56 63 Q60 57 64 63" />
          </g>
        )}
        <ellipse cx="28" cy="72" rx="6" ry="3.4" fill="#FF8A5C" opacity=".8" />
        <ellipse cx="72" cy="72" rx="6" ry="3.4" fill="#FF8A5C" opacity=".8" />
        <path d="M44 74 Q50 79 56 74" stroke="#133238" strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  )
}
