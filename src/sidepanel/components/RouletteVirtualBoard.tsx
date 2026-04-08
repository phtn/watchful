import { PropsWithChildren, useEffect, useMemo, useRef, useState } from 'react'
import {
  BOARD_ROWS,
  KIMS_ALGO_QUADRANTS,
  createKimAlgoBetPlan,
  getKimQuadrantsContainingNumber,
  getKimQuadrantsContainingPair,
  resolveKimAutoStartingQuadrant,
  resolveKimQuadrantPreference,
  simulateKimsAlgo,
  type KimQuadrantId,
  type KimSpreadSelectionMode
} from '../../lib/roulette'
import { getNumberTone } from '../../lib/roulette/utils'
import { cn } from '../../lib/utils'
import type { PanelStatus } from '../../types'
import { cardClassName } from './RouletteAnalytics'

interface RouletteVirtualBoardProps {
  status: PanelStatus
  winningNumbers: readonly number[]
}

function formatQuadrantLabel(quadrant: KimQuadrantId): string {
  return quadrant.toUpperCase()
}

function getSourceStatus(status: PanelStatus): string {
  if (!status.connected || !status.site) {
    return 'Offline snapshot'
  }

  return `${status.site === 'stake' ? 'Stake' : 'bet88.ph'} live`
}

function getPlacementMap(values: readonly number[]): Map<number, number> {
  const placements = new Map<number, number>()

  for (const value of values) {
    placements.set(value, (placements.get(value) ?? 0) + 1)
  }

  return placements
}

function formatSessionOutcome(value: 'continue' | 'reset_after_win' | 'reset_after_max_loss'): string {
  return value.split('_').join(' ')
}

function getEffectiveStakeMultiplier(unitStake: number, baseUnit: number, placementCount: number): number {
  const roundMultiplier = baseUnit > 0 ? Math.max(1, Math.round(unitStake / baseUnit)) : 1
  return roundMultiplier * placementCount
}

function fmtAmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}

function getHotNumbers(values: readonly number[], limit: number = 6): number[] {
  const counts = new Map<number, { count: number; lastSeenIndex: number }>()

  values.forEach((value, index) => {
    if (value === 0) {
      return
    }

    const current = counts.get(value)
    counts.set(value, {
      count: (current?.count ?? 0) + 1,
      lastSeenIndex: index
    })
  })

  return [...counts.entries()]
    .sort((left, right) => {
      if (left[1].count !== right[1].count) {
        return right[1].count - left[1].count
      }

      if (left[1].lastSeenIndex !== right[1].lastSeenIndex) {
        return right[1].lastSeenIndex - left[1].lastSeenIndex
      }

      return left[0] - right[0]
    })
    .slice(0, limit)
    .map(([number]) => number)
}

function StepTone({ value }: { value: string }) {
  return (
    <span className='rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[0.62rem] uppercase tracking-[0.16em]'>
      {value}
    </span>
  )
}

