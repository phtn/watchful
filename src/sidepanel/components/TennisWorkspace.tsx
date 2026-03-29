import type { PanelStatus } from '../../types'
import type { TennisEvent, TennisOutcome, TennisStoredData } from '../../types/tennis'
import { formatDateTime } from '../lib/formatters'

interface TennisWorkspaceProps {
  status: PanelStatus
  stats: TennisStoredData
  onReset: () => void
}

function getOutcomeLabel(outcome: TennisOutcome, event: TennisEvent): string {
  if (outcome.label === '1') {
    return event.players[0]?.name ?? outcome.label
  }

  if (outcome.label === '2') {
    return event.players[1]?.name ?? outcome.label
  }

  return outcome.label
}

function getMarketAccent(index: number): string {
  const accents = [
    'border-cyan-300/20 bg-cyan-300/8',
    'border-emerald-300/20 bg-emerald-300/8',
    'border-amber-300/20 bg-amber-300/8',
    'border-fuchsia-300/20 bg-fuchsia-300/8'
  ]

  return accents[index % accents.length]
}

function TennisEventCard({ event }: { event: TennisEvent }) {
  const heroMarket = event.markets.find((market) => /winner/i.test(market.name)) ?? event.markets[0]
  const visibleMarkets = event.markets.slice(0, 6)

  return (
    <article className='overflow-hidden rounded-[18px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03)),linear-gradient(180deg,rgba(12,19,32,0.94),rgba(6,10,18,0.96))] shadow-[0_24px_70px_-36px_rgba(15,23,42,0.55)]'>
      <div className='grid gap-3 p-4 xl:grid-cols-[0.88fr_1.12fr]'>
        <div className='rounded-[16px] border border-white/10 bg-white/[0.04] p-4 text-white'>
          <div className='flex items-start justify-between gap-3'>
            <div>
              <p className='font-line text-[0.62rem] uppercase tracking-[0.28em] text-cyan-100/70'>{event.tour}</p>
              <h3 className='mt-2 text-lg font-semibold leading-tight text-white'>{event.tournament}</h3>
            </div>
            <div className='rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-slate-200'>
              {event.statusLabel || 'Scheduled'}
            </div>
          </div>

          <div className='mt-4 space-y-2.5'>
            {event.players.map((player, index) => (
              <div
                key={`${event.id}-player-${player.name}`}
                className={`flex items-center justify-between rounded-[14px] border px-3 py-2 ${
                  index === 0 ? 'border-emerald-300/20 bg-emerald-300/8' : 'border-slate-200/10 bg-white/5'
                }`}>
                <div className='flex items-center gap-3'>
                  {player.flagUrl ? (
                    <img src={player.flagUrl} alt='' className='h-6 w-6 rounded-full border border-white/10 object-cover' />
                  ) : (
                    <div className='h-6 w-6 rounded-full border border-white/10 bg-white/10' />
                  )}
                  <div>
                    <p className='text-sm font-semibold text-white'>{player.name}</p>
                    <p className='text-[0.62rem] uppercase tracking-[0.2em] text-slate-400'>Player {index + 1}</p>
                  </div>
                </div>

                {heroMarket?.outcomes[index] ? (
                  <div className='rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs font-semibold text-cyan-100'>
                    {heroMarket.outcomes[index].oddsText}
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className='mt-4 flex items-center justify-between gap-3 rounded-[14px] border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-300'>
            <span>{event.markets.length} markets synced</span>
            <span>{formatDateTime(event.timestamp)}</span>
          </div>
        </div>

        <div className='overflow-x-auto pb-1'>
          <div className='flex min-w-max gap-2'>
            {visibleMarkets.map((market, index) => (
              <section
                key={`${event.id}-${market.name}`}
                className={`w-[190px] shrink-0 rounded-[16px] border p-3 text-white ${getMarketAccent(index)}`}>
                <p className='text-[0.65rem] uppercase tracking-[0.18em] text-slate-300'>{market.name}</p>
                <div className='mt-3 space-y-2'>
                  {market.outcomes.map((outcome) => (
                    <div
                      key={`${market.name}-${outcome.label}`}
                      className='rounded-[12px] border border-white/10 bg-black/20 px-3 py-2.5'>
                      <p className='text-xs text-slate-300'>{getOutcomeLabel(outcome, event)}</p>
                      <p className='mt-1 text-base font-semibold text-white'>{outcome.oddsText}</p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
            {event.markets.length > visibleMarkets.length ? (
              <section className='flex w-[150px] shrink-0 items-center justify-center rounded-[16px] border border-dashed border-white/12 bg-white/[0.03] p-3 text-center text-slate-300'>
                <div>
                  <p className='font-line text-[0.62rem] uppercase tracking-[0.24em]'>More Markets</p>
                  <p className='mt-2 text-xl font-semibold text-white'>+{event.markets.length - visibleMarkets.length}</p>
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  )
}

export function TennisWorkspace({ status, stats, onReset }: TennisWorkspaceProps) {
  const liveEvents = stats.events.slice(0, 10)

  return (
    <div className='space-y-2 pb-6'>
      <section className='relative overflow-hidden rounded-[18px] border border-white/12 bg-[#08111f] p-5 text-white shadow-[0_32px_90px_-38px_rgba(15,23,42,0.78)]'>
        <div className='absolute inset-x-[-15%] top-[-28%] h-48 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.34),transparent_68%)] blur-2xl' />
        <div className='absolute bottom-[-25%] right-[-12%] h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.26),transparent_68%)] blur-2xl' />
        <div className='relative'>
          <div className='flex items-start justify-between gap-4'>
            <div>
              <p className='font-line text-[0.62rem] uppercase tracking-[0.3em] text-cyan-100/70'>Sportsbook Board</p>
              <h2 className='font-circ mt-3 text-[1.65rem] leading-none text-white'>Tennis Ledger</h2>
              <p className='mt-3 max-w-xl text-sm text-slate-300'>
                Live event cards scraped from the tennis board. The board keeps the latest snapshot of players, markets,
                and prices without mixing them into roulette or originals history.
              </p>
            </div>
            <button
              type='button'
              onClick={onReset}
              className='rounded-full border border-white/10 bg-white/8 px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 transition hover:border-white/20 hover:text-white'>
              Reset Board
            </button>
          </div>

          <div className='mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
            <div className='rounded-[16px] border border-white/10 bg-white/[0.05] px-4 py-3'>
              <p className='text-[0.62rem] uppercase tracking-[0.24em] text-cyan-100/65'>Matches</p>
              <p className='mt-2 text-xl font-semibold text-white'>{stats.totalEvents}</p>
            </div>
            <div className='rounded-[16px] border border-white/10 bg-white/[0.05] px-4 py-3'>
              <p className='text-[0.62rem] uppercase tracking-[0.24em] text-cyan-100/65'>Markets</p>
              <p className='mt-2 text-xl font-semibold text-white'>{stats.totalMarkets}</p>
            </div>
            <div className='rounded-[16px] border border-white/10 bg-white/[0.05] px-4 py-3'>
              <p className='text-[0.62rem] uppercase tracking-[0.24em] text-cyan-100/65'>Tournaments</p>
              <p className='mt-2 text-xl font-semibold text-white'>{stats.tournamentCount}</p>
            </div>
            <div className='rounded-[16px] border border-white/10 bg-white/[0.05] px-4 py-3'>
              <p className='text-[0.62rem] uppercase tracking-[0.24em] text-cyan-100/65'>Capture</p>
              <p className='mt-2 text-sm font-semibold text-white'>
                {stats.latestTimestamp ? formatDateTime(stats.latestTimestamp) : 'Awaiting board'}
              </p>
              <p className='mt-1 text-[0.7rem] text-slate-400'>
                {status.site === 'stake' ? 'Stake surface linked' : 'Open a Stake tennis board'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {liveEvents.length > 0 ? (
        <div className='space-y-2'>
          {liveEvents.map((event) => (
            <TennisEventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <section className='rounded-[18px] border border-dashed border-white/12 bg-[#08111f] px-5 py-12 text-center text-white'>
          <p className='font-display text-[1.35rem] text-white'>No tennis board captured yet</p>
          <p className='mt-3 text-sm text-slate-300'>
            Open Stake Sports on a tennis page or a board that contains tennis cards. Once the DOM loads, this page will
            mirror the current matches and prices.
          </p>
        </section>
      )}
    </div>
  )
}
