import type { GameInsightTrack } from '../lib/gameInsights'

export function NumberTrack({ label, values, tone, highlightedValues }: GameInsightTrack) {
  const numberClass = tone === 'selected' ? 'keno text-white' : 'meno text-red-300'
  const highlightedSet = new Set(highlightedValues ?? [])

  return (
    <div>
      <p className='text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-slate-500'>{label}</p>
      <div className='mt-2 flex flex-wrap gap-1.5'>
        {values.map((value) => (
          <span
            key={`${label}-${value}`}
            className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-bold ${numberClass}`}
            style={
              highlightedSet.has(value)
                ? {
                    backgroundImage: 'url(./icons/gem.svg)',
                    backgroundColor: 'transparent',
                    color: '#18181b',
                    fontWeight: 'normal'
                  }
                : undefined
            }>
            {value + 1}
          </span>
        ))}
      </div>
    </div>
  )
}
