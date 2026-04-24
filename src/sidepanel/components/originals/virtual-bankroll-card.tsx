import { useEffect, useState } from 'react'
import { cn } from '../../../lib/utils'
import type { VirtualBankrollSnapshot } from '../../../lib/virtual-bankroll'
import type { VirtualBankrollState } from '../../../types'
import { cardClassName } from '../roulette/roulette-analytics'

export interface VirtualBankrollCardProps {
  bankroll: VirtualBankrollState
  snapshot: VirtualBankrollSnapshot
  onEnable: (seedBalance: number, baseBetAmount: number) => void
  onDisable: () => void
  onUpdateBaseBetAmount: (amount: number) => void
  onReplenish: (amount: number) => void
  onReset: () => void
  onPlaceBet: () => void
}

function formatEditableNumber(value: number): string {
  return String(value)
}

export function VirtualBankrollCard({
  bankroll,
  snapshot,
  onEnable,
  onDisable,
  onUpdateBaseBetAmount,
  onReplenish,
  onReset,
  onPlaceBet
}: VirtualBankrollCardProps) {
  const [seedInput, setSeedInput] = useState(() => formatEditableNumber(bankroll.seedBalance))
  const [betInput, setBetInput] = useState(() => formatEditableNumber(bankroll.baseBetAmount))
  const [replenishInput, setReplenishInput] = useState('100')
  const [showReplenishForm, setShowReplenishForm] = useState(false)

  useEffect(() => {
    setSeedInput(formatEditableNumber(bankroll.seedBalance))
  }, [bankroll.seedBalance])

  useEffect(() => {
    setBetInput(formatEditableNumber(bankroll.baseBetAmount))
  }, [bankroll.baseBetAmount])

  const handleEnable = () => {
    const parsedSeed = Number(seedInput)
    const parsedBet = Number(betInput)
    if (!Number.isFinite(parsedSeed) || parsedSeed < 0 || !Number.isFinite(parsedBet) || parsedBet <= 0) {
      return
    }
    onEnable(parsedSeed, parsedBet)
  }

  const handleReplenish = () => {
    const parsed = Number(replenishInput)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return
    }
    onReplenish(parsed)
    setReplenishInput('100')
    setShowReplenishForm(false)
  }

  const handleUpdateSeed = () => {
    const parsedSeed = Number(seedInput)
    if (!Number.isFinite(parsedSeed) || parsedSeed < 0) return
    onEnable(parsedSeed, bankroll.baseBetAmount)
  }

  const handleUpdateBaseBet = () => {
    const parsed = Number(betInput)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return
    }
    onUpdateBaseBetAmount(parsed)
  }

  const handleDoubleUp = (bet: number) => () => {
    const newBet = bet * 2
    setBetInput(formatEditableNumber(newBet))
    onUpdateBaseBetAmount(newBet)
  }
  const handleDoubleDown = (bet: number) => () => {
    const newBet = bet / 2
    setBetInput(formatEditableNumber(newBet))
    onUpdateBaseBetAmount(newBet)
  }

  return (
    <section className={cn('rounded-md text-white', cardClassName)}>
      {bankroll.enabled ? (
        <>
          <div className='grid grid-cols-2 bg-avocado/5 h-16'>
            <div className='relative rounded-xs rounded-e-none border border-r-0 border-white/10 bg-black/20'>
              <label
                htmlFor='virtual-bank'
                className='text-[0.62rem] uppercase tracking-wider text-avocado px-1 leading-4'>
                Bank
              </label>
              <div className='mt-3 flex'>
                <input
                  id='virtual-bank'
                  type='number'
                  min='0.01'
                  step='0.01'
                  value={seedInput}
                  onChange={(event) => setSeedInput(event.target.value)}
                  className='min-w-0 flex-1 h-8 rounded-px border-t border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-white/30'
                />
                <button
                  onClick={handleUpdateSeed}
                  className='absolute bottom-0.5 right-0.5 rounded-px px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15'>
                  Save
                </button>
              </div>
            </div>
            <div className='relative rounded-sm rounded-s-none border border-white/10 bg-black/20'>
              <label htmlFor='adjust-bet-amount' className='text-[0.62rem] uppercase tracking-wider text-avocado p-1'>
                Bet
              </label>
              <div className='mt-3 flex'>
                <input
                  id='adjust-bet-amount'
                  type='number'
                  min='0.01'
                  step='0.01'
                  value={betInput}
                  onChange={(event) => setBetInput(event.target.value)}
                  className='min-w-0 flex-1 h-8 rounded-px border-t border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-white/30'
                />

                <button
                  onClick={handleDoubleDown(+betInput)}
                  className='absolute bottom-0.5 right-20 rounded-px px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15'>
                  1/2
                </button>
                <button
                  onClick={handleDoubleUp(+betInput)}
                  className='absolute bottom-0.5 right-8 rounded-px px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15'>
                  2x
                </button>
                <button
                  onClick={onPlaceBet}
                  className='absolute bottom-0.5 right-0.5 rounded-px px-3 py-1.5 text-xs font-semibold text-avocado transition hover:bg-white/15'>
                  Bet
                </button>
              </div>
            </div>
          </div>

          <div className='hidden mt-4 rounded-xl border border-white/10 bg-black/20 p-4'>
            <div className='flex items-center justify-between gap-3'>
              <p className='text-[0.64rem] uppercase tracking-[0.26em] text-slate-400'>Replenish Balance</p>
              <button
                onClick={() => setShowReplenishForm((value) => !value)}
                className='rounded-[14px] border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 transition hover:bg-white/10'>
                {showReplenishForm ? 'Hide' : 'Add Funds'}
              </button>
            </div>

            {showReplenishForm ? (
              <div className='mt-3 flex gap-2'>
                <input
                  type='number'
                  min='0.01'
                  step='0.01'
                  value={replenishInput}
                  onChange={(event) => setReplenishInput(event.target.value)}
                  className='flex-1 h-8 rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-white/30'
                  placeholder='100'
                />
                <button
                  onClick={handleReplenish}
                  className='rounded-[18px] border border-sky-300/20 bg-sky-300/10 px-4 py-3 text-sm font-semibold text-sky-100 transition hover:bg-sky-300/15'>
                  Replenish
                </button>
              </div>
            ) : null}

            <div className='hidden _grid grid-cols-2 gap-2 mt-3'>
              <button
                onClick={onReset}
                className='rounded-[18px] border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/15'>
                Reset Session
              </button>
              <button
                onClick={onDisable}
                className='rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10'>
                Disable
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className='mt-4 rounded-xl border border-white/10 bg-black/20 p-4'>
          <p className='text-sm text-slate-300'>
            Start a paper bankroll and track balance changes from newly captured rounds only.
          </p>

          <div className='mt-4 flex gap-2'>
            <div className='grid flex-1 grid-cols-2 gap-2'>
              <input
                type='number'
                min='0'
                step='0.01'
                value={seedInput}
                onChange={(event) => setSeedInput(event.target.value)}
                className='rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-white/30'
                placeholder='Starting balance'
              />
              <input
                type='number'
                min='0.01'
                step='0.01'
                value={betInput}
                onChange={(event) => setBetInput(event.target.value)}
                className='rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-white/30'
                placeholder='Bet amount'
              />
            </div>
            <button
              onClick={handleEnable}
              className='rounded-[18px] border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15'>
              Enable
            </button>
          </div>

          <p className='mt-3 text-xs text-slate-400'>
            Set the starting balance and the base bet amount used when a tracked round has no usable stake value.
          </p>
        </div>
      )}
    </section>
  )
}
