import { GameResult, PanelStatus, ResultSummary } from '../../types'
import { formatTime } from '../lib/formatters'
import { HeroMetric } from './HeroMetric'

interface HeaderProps {
  status: PanelStatus
  stats: ResultSummary
  latestGame: GameResult | null
}

export const MainHeader = ({ status, stats, latestGame }: HeaderProps) => {
  return (
    <header className='relative overflow-hidden rounded-t-[16.01px] rounded-b-[16.01px] border border-white/20 bg-[#09111f] text-white shadow-[0_32px_90px_-38px_rgba(15,23,42,0.78)]'>
      <div className='absolute inset-x-[-15%] top-[-24%] h-48 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.44),transparent_66%)] blur-2xl' />
      <div className='absolute bottom-[-28%] right-[-16%] h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.28),transparent_70%)] blur-2xl' />
      <div className='relative space-y-5 p-5'>
        <div className='flex items-start justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <div className='p-2'>
              <img
                src={
                  status.site === 'stake'
                    ? 'https://res.cloudinary.com/dx0heqhhe/image/upload/v1773987088/S_gx5txy.svg'
                    : 'https://res.cloudinary.com/dx0heqhhe/image/upload/v1773994828/88_vo2l7g.svg'
                }
                alt='Watchful Wind'
                className='h-12 w-12 p-1'
              />
            </div>
            <div>
              <p className='text-[7px] uppercase tracking-[0.34em] text-cyan-100/70 font-line'>Session Observatory</p>
              <h1 className='font-circ mt-2 text-lg font-bold leading-4 drop-shadow-px drop-shadow-black text-white!'>
                Watchful Wind
              </h1>
            </div>
          </div>
          <div
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.22em] ${
              status.connected
                ? 'border-emerald-300/35 bg-emerald-300/10 text-emerald-100'
                : 'border-white/10 bg-white/6 text-slate-300'
            }`}>
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                status.connected ? 'animate-[pulse_2.4s_ease-in-out_infinite] bg-emerald-300' : 'bg-slate-500'
              }`}
            />
            {status.connected ? 'Live' : 'Idle'}
          </div>
        </div>

        <div className='grid grid-cols-2 gap-3'>
          <HeroMetric
            label='Win Rate'
            value={`${stats.winRate.toFixed(1)}%`}
            detail={`${stats.wins} / ${stats.losses}`}
          />
          <HeroMetric
            label='Tracked Bets'
            value={stats.totalGames.toString()}
            detail={latestGame ? `Last ${formatTime(latestGame.timestamp)}` : 'No rounds yet'}
          />
        </div>
      </div>
    </header>
  )
}
