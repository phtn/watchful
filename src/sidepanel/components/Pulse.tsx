import { cn } from '../../lib/utils'
import { GameResult } from '../../types'
import { formatAmount, formatGameLabel, formatSignedAmount } from '../lib/formatters'
import { HeroMetric } from './HeroMetric'

interface PulseProps {
  simulated: boolean
  requestUrlStatus: VoidFunction
  clearData: VoidFunction
  toggleSimulated: VoidFunction
  totalStaked: number
  netProfit: number
  latestGame: GameResult | null
  getNetTone: (profit: number) => string
}
export const Pulse = ({
  simulated,
  requestUrlStatus,
  clearData,
  toggleSimulated,
  totalStaked,
  netProfit,
  latestGame,
  getNetTone
}: PulseProps) => {
  return (
    <section className='rounded-t-[12.01px] border border-slate-100 border-b-0 bg-slate-100/80 px-2 py-1 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.35)] backdrop-blur-xl'>
      <div className='flex items-center justify-between gap-2'>
        <div className='flex h-full flex-col justify-end flex-1 space-y-1'>
          <div className='flex items-center space-x-2'>
            <button
              onClick={requestUrlStatus}
              className={cn(
                'rounded-full bg-blue-500 text-white flex items-center justify-center size-6 aspect-square font-semibold uppercase active:scale-94 transition-transform duration-200'
              )}>
              R
            </button>
            <h2 className='font-line font-medium text-lg leading-none text-slate-700 uppercase tracking-widest'>
              pulse
            </h2>
          </div>
          <div className='grid grid-cols-3 gap-2'>
            <button
              onClick={toggleSimulated}
              className={cn(
                'h-6 rounded-md border border-emerald-700/70 bg-emerald-50 text-center text-sm font-semibold text-emerald-800 hover:text-emerald-800 transition hover:border-emerald-800 hover:bg-emerald-100',
                { 'bg-emerald-800 text-white': simulated }
              )}>
              SIM
            </button>
            <button
              onClick={requestUrlStatus}
              className='h-6 rounded-md border border-sky-700/70 bg-sky-50 text-center text-sm font-semibold text-sky-800 hover:text-sky-800 transition hover:border-sky-800 hover:bg-sky-100'>
              SCN
            </button>
            <button
              onClick={clearData}
              className='h-6 rounded-md border border-rose-400/70 bg-rose-50 text-center text-sm font-semibold text-rose-800 hover:text-rose-800 transition hover:border-rose-800 hover:bg-rose-100'>
              CLR
            </button>
          </div>
        </div>
        <div className='grid grid-cols-4 gap-2 text-zinc-600 w-3/4'>
          <HeroMetric label='Bank' value={formatAmount(totalStaked)} className={`bg-zinc-600 rounded-[11px]`} />
          <HeroMetric label='Staked' value={formatAmount(totalStaked)} className={`bg-zinc-700 rounded-[11px]`} />
          <HeroMetric label='Net' value={formatSignedAmount(netProfit)} className={`bg-zinc-800 rounded-[11px]`} />
          <HeroMetric
            label='Latest'
            value={latestGame ? formatGameLabel(latestGame.game) : 'None'}
            className={`bg-zinc-900 rounded-[11px]`}
          />
        </div>
      </div>
    </section>
  )
}
