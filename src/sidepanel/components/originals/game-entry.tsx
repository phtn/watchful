import { getSiteLabel } from '../../../core/siteConfig'
import { cn } from '../../../lib/utils'
import type { GameResult } from '../../../types'
import {
  formatAmount,
  formatDateTime,
  formatGameLabel,
  formatSignedAmount,
  formatTime,
  getNetTone,
  getResultClass,
  getSiteBadgeClass
} from '../../lib/formatters'
import { getGameInsights } from '../../lib/gameInsights'
import { cardClassName } from '../roulette/roulette-analytics'
import { NumberTrack } from './number-track'

interface GameEntryProps {
  game: GameResult
}

export function GameEntry({ game }: GameEntryProps) {
  const profit =
    game.profit ?? (game.payout !== undefined && game.amount !== undefined ? game.payout - game.amount : undefined)
  const { chips, tracks, risk } = getGameInsights(game)
  const roundLabel = game.roundId !== undefined ? `#${String(game.roundId).slice(0, 8)}` : null

  return (
    <article
      className={cn(
        'rounded-[18px] p-4 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.55)] text-white [content-visibility:auto]',
        cardClassName
      )}>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <div className='flex flex-wrap items-center gap-2'>
            <span
              className={`rounded-full border px-2.5 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.18em] ${getSiteBadgeClass(game.provider)}`}>
              {getSiteLabel(game.provider)}
            </span>
            <span className='rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-slate-300'>
              {formatGameLabel(game.game)}
            </span>
            {game.action !== 'bet' ? (
              <span className='rounded-full border border-violet-300/20 bg-violet-300/10 px-2.5 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-violet-100'>
                {formatGameLabel(game.action)}
              </span>
            ) : null}
            {risk ? (
              <span className='rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-amber-100'>
                {risk} risk
              </span>
            ) : null}
          </div>

          <h3 className='mt-3 text-lg font-semibold text-white'>{formatAmount(game.amount, game.currency)}</h3>

          <div className='mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-300'>
            <span>Payout {formatAmount(game.payout, game.currency)}</span>
            <span className={profit !== undefined ? getNetTone(profit) : 'text-slate-300'}>
              Net {formatSignedAmount(profit, game.currency)}
            </span>
            {game.userName ? <span>@{game.userName}</span> : null}
            {roundLabel ? <span>{roundLabel}</span> : null}
          </div>

          {chips.length > 0 ? (
            <div className='mt-3 flex flex-wrap gap-2'>
              {chips.map((chip) => (
                <span
                  key={chip}
                  className='rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-slate-300'>
                  {chip}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className='text-right'>
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.18em] ${getResultClass(game.result)}`}>
            {game.result}
          </span>
          <p className='mt-3 text-sm font-semibold text-white'>{formatTime(game.timestamp)}</p>
          <p className='mt-1 text-xs text-slate-400 font-display'>{formatDateTime(game.timestamp)}</p>
        </div>
      </div>

      {tracks.length > 0 ? (
        <div className='mt-4 rounded-[16px] border border-white/10 bg-black/20 p-3'>
          {tracks.map((track, index) => (
            <div key={`${track.label}-${index}`} className={index > 0 ? 'mt-3' : ''}>
              <NumberTrack {...track} />
            </div>
          ))}
        </div>
      ) : null}
    </article>
  )
}
