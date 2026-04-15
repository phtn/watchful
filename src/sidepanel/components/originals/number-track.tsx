import type { GameInsightTrack } from '../../lib/gameInsights'

export function NumberTrack({ label, values, tone, highlightedValues }: GameInsightTrack) {
  const numberClass =
    tone === 'selected'
      ? 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100'
      : 'border-rose-300/20 bg-rose-300/10 text-rose-100'
  const highlightedSet = new Set(highlightedValues ?? [])

  return (
    <div>
      <p className='text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-slate-400'>{label}</p>
      <div className='mt-2 flex flex-wrap gap-1.5'>
        {values.map((value) => (
          <span
            key={`${label}-${value}`}
            className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full border px-2 text-sm font-bold ${numberClass}`}
            style={
              highlightedSet.has(value)
                ? {
                    backgroundImage: 'url(./icons/gem.svg)',
                    backgroundColor: 'transparent',
                    color: '#e2e8f0',
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
