import { useEffect, useMemo, useState } from 'react'
import type { VirtualBankrollSnapshot } from '../../../lib/virtual-bankroll'
import type { VirtualBankrollState } from '../../../types'
import { cn } from '../../../lib/utils'
import { formatAmount, formatDateTime, formatSignedAmount, getNetTone } from '../../lib/formatters'
import { CompactMetric, Metric } from '../shared/hero-metric'
import { cardClassName } from '../roulette/roulette-analytics'

interface VirtualBankrollCardProps {
  bankroll: VirtualBankrollState
  snapshot: VirtualBankrollSnapshot
  onEnable: (seedBalance: number, baseBetAmount: number) => void
  onDisable: () => void
  onUpdateBaseBetAmount: (amount: number) => void
  onReplenish: (amount: number) => void
  onReset: () => void
}

function formatEditableNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : String(value)
}

export function VirtualBankrollCard({
  bankroll,
  snapshot,
  onEnable,
  onDisable,
  onUpdateBaseBetAmount,
  onReplenish,
  onReset
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

  const handleUpdateBaseBet = () => {
    const parsed = Number(betInput)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return
    }

    onUpdateBaseBetAmount(parsed)
  }

  const fields = useMemo(
    () =>
      [
        {
          id: 'vb',
          label: 'Virtual',
          value: formatAmount(bankroll.seedBalance)
        },
        {
          id: 'pnl',
          label: 'P / L',
          value: formatSignedAmount(snapshot.profitLoss)
        },
        {
          id: 'bet',
          label: 'Bet',
          value: formatAmount(snapshot.baseBetAmount)
        }
      ] as (Metric & { id: string })[],
    [bankroll]
  )

  return (
    <section className={cn('rounded-[18px] px-2 py-2 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.55)] text-white backdrop-blur-xl', cardClassName)}>
      <CompactMetric data={fields} />
      {bankroll.enabled ? (
        <>
          <div className='hidden _grid grid-cols-2 mt-4 gap-3'>
            <div className='rounded-[16px] border border-white/10 bg-black/20 p-3'>
              <p className='text-[0.62rem] uppercase tracking-[0.22em] text-slate-400'>Current Balance</p>
              <p className='mt-2 text-xl font-semibold text-white'>{formatAmount(snapshot.currentBalance)}</p>
              <p className='mt-1 text-xs text-slate-400'>Seed {formatAmount(bankroll.seedBalance)}</p>
            </div>
            <div className='rounded-[16px] border border-white/10 bg-black/20 p-3'>
              <p className='text-[0.62rem] uppercase tracking-[0.22em] text-slate-400'>Profit / Loss</p>
              <p className={`mt-2 text-xl font-semibold ${getNetTone(snapshot.profitLoss)}`}>
                {formatSignedAmount(snapshot.profitLoss)}
              </p>
              <p className='mt-1 text-xs text-slate-400'>{snapshot.trackedGames} tracked rounds</p>
            </div>
          </div>

          <div className='hidden _grid grid-cols-2 gap-3 mt-3'>
            {/*<div className='rounded-[20px] border border-slate-200/80 bg-slate-50/90 p-3'>
              <p className='text-[0.62rem] uppercase tracking-[0.22em] text-slate-500'>Replenished</p>
              <p className='mt-2 text-lg font-semibold text-slate-900'>{formatAmount(snapshot.totalReplenished)}</p>
            </div>*/}
            {/*<div className='rounded-[20px] border border-slate-200/80 bg-slate-50/90 p-3'>
              <p className='text-[0.62rem] uppercase tracking-[0.22em] text-slate-500'>Base Bet</p>
              <p className='mt-2 text-lg font-semibold text-slate-900'>{formatAmount(snapshot.baseBetAmount)}</p>
            </div>*/}
          </div>

          <div className='grid grid-cols-2 gap-3 mt-3'>
            <div className='rounded-[16px] border border-white/10 bg-black/20 p-3'>
              <p className='text-[0.62rem] uppercase tracking-[0.22em] text-slate-400'>Tracking Since</p>
              <p className='mt-2 text-sm font-semibold text-white'>
                {snapshot.trackingStartedAt ? formatDateTime(snapshot.trackingStartedAt) : 'Not started'}
              </p>
            </div>
            <div className='rounded-[16px] border border-white/10 bg-black/20 p-3'>
              <p className='text-[0.62rem] uppercase tracking-[0.22em] text-slate-400'>Adjust Bet Amount</p>
              <div className='mt-2 flex gap-2'>
                <input
                  type='number'
                  min='0.01'
                  step='0.01'
                  value={betInput}
                  onChange={(event) => setBetInput(event.target.value)}
                  className='min-w-0 flex-1 rounded-[14px] border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-white/30'
                />
                <button
                  onClick={handleUpdateBaseBet}
                  className='rounded-[14px] border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15'>
                  Save
                </button>
              </div>
            </div>
          </div>

          <div className='hidden mt-4 rounded-[16px] border border-white/10 bg-black/20 p-4'>
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
                  className='flex-1 rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-white/30'
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
        <div className='mt-4 rounded-[16px] border border-white/10 bg-black/20 p-4'>
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
