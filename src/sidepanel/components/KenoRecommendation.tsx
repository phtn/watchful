import { recommendKenoNumbers } from '../../lib/keno/scoring-weights'
import type { GameResult } from '../../types'

interface KenoRecommendationProps {
  results: GameResult[]
}

export function KenoRecommendation({ results }: KenoRecommendationProps) {
  const recommendation = recommendKenoNumbers(results, { poolSize: 10, historyLimit: 120 })
  const topScored = [...recommendation.scoredNumbers]
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score
      }

      return left.value - right.value
    })
    .slice(0, 5)

  return (
    <section className='rounded-[16.01px] border border-white/60 bg-white/76 p-4 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.35)] backdrop-blur-xl'>
      <div className='flex items-center justify-between gap-3'>
        <div>
          <p className='text-[0.64rem] uppercase tracking-[0.28em] text-slate-500'>Keno Lab</p>
          <h2 className='font-display mt-2 text-[1.55rem] leading-none text-slate-900'>Recommended Picks</h2>
        </div>
        <div className='rounded-full border border-amber-200/80 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700'>
          {recommendation.sampleSize} draws
        </div>
      </div>

      <p className='mt-3 text-sm text-slate-600'>
        Derived from recent captured Keno draws across providers. This is a historical heuristic, not a predictive edge.
      </p>

      <div className='mt-4 grid grid-cols-2 gap-3'>
        <div className='rounded-[20px] border border-slate-200/80 bg-slate-50/90 p-3'>
          <p className='text-[0.62rem] uppercase tracking-[0.22em] text-slate-500'>Expected Overlap</p>
          <p className='mt-2 text-lg font-semibold text-slate-900'>{recommendation.expectedOverlap.toFixed(2)}</p>
          <p className='mt-1 text-xs text-slate-500'>Average matches against the sampled draw history.</p>
        </div>

        <div className='rounded-[20px] border border-slate-200/80 bg-slate-50/90 p-3'>
          <p className='text-[0.62rem] uppercase tracking-[0.22em] text-slate-500'>Top Hot Numbers</p>
          <div className='mt-2 flex flex-wrap gap-1.5'>
            {topScored.map((number) => (
              <span
                key={number.value}
                className='inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700'>
                {number.value}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className='mt-4 rounded-[20px] border border-sky-200/70 bg-[linear-gradient(180deg,rgba(239,246,255,0.95),rgba(255,255,255,0.92))] p-4'>
        <p className='text-[0.62rem] uppercase tracking-[0.22em] text-sky-700'>Suggested 10-Number Card</p>
        <div className='mt-3 flex flex-wrap gap-2'>
          {recommendation.recommended.map((value) => (
            <span
              key={value}
              className='inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-sky-600 bg-white px-3 text-sm font-semibold text-sky-800 shadow-[0_10px_24px_-18px_rgba(14,165,233,0.55)]'>
              {value}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
