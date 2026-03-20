import { getSiteLabel } from '../../core/siteConfig'
import type { GameResult } from '../../types'
import {
  formatAmount,
  formatDateTime,
  formatGameLabel,
  formatSignedAmount,
  formatTime,
  getNetTone,
  getResultClass,
  getSiteBadgeClass
} from '../lib/formatters'
import { getGameInsights } from '../lib/gameInsights'
import { NumberTrack } from './NumberTrack'

interface GameEntryProps {
  game: GameResult
}

export function GameEntry({ game }: GameEntryProps) {
  const profit =
    game.profit ?? (game.payout !== undefined && game.amount !== undefined ? game.payout - game.amount : undefined)
  const { chips, tracks, risk } = getGameInsights(game)
  const roundLabel = game.roundId !== undefined ? `#${String(game.roundId).slice(0, 8)}` : null

  return (
    <article className='rounded-[26px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,248,251,0.92))] p-4 shadow-[0_18px_48px_-34px_rgba(15,23,42,0.36)] [content-visibility:auto]'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <div className='flex flex-wrap items-center gap-2'>
            <span
              className={`rounded-full border px-2.5 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.18em] ${getSiteBadgeClass(game.provider)}`}>
              {getSiteLabel(game.provider)}
            </span>
            <span className='rounded-full border border-slate-200/90 bg-slate-50 px-2.5 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-slate-600'>
              {formatGameLabel(game.game)}
            </span>
            {game.action !== 'bet' ? (
              <span className='rounded-full border border-violet-200/90 bg-violet-50 px-2.5 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-violet-700'>
                {formatGameLabel(game.action)}
              </span>
            ) : null}
            {risk ? (
              <span className='rounded-full border border-amber-200/90 bg-amber-50 px-2.5 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-amber-700'>
                {risk} risk
              </span>
            ) : null}
          </div>

          <h3 className='mt-3 text-lg font-semibold text-slate-900'>{formatAmount(game.amount, game.currency)}</h3>

          <div className='mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500'>
            <span>Payout {formatAmount(game.payout, game.currency)}</span>
            <span className={profit !== undefined ? getNetTone(profit) : 'text-slate-500'}>
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
                  className='rounded-full border border-slate-200/90 bg-white px-2.5 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-slate-600'>
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
          <p className='mt-3 text-sm font-semibold text-slate-700'>{formatTime(game.timestamp)}</p>
          <p className='mt-1 text-xs text-slate-400 font-display'>{formatDateTime(game.timestamp)}</p>
        </div>
      </div>

      {tracks.length > 0 ? (
        <div className='mt-4 rounded-[20px] border border-slate-100 bg-slate-50/90 p-3'>
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
