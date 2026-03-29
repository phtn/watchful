import { useEffect, useMemo, useState } from 'react'
import {
  BOARD_ROWS,
  KIMS_ALGO_QUADRANTS,
  createKimAlgoBetPlan,
  getKimQuadrantsContainingNumber,
  resolveKimAutoStartingQuadrant,
  resolveKimQuadrantPreference,
  simulateKimsAlgo,
  type KimQuadrantId,
  type KimSpreadSelectionMode
} from '../../lib/roulette'
import { getNumberTone } from '../../lib/roulette/utils'
import { cn } from '../../lib/utils'
import type { PanelStatus } from '../../types'

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

  const parsedBaseUnit = Number.parseFloat(baseUnitInput)
  const baseUnit = Number.isFinite(parsedBaseUnit) && parsedBaseUnit > 0 ? parsedBaseUnit : 1
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
  const recentSteps = simulation.steps.slice(-6).reverse()

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
    setIsTracking(true)
  }

  return (
    <section className='overflow-hidden rounded-[18px] border border-white/12 bg-[linear-gradient(180deg,rgba(8,15,29,0.96),rgba(11,19,35,0.92))] p-4 text-white shadow-[0_28px_90px_-42px_rgba(15,23,42,0.82)]'>
      <div className='flex items-start justify-between gap-3'>
        <div className='space-y-1'>
          <p className='text-[0.62rem] uppercase tracking-[0.32em] text-emerald-100/70'>Kim Virtual Board</p>
          <div className='rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.18em] text-slate-300'>
            {getSourceStatus(status)}
          </div>
        </div>
        <div className='flex flex-col items-end gap-2'>
          <div className='flex flex-wrap justify-end gap-2'>
            <button
              type='button'
              onClick={() => setAllowOverlaps((current) => !current)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.18em] transition-colors',
                allowOverlaps
                  ? 'border-amber-300/35 bg-amber-300/12 text-amber-100'
                  : 'border-cyan-300/35 bg-cyan-300/12 text-cyan-100'
              )}>
              {allowOverlaps ? 'Overlap On' : 'Spread Guard'}
            </button>
            <button
              type='button'
              onClick={() => setSpreadSelectionMode((current) => (current === 'within' ? 'across' : 'within'))}
              disabled={allowOverlaps}
              className={cn(
                'rounded-full border px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.18em] transition-colors disabled:cursor-not-allowed disabled:opacity-45',
                spreadSelectionMode === 'within'
                  ? 'border-emerald-300/35 bg-emerald-300/12 text-emerald-100'
                  : 'border-fuchsia-300/35 bg-fuchsia-300/12 text-fuchsia-100'
              )}>
              {spreadSelectionMode === 'within' ? 'Spread Within' : 'Spread Across'}
            </button>
            <button
              type='button'
              onClick={handleTrackingToggle}
              className={cn(
                'rounded-full border px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.18em] transition-colors',
                isTracking
                  ? 'border-emerald-300/35 bg-emerald-300/12 text-emerald-100'
                  : 'border-white/10 bg-white/6 text-slate-300'
              )}>
              {isTracking ? 'Pause Sim' : 'Arm Sim'}
            </button>
          </div>
        </div>
      </div>

      <div className='mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]'>
        <div className='rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(5,10,20,0.96),rgba(10,18,31,0.98))] p-3'>
          <div className='flex items-end justify-between gap-3'>
            <div>
              <p className='text-[0.62rem] uppercase tracking-[0.22em] text-slate-500'>Next live board</p>
              <h4 className='mt-2 text-sm font-semibold text-white'>Active Kim placements</h4>
            </div>
            {/*===BOARD===*/}
            <div className='text-right text-xs text-slate-400'>
              <div>{nextBet.quadrants.map(formatQuadrantLabel).join(' + ')}</div>
              <div className='mt-1'>Last landed: {latestWinningNumber ?? 'None yet'}</div>
              <div className='mt-1'>Hot: {hotNumbers.length > 0 ? hotNumbers.join(' · ') : 'warming'}</div>
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
                          'relative flex h-10 w-auto space-y-2 aspect-square items-center justify-center rounded-xl border text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-all disabled:cursor-default',
                          getNumberTone(value),
                          isActive && 'ring-2 ring-emerald-300/75 ring-offset-1 ring-offset-slate-950',
                          isLatest && 'border-amber-300 shadow-[0_0_0_1px_rgba(252,211,77,0.55)]',
                          isHoveredQuadrantMember && 'ring-2 ring-white/70 ring-offset-1 ring-offset-slate-950',
                          isStartingQuadrantTrigger && 'cursor-pointer hover:border-white',
                          isSelectedStartingQuadrant && 'border-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.22)]'
                        )}>
                        {value}
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
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className='mt-3 text-xs text-slate-400'>
            Hover a quadrant corner pocket to preview all four numbers, or click it to set the starting quadrant.
            {!isTracking && autoStartingQuadrant ? (
              <span className='block mt-1 text-slate-500'>
                Auto idle start: {formatQuadrantLabel(autoStartingQuadrant)} from the latest shared pair.
              </span>
            ) : null}
          </div>
          <div className='mt-4 grid gap-2 grid-cols-3'>
            <div className='rounded-2xl border border-white/10 bg-white/5 p-3'>
              <p className='text-[0.62rem] uppercase tracking-[0.2em] text-slate-400'>round</p>
              <p className='mt-2 text-2xl font-semibold text-white'>{nextBet.round}</p>
            </div>
            <div className='rounded-2xl border border-white/10 bg-white/5 p-3'>
              <p className='text-[0.62rem] uppercase tracking-[0.2em] text-slate-400'>Win streak</p>
              <p className='mt-2 text-2xl font-semibold text-white'>{simulation.stats.currentWinStreak}</p>
            </div>
            <label className='rounded-2xl border border-white/10 bg-white/5 p-3'>
              <span className='text-[0.62rem] uppercase tracking-[0.2em] text-slate-400'>Base unit</span>
              <input
                type='number'
                min='1'
                step='1'
                value={baseUnitInput}
                onChange={(event) => setBaseUnitInput(event.target.value)}
                className='mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none'
              />
            </label>
          </div>
          <div className='grid grid-cols-3 mt-2 gap-2'>
            <div className='rounded-2xl border border-white/10 bg-white/5 p-3'>
              <p className='text-[0.62rem] uppercase tracking-[0.2em] text-slate-400'>spins</p>
              <p className='mt-2 text-2xl font-semibold text-white'>{simulation.steps.length}</p>
              <p className='mt-1 text-xs text-slate-400'>{winningNumbers.length} overall</p>
            </div>

            <div className='rounded-2xl border border-white/10 bg-white/5 p-3'>
              <p className='text-[0.62rem] uppercase tracking-[0.2em] text-slate-400'>Next total stake</p>
              <p className='mt-2 text-2xl font-semibold text-white'>{nextBet.totalStake}</p>
              <p className='mt-1 text-xs text-slate-400'>
                Unit {nextBet.unitStake} · x{roundMultiplier}
                {nextBet.zeroStake > 0 ? ` • Zero ${nextBet.zeroStake}` : ''}
              </p>
              <p className='mt-1 text-xs text-slate-500'>
                {allowOverlaps ? 'Overlap stack active' : `Spread ${nextBet.spreadSelectionMode} hot-pick mode`}
              </p>
            </div>
            <div className='rounded-2xl border border-white/10 bg-white/5 p-3'>
              <p className='text-[0.62rem] uppercase tracking-[0.2em] text-slate-400'>Board coverage</p>
              <p className='mt-2 text-2xl font-semibold text-white'>{nextBet.coveragePercent.toFixed(2)}%</p>
              <p className='mt-1 text-xs text-slate-400'>{nextBet.coverageCount} placements of 37 slots</p>
            </div>
          </div>
        </div>
        <div className='mt-4 grid grid-cols-2 gap-1'></div>
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
          </div>
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
