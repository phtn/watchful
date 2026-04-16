import { recommendKenoNumbers } from '../../../lib/keno/scoring-weights'
import { cn } from '../../../lib/utils'
import type { GameResult } from '../../../types'
import { cardClassName } from '../roulette/roulette-analytics'

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
    <section
      className={cn(
        'rounded-[18px] p-4 text-white shadow-[0_24px_70px_-36px_rgba(15,23,42,0.55)] backdrop-blur-xl',
        cardClassName
      )}>
      <div className='flex items-center justify-between gap-3'>
        <div>
          <p className='text-[0.64rem] uppercase tracking-[0.28em] text-cyan-100/70'>Keno Lab</p>
          <h2 className='font-display mt-2 text-[1.55rem] leading-none text-white'>Recommended Picks</h2>
        </div>
        <div className='rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-100'>
          {recommendation.sampleSize} draws
        </div>
      </div>

      <p className='mt-3 text-sm text-slate-300'>
        Derived from recent captured Keno draws across providers. This is a historical heuristic, not a predictive edge.
      </p>

      <div className='mt-4 grid grid-cols-2 gap-3'>
        <div className='rounded-[16px] border border-white/10 bg-black/20 p-3'>
          <p className='text-[0.62rem] uppercase tracking-[0.22em] text-slate-400'>Expected Overlap</p>
          <p className='mt-2 text-lg font-semibold text-white'>{recommendation.expectedOverlap.toFixed(2)}</p>
          <p className='mt-1 text-xs text-slate-400'>Average matches against the sampled draw history.</p>
        </div>

        <div className='rounded-[16px] border border-white/10 bg-black/20 p-3'>
          <p className='text-[0.62rem] uppercase tracking-[0.22em] text-slate-400'>Top Hot Numbers</p>
          <div className='mt-2 flex flex-wrap gap-1.5'>
            {topScored.map((number) => (
              <span
                key={number.value}
                className='inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-200'>
                {number.value}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className='mt-4 rounded-[16px] border border-sky-300/20 bg-[linear-gradient(180deg,rgba(2,6,23,0.92),rgba(15,23,42,0.88))] p-4'>
        <p className='text-[0.62rem] uppercase tracking-[0.22em] text-sky-100/70'>Suggested 10-Number Card</p>
        <div className='mt-3 flex flex-wrap gap-2'>
          {recommendation.recommended.map((value) => (
            <span
              key={value}
              className='inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-sky-300/20 bg-sky-300/10 px-3 text-sm font-semibold text-sky-100 shadow-[0_10px_24px_-18px_rgba(14,165,233,0.55)]'>
              {value}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
