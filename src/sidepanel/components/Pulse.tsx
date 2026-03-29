import { GameResult } from '../../types'
import { formatAmount, formatGameLabel, formatSignedAmount } from '../lib/formatters'
import { HeroMetric } from './HeroMetric'

interface PulseProps {
  requestUrlStatus: VoidFunction
  clearData: VoidFunction
  totalStaked: number
  netProfit: number
  latestGame: GameResult | null
  getNetTone: (profit: number) => string
}
export const Pulse = ({ requestUrlStatus, clearData, totalStaked, netProfit, latestGame, getNetTone }: PulseProps) => {
  return (
    <section className='rounded-t-[12.01px] border border-neutral-300 border-b-0 bg-orange-200 p-2 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.35)] backdrop-blur-xl'>
      <div className='flex items-center justify-between gap-4'>
        <div className='flex h-full flex-col justify-end flex-1 space-y-1'>
          <div className='flex items-center space-x-2'>
            <button
              onClick={requestUrlStatus}
              className='rounded-md border border-slate-200/80 bg-white flex items-center justify-center size-8 aspect-square font-semibold uppercase tracking-[0.22em] text-slate-700 transition hover:border-slate-300 hover:text-slate-950'>
              R
            </button>
            <h2 className='font-line font-medium text-lg leading-none text-slate-700 uppercase tracking-widest'>
              pulse
            </h2>
          </div>
          <div className='grid grid-cols-2 gap-2'>
            <button
              onClick={requestUrlStatus}
              className='rounded-md border border-sky-700/70 bg-sky-50 h-8 text-center text-sm font-semibold text-sky-800 transition hover:border-sky-300 hover:bg-sky-100'>
              SCN
            </button>
            <button
              onClick={clearData}
              className='rounded-md border border-rose-400/70 bg-rose-50 h-8 text-center text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100'>
              CLR
            </button>
          </div>
        </div>
        <div className='grid grid-cols-3 gap-2 text-zinc-600 w-2/3'>
          <HeroMetric label='Staked' value={formatAmount(totalStaked)} className={`bg-zinc-600 rounded-[11px]`} />
          <HeroMetric label='Net' value={formatSignedAmount(netProfit)} className={`bg-zinc-700 rounded-[11px]`} />
          <HeroMetric
            label='Latest'
            value={latestGame ? formatGameLabel(latestGame.game) : 'None'}
            className={`bg-zinc-800 rounded-[11px]`}
          />
        </div>
      </div>
    </section>
  )
}