export function RouletteVirtualBoard({ status, winningNumbers }: RouletteVirtualBoardProps) {
  const [startingQuadrant, setStartingQuadrant] = useState<KimQuadrantId>('q1')
  const [hoveredQuadrant, setHoveredQuadrant] = useState<KimQuadrantId | null>(null)
  const [baseUnitInput, setBaseUnitInput] = useState('1')
  const [isTracking, setIsTracking] = useState(false)
  const [allowOverlaps, setAllowOverlaps] = useState(false)
  const [spreadSelectionMode, setSpreadSelectionMode] = useState<KimSpreadSelectionMode>('within')
  const [trackedWinningNumbers, setTrackedWinningNumbers] = useState<number[]>([])
  const [lastConsumedIndex, setLastConsumedIndex] = useState(winningNumbers.length)
  const [winStreak, setWinStreak] = useState(0)
  const [accWinnings, setAccWinnings] = useState(0)
  const [lastWinProfit, setLastWinProfit] = useState<number | null>(null)
  const [lockedBankValue, setLockedBankValue] = useState<number | null>(null)
  const [inputMode, setInputMode] = useState<'base' | 'bank'>('base')
  const processedStepCountRef = useRef(0)

  const parsedInput = Number.parseFloat(baseUnitInput)
  const baseUnit =
    Number.isFinite(parsedInput) && parsedInput > 0 ? (inputMode === 'bank' ? parsedInput / 288 : parsedInput) : 1
  const hotNumberSource = isTracking ? trackedWinningNumbers : winningNumbers
  const hotNumbers = useMemo(() => getHotNumbers(hotNumberSource), [hotNumberSource])
  const selectedStartingQuadrantNumbers = useMemo(
    () => new Set(KIMS_ALGO_QUADRANTS[startingQuadrant]),
    [startingQuadrant]
  )
  const hoveredQuadrantNumbers = useMemo(
    () => new Set(hoveredQuadrant ? KIMS_ALGO_QUADRANTS[hoveredQuadrant] : []),
    [hoveredQuadrant]
  )
  const autoStartingQuadrant = useMemo(
    () => (!isTracking ? resolveKimAutoStartingQuadrant(winningNumbers, hotNumbers, startingQuadrant) : null),
    [hotNumbers, isTracking, startingQuadrant, winningNumbers]
  )

  useEffect(() => {
    if (!isTracking && autoStartingQuadrant && autoStartingQuadrant !== startingQuadrant) {
      setStartingQuadrant(autoStartingQuadrant)
    }
  }, [autoStartingQuadrant, isTracking, startingQuadrant])

  const simulation = simulateKimsAlgo(trackedWinningNumbers, {
    startingQuadrant,
    baseUnit,
    allowOverlaps,
    spreadSelectionMode,
    hotNumbers
  })
  const latestStep = simulation.steps[simulation.steps.length - 1] ?? null
  const nextBet = createKimAlgoBetPlan(simulation.finalState.nextRound, simulation.finalState.nextQuadrants, baseUnit, {
    allowOverlaps,
    spreadSelectionMode,
    hotNumbers
  })
  const roundMultiplier = getEffectiveStakeMultiplier(nextBet.unitStake, baseUnit, 1)
  const placementMap = getPlacementMap(nextBet.numbers)
  const latestWinningNumber = trackedWinningNumbers[trackedWinningNumbers.length - 1] ?? null
  const hitCount = simulation.steps.filter((step) => step.hit).length
  const lastResetIndex = simulation.steps.reduce(
    (last, step, idx) => (step.sessionOutcome !== 'continue' ? idx : last),
    -1
  )
  const totalStaked =
    simulation.steps.slice(lastResetIndex + 1).reduce((sum, step) => sum + step.bet.totalStake, 0) + nextBet.totalStake
  const recentSteps = simulation.steps.slice(-6).reverse()
  const accPct = lockedBankValue && lockedBankValue > 0 ? (accWinnings / lockedBankValue) * 100 : 0

  // Signal: 2 consecutive numbers share a quadrant — only meaningful when not armed
  const signalQuadrants = useMemo(() => {
    if (isTracking || winningNumbers.length < 2) return []
    const last = winningNumbers[winningNumbers.length - 1]
    const prev = winningNumbers[winningNumbers.length - 2]
    return getKimQuadrantsContainingPair(prev, last)
  }, [isTracking, winningNumbers])
  const signalFound = signalQuadrants.length > 0

  // Hot rank map: number → rank (1 = hottest), only top 4
  const hotRankMap = useMemo(() => {
    const map = new Map<number, number>()
    hotNumbers.slice(0, 4).forEach((n, i) => map.set(n, i + 1))
    return map
  }, [hotNumbers])

  useEffect(() => {
    if (winningNumbers.length < lastConsumedIndex) {
      setTrackedWinningNumbers([])
      setLastConsumedIndex(winningNumbers.length)
      return
    }

    if (!isTracking || winningNumbers.length === lastConsumedIndex) {
      return
    }

    setTrackedWinningNumbers((current) => [...current, ...winningNumbers.slice(lastConsumedIndex)])
    setLastConsumedIndex(winningNumbers.length)
  }, [isTracking, lastConsumedIndex, winningNumbers])

  // Persistent win streak + accumulated winnings — survive arm/disarm cycles
  useEffect(() => {
    const currentCount = simulation.steps.length
    if (currentCount === 0) {
      processedStepCountRef.current = 0
      return
    }
    const newSteps = simulation.steps.slice(processedStepCountRef.current)
    processedStepCountRef.current = currentCount
    if (newSteps.length === 0) return

    let streakDelta = 0
    let streakReset = false
    let winningsGained = 0
    let latestProfit: number | null = null

    for (const step of newSteps) {
      if (step.hitType === 'miss') {
        if (step.sessionOutcome === 'reset_after_max_loss') streakReset = true
      } else {
        streakDelta += 1
        const profit = 36 * step.bet.unitStake - step.bet.totalStake
        winningsGained += profit
        latestProfit = profit
      }
    }

    setWinStreak((prev) => (streakReset ? 0 : prev + streakDelta))
    if (winningsGained !== 0) setAccWinnings((prev) => prev + winningsGained)
    if (latestProfit !== null) setLastWinProfit(latestProfit)
  }, [simulation.steps])

  // Auto-disarm on win or zero without a hedge (rounds 1–3)
  useEffect(() => {
    if (!isTracking) return
    const latestStep = simulation.steps[simulation.steps.length - 1]
    if (!latestStep) return
    if (
      latestStep.sessionOutcome === 'reset_after_win' ||
      (latestStep.landedNumber === 0 && latestStep.bet.zeroStake === 0)
    ) {
      setIsTracking(false)
    }
  }, [simulation.steps, isTracking])

  const handleTrackingToggle = () => {
    if (isTracking) {
      setIsTracking(false)
      return
    }

    if (autoStartingQuadrant) {
      setStartingQuadrant(autoStartingQuadrant)
    }

    setTrackedWinningNumbers([])
    setLastConsumedIndex(winningNumbers.length)
    setLockedBankValue(baseUnit * 288)
    setIsTracking(true)
  }
  const winAmount = useMemo(() => 36 * nextBet.unitStake, [nextBet.unitStake])
  // border border-white/12 bg-[linear-gradient(180deg,rgba(8,15,29,0.96),rgba(11,19,35,0.92))]
  return (
    <section
      className={cn(
        'overflow-hidden rounded-lg text-white shadow-[0_28px_90px_-42px_rgba(15,23,42,0.82)]',
        cardClassName
      )}>
      <div className='flex items-start justify-between p-4 gap-2'>
        <div className='space-y-1'>
          <p className='text-[0.62rem] uppercase tracking-[0.32em] text-emerald-100/70'>
            KIM VR &middot; {getSourceStatus(status)}
          </p>
          {lastWinProfit !== null && (
            <p className='font-semibold text-lg italic uppercase text-emerald-100'>
              <span className='-tracking-widest'>Snatched</span>{' '}
              <span className='font-bold text-amber-300'>+{fmtAmt(lastWinProfit)}</span>
            </p>
          )}
        </div>
        <div className='flex flex-col items-end gap-2'>
          <div className='flex flex-wrap justify-end gap-2'>
            {signalFound && !isTracking && (
              <span className='flex items-center gap-1.5 rounded-md border border-amber-300/40 bg-amber-300/10 px-2 py-1 text-xs font-medium uppercase tracking-wide text-amber-200'>
                <span className='relative flex h-1.5 w-1.5'>
                  <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75' />
                  <span className='relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400' />
                </span>
                {signalQuadrants.map((q) => q.toUpperCase()).join('/')}
              </span>
            )}
            <button
              type='button'
              onClick={() => setAllowOverlaps((current) => !current)}
              className={cn(
                'rounded-md border px-2 py-1 text-xs font-medium uppercase tracking-widest',
                allowOverlaps
                  ? 'border-amber-300/35 bg-amber-300/12 text-amber-100'
                  : 'border-cyan-300/35 bg-cyan-300/12 text-cyan-100'
              )}>
              {allowOverlaps ? 'Overlap' : 'Spread'}
            </button>
            <button
              type='button'
              onClick={() => setSpreadSelectionMode((current) => (current === 'within' ? 'across' : 'within'))}
              disabled={allowOverlaps}
              className={cn(
                'rounded-md border px-2 py-1 text-xs font-medium uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-45',
                spreadSelectionMode === 'within'
                  ? 'border-emerald-300/35 bg-emerald-300/12 text-emerald-100'
                  : 'border-fuchsia-300/35 bg-fuchsia-300/12 text-fuchsia-100'
              )}>
              {spreadSelectionMode === 'within' ? 'Within' : 'Across'}
            </button>
            <button
              type='button'
              onClick={handleTrackingToggle}
              className={cn(
                'rounded-md min-w-24 border px-2 py-1 text-xs uppercase tracking-widest transition-colors drop-shadow-xs',
                isTracking
                  ? 'border-rose-100 bg-rose-500 text-white'
                  : 'border-rose-800/80 bg-rose-100/70 text-rose-800'
              )}>
              <span className=' font-extrabold'>{isTracking ? 'Armed' : 'Arm'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className='grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]'>
        <div className='rounded-lg border border-neutral-300/30 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0)),linear-gradient(180deg,rgba(31,35,41,0.96),rgba(12,14,19,0.9))] p-3'>
          <div className='flex items-end justify-between gap-3'>
            <div>
              <div id='acc-value' className='font-bold italic'>
                {accWinnings > 0 ? `+${fmtAmt(accWinnings)}` : fmtAmt(accWinnings)}
              </div>
              <p id='acc-pct' className='mt-1 text-[0.62rem] uppercase tracking-[0.22em] text-indigo-300'>
                {accPct.toFixed(2)}%
              </p>
            </div>
            {/*===BOARD===*/}
            <div className='text-right text-xs text-slate-400'>
              <p className='text-[0.62rem] uppercase tracking-[0.32em] text-emerald-100/70'>
                Last: {latestWinningNumber ?? 'None yet'}
              </p>
              <p className='mt-1 text-[0.6rem] uppercase tracking-[0.32em] text-emerald-100/50'>
                Hot: {hotNumbers.length > 0 ? hotNumbers.join(' · ') : 'warming up'}
              </p>
            </div>
          </div>

          <div className='mt-4 grid grid-cols-[42px_1fr] gap-3'>
            <div
              className={cn(
                'relative flex items-center justify-center rounded-2xl border text-lg font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]',
                getNumberTone(0),
                nextBet.zeroStake > 0 && 'ring-2 ring-emerald-300/75 ring-offset-2 ring-offset-slate-950',
                latestWinningNumber === 0 && 'border-amber-300 shadow-[0_0_0_1px_rgba(252,211,77,0.55)]'
              )}>
              0
              {nextBet.zeroStake > 0 ? (
                <>
                  <span className='absolute bottom-1 rounded-full bg-emerald-300 px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-[0.14em] text-slate-950'>
                    Z
                  </span>
                  {roundMultiplier > 1 ? (
                    <span className='absolute -right-1.5 -top-1.5 rounded-full bg-amber-300 px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-[0.12em] text-slate-950'>
                      {roundMultiplier}
                    </span>
                  ) : null}
                </>
              ) : null}
            </div>

            <div className='space-y-2'>
              {BOARD_ROWS.map((row) => (
                <div key={row.join('-')} className='grid grid-cols-12 gap-1 space-y-1'>
                  {row.map((value) => {
                    const placementCount = placementMap.get(value) ?? 0
                    const effectiveMultiplier = getEffectiveStakeMultiplier(nextBet.unitStake, baseUnit, placementCount)
                    const isActive = placementCount > 0
                    const isLatest = latestWinningNumber === value
                    const interactiveQuadrant = resolveKimQuadrantPreference(
                      getKimQuadrantsContainingNumber(value),
                      hotNumbers,
                      startingQuadrant
                    )
                    const isStartingQuadrantTrigger = interactiveQuadrant !== null
                    const isSelectedStartingQuadrant = selectedStartingQuadrantNumbers.has(value)
                    const isHoveredQuadrantMember = hoveredQuadrantNumbers.has(value)

                    const hotRank = hotRankMap.get(value)

                    return (
                      <button
                        key={value}
                        type='button'
                        onClick={() => {
                          if (interactiveQuadrant) {
                            setStartingQuadrant(interactiveQuadrant)
                          }
                        }}
                        onMouseEnter={() => {
                          if (interactiveQuadrant) {
                            setHoveredQuadrant(interactiveQuadrant)
                          }
                        }}
                        onMouseLeave={() => setHoveredQuadrant(null)}
                        onFocus={() => {
                          if (interactiveQuadrant) {
                            setHoveredQuadrant(interactiveQuadrant)
                          }
                        }}
                        onBlur={() => setHoveredQuadrant(null)}
                        disabled={!interactiveQuadrant}
                        title={
                          interactiveQuadrant
                            ? `${formatQuadrantLabel(interactiveQuadrant)} · set start quadrant`
                            : undefined
                        }
                        className={cn(
                          'relative flex h-10 w-auto aspect-square items-center justify-center rounded-xl border text-sm font-semibold _shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-all disabled:cursor-default',
                          getNumberTone(value),
                          isActive && 'ring-2 ring-emerald-300/75 ring-offset-1 ring-offset-slate-950',
                          isActive && hotRank && nextBet.round >= 4 && 'animate-pulse',
                          isLatest && 'border-amber-300 shadow-[0_0_0_1px_rgba(252,211,77,0.55)]',
                          isHoveredQuadrantMember && 'ring-2 ring-white/70 ring-offset-1 ring-offset-slate-950',
                          isStartingQuadrantTrigger && 'cursor-pointer hover:border-white',
                          isSelectedStartingQuadrant && 'border-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.22)]'
                        )}>
                        <span className='text-base font-semibold drop-shadow-xs'>{value}</span>
                        {isActive && effectiveMultiplier > 1 ? (
                          <span
                            className={cn(
                              'absolute -right-1.5 -top-1.5 rounded-full bg-amber-300 px-1 py-0.5 text-[8px] font-bold uppercase -tracking-widest text-slate-950',
                              {
                                'bg-indigo-400 text-white': effectiveMultiplier === 4,
                                'bg-fuchsia-300': effectiveMultiplier === 8
                              }
                            )}>
                            <span className='scale-75'>{effectiveMultiplier}</span>
                          </span>
                        ) : null}
                        {hotRank ? (
                          <span
                            className={cn(
                              'absolute -bottom-px -left-px flex h-3 w-3 items-center justify-center rounded-xs rounded-bl-lg text-[7px] font-bold shadow-sm',
                              hotRank === 1 && 'bg-amber-400 text-amber-900',
                              hotRank === 2 && 'bg-zinc-300 text-zinc-700',
                              hotRank === 3 && 'bg-orange-600 text-orange-100',
                              hotRank === 4 && 'bg-violet-500 text-white'
                            )}>
                            {hotRank}
                          </span>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className='mt-3 text-xs text-slate-400'>
            {/*Hover a quadrant corner pocket to preview all four numbers, or click it to set the starting quadrant.*/}
            {!isTracking && autoStartingQuadrant ? (
              <span className='block mt-1 text-slate-500'>
                Auto idle start: {formatQuadrantLabel(autoStartingQuadrant)} from the latest shared pair.
              </span>
            ) : null}
          </div>
          <div className='mt-4 grid gap-2 grid-cols-4'>
            <Stat>
              <p className='text-[0.62rem] uppercase tracking-[0.2em] text-slate-400'>round</p>
              <p className='mt-2 text-lg font-semibold text-white'>{nextBet.round}</p>
            </Stat>
            <Stat>
              <p className='text-[0.62rem] uppercase tracking-[0.2em] text-slate-400'>W-streak</p>
              <p className='mt-2 text-lg font-semibold text-white'>{winStreak}</p>
            </Stat>
            <Stat>
              <p className='text-[0.62rem] uppercase tracking-[0.2em] text-slate-400'>
                spins&middot;({winningNumbers.length})
              </p>
              <p className='mt-2 text-lg font-semibold text-white'>{simulation.steps.length}</p>
            </Stat>
            <Stat>
              <div className='flex items-center justify-between gap-1'>
                <span className='text-[0.62rem] uppercase tracking-[0.2em] text-slate-400'>
                  {inputMode === 'base' ? 'slut' : `unit = ${baseUnit.toFixed(2)}`}
                </span>
                <button
                  type='button'
                  onClick={() => setInputMode((m) => (m === 'base' ? 'bank' : 'base'))}
                  className={cn(
                    'rounded px-1.5 py-px text-[8px] font-medium uppercase tracking-wide transition-colors',
                    inputMode === 'base' ? 'bg-slate-700 text-slate-300' : 'bg-indigo-500/30 text-indigo-200'
                  )}>
                  {inputMode === 'base' ? 'base' : 'bank'}
                </button>
              </div>
              <input
                type='number'
                min='1'
                step='1'
                value={baseUnitInput}
                onChange={(event) => setBaseUnitInput(event.target.value)}
                className='mt-1 w-full rounded-sm bg-slate-950/70 px-3 py-1 text-sm text-white outline-none'
              />
            </Stat>
          </div>

          <div className='grid grid-cols-5 mt-2 gap-2'>
            <Stat>
              <p className='text-[0.62rem] uppercase tracking-[0.2em] text-slate-400'>Next</p>
              <p className='mt-2 text-lg font-semibold text-white'>{fmtAmt(nextBet.totalStake)}</p>

              <p className='hidden mt-1 text-xs text-slate-400'>
                Unit {nextBet.unitStake} · x{roundMultiplier}
                {nextBet.zeroStake > 0 ? ` • Zero ${nextBet.zeroStake}` : ''}
              </p>
              <p className='hidden mt-1 text-xs text-slate-500'>
                {allowOverlaps ? 'Overlap stack active' : `Spread ${nextBet.spreadSelectionMode} hot-pick mode`}
              </p>
            </Stat>
            <Stat>
              <p className='text-[0.62rem] uppercase tracking-[0.2em] text-slate-400'>Staked</p>
              <p className='mt-2 text-lg font-semibold text-white'>{fmtAmt(totalStaked)}</p>
            </Stat>
            <Stat>
              <p className='text-[0.62rem] uppercase tracking-[0.2em] text-slate-400'>
                Take &middot; <span className='tracking-normal text-emerald-400 font-semibold'>{winAmount}</span>
              </p>
              <p className='mt-2 text-lg font-semibold text-yellow-300'>{fmtAmt(winAmount - totalStaked)}</p>
            </Stat>
            <Stat>
              <p className='text-[0.62rem] uppercase tracking-[0.2em] text-slate-400'>PCT</p>
              <p className='mt-2 text-lg font-semibold text-indigo-300'>
                {(((winAmount - totalStaked) / (baseUnit * 288)) * 100).toFixed(2)}
                <span className='text-[7px]'>%</span>
              </p>
            </Stat>
            <Stat>
              <p className='text-[0.62rem] uppercase tracking-[0.2em] text-slate-400'>
                cvg &middot; ({nextBet.coverageCount})
              </p>
              <p className='mt-2 text-lg font-semibold text-white'>
                {nextBet.coveragePercent.toFixed(2)}
                <span className='text-[7px]'>%</span>
              </p>
            </Stat>
          </div>
        </div>
        {/*<div className='space-y-3'>
          <div className='rounded-[20px] border border-white/10 bg-white/5 p-3'>
            <p className='text-[0.62rem] uppercase tracking-[0.22em] text-slate-500'>State machine</p>
            <div className='mt-3 flex flex-wrap gap-2'>
              {nextBet.quadrants.map((quadrant) => (
                <span
                  key={`active-quadrant-${quadrant}`}
                  className='rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-100'>
                  {formatQuadrantLabel(quadrant)}
                </span>
              ))}
            </div>
            <div className='mt-3 text-sm text-slate-300'>
              {latestStep ? (
                <>
                  <div>
                    Last step: landed <span className='font-semibold text-white'>{latestStep.landedNumber}</span> on
                    round <span className='font-semibold text-white'>R{latestStep.bet.round}</span> and ended as{' '}
                    <span className='font-semibold text-white'>{formatSessionOutcome(latestStep.sessionOutcome)}</span>.
                  </div>
                  <div className='mt-2'>
                    Next trigger quadrant is{' '}
                    <span className='font-semibold text-white'>{formatQuadrantLabel(nextBet.quadrant)}</span>.
                  </div>
                  {!allowOverlaps && nextBet.spreadQuadrants.length > 0 ? (
                    <div className='mt-2'>
                      Spread replacement active on{' '}
                      <span className='font-semibold text-white'>
                        {nextBet.spreadQuadrants.map(formatQuadrantLabel).join(', ')}
                      </span>
                      .
                    </div>
                  ) : null}
                </>
              ) : (
                <div>
                  {isTracking
                    ? 'Awaiting live roulette numbers. The board is staged from the configured starting quadrant.'
                    : 'Simulation is standing by. The board is staged, but no logged spins are being consumed until you arm it.'}
                </div>
              )}
            </div>
          </div
          <div className='rounded-[20px] border border-white/10 bg-white/5 p-3'>
            <div className='flex items-end justify-between gap-3'>
              <div>
                <p className='text-[0.62rem] uppercase tracking-[0.22em] text-slate-500'>Replay log</p>
                <h4 className='mt-2 text-sm font-semibold text-white'>Recent simulated steps</h4>
              </div>
              <p className='text-xs text-slate-500'>{recentSteps.length > 0 ? 'Latest 6 steps' : 'No steps yet'}</p>
            </div>
          </div>
        </div>*/}
      </div>
    </section>
  )
}

const Stat = ({ children }: PropsWithChildren) => {
  return <div className='rounded-sm border border-white/15 bg-white/8 backdrop-blur-md p-1.25'>{children}</div>
}

/*
<div className='mt-3 flex flex-wrap gap-2 text-[0.66rem] uppercase tracking-[0.16em] text-slate-300'>
            <StepTone value='Emerald ring = next active bet' />
            <StepTone value='Amber outline = latest winning number' />
            <StepTone value='badge = effective unit multiple' />
            <StepTone
              value={
                allowOverlaps ? 'overlap mode = stacked straight-ups allowed' : 'spread guard = no stacked overlaps'
              }
            />
            {!allowOverlaps && nextBet.spreadQuadrants.length > 0 ? (
              <StepTone value={`spread applied on ${nextBet.spreadQuadrants.map(formatQuadrantLabel).join(' + ')}`} />
            ) : null}
            {nextBet.zeroStake > 0 ? <StepTone value='Zero hedge armed' /> : null}
          </div>

          <div className='mt-3 space-y-2'>
                        {recentSteps.length > 0 ? (
                          recentSteps.map((step) => (
                            <div
                              key={`sim-step-${step.spinIndex}`}
                              className='rounded-2xl border border-white/8 bg-slate-950/45 px-3 py-2.5 text-sm text-slate-200'>
                              <div className='flex items-center justify-between gap-3'>
                                <div className='font-semibold text-white'>
                                  Spin {step.spinIndex} · {step.landedNumber}
                                </div>
                                <div className='text-xs uppercase tracking-[0.16em] text-slate-400'>
                                  R{step.bet.round} · {formatQuadrantLabel(step.bet.quadrant)}
                                </div>
                              </div>
                              <div className='mt-1 text-xs text-slate-400'>
                                Bet {step.bet.coverageCount} placements for {step.bet.totalStake} total · {step.hitType} ·{' '}
                                {formatSessionOutcome(step.sessionOutcome)}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className='rounded-2xl border border-dashed border-white/12 bg-slate-950/35 px-3 py-6 text-center text-sm text-slate-400'>
                            {isTracking
                              ? 'Waiting for the first winning number after the simulator was armed.'
                              : 'Simulation paused. Live roulette results continue to log outside the replay session.'}
                          </div>
                        )}
                      </div>
*/
