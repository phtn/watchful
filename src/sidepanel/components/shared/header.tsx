import { GameResult, PanelStatus, ResultSummary } from '../../../types'
import { formatTime } from '../../lib/formatters'
import { GameClassView } from './game-class-switcher'
import { HeroMetric } from './hero-metric'
import { JunctionBox } from './junction-box'

interface HeaderProps {
  status: PanelStatus
  stats: ResultSummary
  latestGame: GameResult | null
  gameClass: GameClassView
  onGameClassChange: VoidFunction
}

const GAME_CLASS_OPTIONS: Array<{
  value: GameClassView
  label: string
  detail: string
  badge: string
}> = [
  {
    value: 'originals',
    label: 'Originals',
    detail: 'Keno, Limbo, Dice, Mines',
    badge: 'Live Feed'
  },
  {
    value: 'roulette',
    label: 'Roulette',
    detail: 'Board, sectors, wheel memory',
    badge: 'Preview'
  },
  {
    value: 'tennis',
    label: 'Tennis',
    detail: 'Sports board, markets, odds',
    badge: 'Live Board'
  }
]
export const MainHeader = ({ status, stats, latestGame, onGameClassChange, gameClass }: HeaderProps) => {
  const currentGameClassLabel = GAME_CLASS_OPTIONS.find((option) => option.value === gameClass)?.label ?? gameClass

  return (
    <header className='relative overflow-hidden rounded-t-[14.01px] rounded-b-[14.01px] border-[0.5px] border-[#1f2020]/80 bg-[#1f2020] text-white shadow-[0_32px_90px_-38px_rgba(31,32,32,0.32)]'>
      <div className='absolute inset-x-[-15%] top-[-24%] h-48 rounded-full bg-[radial-gradient(circle,rgba(200, 204, 207,0.44),transparent_66%)] blur-2xl' />
      <div className='absolute bottom-[-28%] right-[-16%] h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.28),transparent_70%)] blur-2xl' />
      <div className='relative space-y-4 p-4'>
        <div className='flex items-start justify-between gap-2'>
          <div className='flex items-center gap-2'>
            <div className='p-0'>
              <img
                src={
                  status.site === 'stake'
                    ? 'https://res.cloudinary.com/dx0heqhhe/image/upload/v1774084897/S_gx5txy.svg'
                    : 'https://res.cloudinary.com/dx0heqhhe/image/upload/v1774084886/88_vo2l7g.svg'
                }
                alt='Watchful Wind'
                className='h-12 w-12 aspect-square'
              />
            </div>
            <div>
              <h1 className='font-circ mt-1 text-lg font-bold leading-4 drop-shadow-px drop-shadow-black text-white!'>
                Watchful Wind
              </h1>
            </div>
          </div>
          <div
            className={`flex items-center gap-2 rounded-full border px-1.5 py-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.22em] ${
              status.connected
                ? 'border-emerald-300/35 bg-emerald-300/10 text-emerald-100'
                : 'border-white/10 bg-white/6 text-slate-300'
            }`}>
            <span
              className={`h-2 w-2 aspect-square rounded-full ${
                true ? 'animate-[pulse_2.4s_ease-in-out_infinite] bg-emerald-300' : 'bg-slate-500'
              }`}
            />
            {true ? 'Live' : 'Idle'}
          </div>
        </div>

        <div className='grid grid-cols-3 gap-3'>
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
          <JunctionBox
            label='Game'
            value={currentGameClassLabel}
            action={
              <button onClick={onGameClassChange} className='text-xs text-slate-300'>
                <img
                  src={
                    gameClass === 'originals'
                      ? 'https://res.cloudinary.com/dx0heqhhe/image/upload/v1774086343/on_igt27r.svg'
                      : 'https://res.cloudinary.com/dx0heqhhe/image/upload/v1774088555/off_m12o0m.svg'
                  }
                  alt='switch'
                  className='h-6 w-6 aspect-square'
                />
              </button>
            }
          />
        </div>
      </div>
    </header>
  )
}
