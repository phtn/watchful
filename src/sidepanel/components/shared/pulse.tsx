import { cn } from '../../../lib/utils'
import type { VirtualBankrollSnapshot } from '../../../lib/virtual-bankroll'
import { GameResult } from '../../../types'
import { formatAmount, formatGameLabel, formatSignedAmount, getNetTone } from '../../lib/formatters'
import { HeroMetric } from './hero-metric'

interface PulseProps {
  simulated: boolean
  requestUrlStatus: VoidFunction
  clearData: VoidFunction
  toggleSimulated: VoidFunction
  totalStaked: number
  netProfit: number
  snapshot: VirtualBankrollSnapshot
  latestGame: GameResult | undefined
  getNetTone: (profit: number) => string
}

export const Pulse = ({
  simulated,
  requestUrlStatus,
  clearData,
  toggleSimulated,
  totalStaked,
  netProfit,
  snapshot,
  latestGame
}: PulseProps) => {
  const bankValue = simulated ? formatAmount(snapshot.currentBalance) : '—'
  const netValue = simulated ? formatSignedAmount(snapshot.profitLoss) : formatSignedAmount(netProfit)
  const netClass = simulated ? getNetTone(snapshot.profitLoss) : getNetTone(netProfit)

  return (
    <section className='rounded-t-md border border-[#c208fc] border-b-0 bg-[#c208fc] p-2'>
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
            <h2 className='font-line font-medium text-base leading-none text-white uppercase tracking-widest'>Burst</h2>
          </div>
          <div className='grid grid-cols-3 gap-1'>
            <button
              onClick={toggleSimulated}
              className={cn('h-5 rounded-xs text-center text-sm font-semibold text-white', {
                'bg-white text-[#c208fc]': simulated
              })}>
              SIM
            </button>
            <button onClick={requestUrlStatus} className='h-5 rounded-xs text-center text-sm font-semibold text-white'>
              SCN
            </button>
            <button onClick={clearData} className='h-5 rounded-xs text-center text-sm font-semibold text-white'>
              CLR
            </button>
          </div>
        </div>
        <div className='grid grid-cols-4 gap-1 w-3/4'>
          <HeroMetric label='Bank' value={bankValue} className='text-zinc-100 bg-zinc-100/20 rounded-md' />
          <HeroMetric
            label='Staked'
            value={formatAmount(totalStaked)}
            className='text-zinc-100 bg-zinc-100/20 rounded-md'
          />
          <HeroMetric label='Net' value={netValue} className={cn('rounded-md bg-zinc-100/20', netClass)} />
          <HeroMetric
            label='Latest'
            value={latestGame ? formatGameLabel(latestGame.game) : 'None'}
            className='text-zinc-100 bg-zinc-100/20 rounded-md'
          />
        </div>
      </div>
    </section>
  )
}
