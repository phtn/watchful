import { TableState } from '@/src/types/roulette'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  KIMS_ALGO_QUADRANTS,
  createKimAlgoBetPlan,
  getKimAlgoGrossReturn,
  getKimQuadrantsContainingPair,
  resolveKimAutoStartingQuadrant,
  simulateKimsAlgo,
  type KimQuadrantId,
  type KimSpreadSelectionMode
} from '../../../lib/roulette'
import { cn } from '../../../lib/utils'
import type { PanelStatus } from '../../../types'
import { ChipStack, EVO_BUTTON_SELECTORS } from './chip-stack'
import { RouletteControls } from './roulette-controls'
import { RouletteGrid } from './roulette-grid'
import { RouletteStats } from './roulette-stats'

interface RouletteVirtualBoardProps {
  status: PanelStatus
  winningNumbers: readonly number[]
  evolutionChips: number[]
  evolutionRebetVisible: boolean
  evolutionBettingOpen: boolean
  evolutionTableState: TableState | null
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

const WIN_VERBS = [
  'snatched',
  'bagged',
  'took',
  'grabbed',
  'swiped',
  'cashed',
  'scooped',
  'catched',
  'stashed',
  'locked'
]

function pickVerb(): string {
  return WIN_VERBS[Math.floor(Math.random() * WIN_VERBS.length)]
}

export function RouletteVirtualBoard({
  winningNumbers,
  evolutionChips,
  evolutionRebetVisible,
  evolutionTableState
}: RouletteVirtualBoardProps) {
  const [startingQuadrant, setStartingQuadrant] = useState<KimQuadrantId>('q1')
  const [hoveredQuadrant, setHoveredQuadrant] = useState<KimQuadrantId | null>(null)
  const [baseUnitInput, setBaseUnitInput] = useState('1')
  const [isTracking, setIsTracking] = useState(false)
  const [allowOverlaps, setAllowOverlaps] = useState(false)
  const [spreadSelectionMode, setSpreadSelectionMode] = useState<KimSpreadSelectionMode>('within')
  const [scatter, setScatter] = useState(false)
  const [trackedWinningNumbers, setTrackedWinningNumbers] = useState<number[]>([])
  const [lastConsumedIndex, setLastConsumedIndex] = useState(winningNumbers.length)
  const [winStreak, setWinStreak] = useState(0)
  const [accWinnings, setAccWinnings] = useState(0)
  const [lastWinProfit, setLastWinProfit] = useState<number | null>(null)
  const [winVerb, setWinVerb] = useState(pickVerb)
  const [lockedBankValue, setLockedBankValue] = useState<number | null>(null)
  const [inputMode, setInputMode] = useState<'base' | 'bank'>('base')
  const [selectedChip, setSelectedChip] = useState<number | null>(null)
  // Auto-arm: arm the board automatically when a KIM signal is detected
  const [auto, setAuto] = useState(false)
  // Loaded: auto-execute v-board bets on the actual Evolution table each betting window
  const [loaded, setLoaded] = useState(false)
  // Evolution's DOM takes a moment to render bet spots after the window signal fires.
  // Bet verification feedback: 'idle' | 'placing' | 'ok' | 'missed'
  const [betStatus, setBetStatus] = useState<'idle' | 'placing' | 'ok' | 'missed'>('idle')
  const [placedLog, setPlacedLog] = useState<number[][]>([])

  const processedStepCountRef = useRef(0)
  // Edge-detection refs
  const prevSignalFoundRef = useRef(false)
  // lastBetStepRef: step for which bets were actually *dispatched* to the background.
  // claimedStepRef: step for which a pending timer is scheduled (reset on cancel).
  // Separating these two lets the next betting window retry a step whose timer was
  // cancelled mid-delay (e.g. the window closed before the delay elapsed).
  const lastBetStepRef = useRef(-1)
  const claimedStepRef = useRef(-1)

  const parsedInput = Number.parseFloat(baseUnitInput)
  const baseUnit =
    Number.isFinite(parsedInput) && parsedInput > 0 ? (inputMode === 'bank' ? parsedInput / 272 : parsedInput) : 1
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

  const simulation = useMemo(
    () =>
      simulateKimsAlgo(trackedWinningNumbers, {
        startingQuadrant,
        baseUnit,
        allowOverlaps,
        spreadSelectionMode,
        hotNumbers,
        scatter,
        placedNumbersPerStep: placedLog
      }),
    [
      allowOverlaps,
      baseUnit,
      hotNumbers,
      placedLog,
      scatter,
      spreadSelectionMode,
      startingQuadrant,
      trackedWinningNumbers
    ]
  )
  const nextBet = useMemo(
    () =>
      createKimAlgoBetPlan(simulation.finalState.nextRound, simulation.finalState.nextQuadrants, baseUnit, {
        allowOverlaps,
        spreadSelectionMode,
        hotNumbers,
        scatter,
        scatterSeed: trackedWinningNumbers.length
      }),
    [allowOverlaps, baseUnit, hotNumbers, scatter, simulation, spreadSelectionMode, trackedWinningNumbers.length]
  )
  const roundMultiplier = getEffectiveStakeMultiplier(nextBet.unitStake, baseUnit, 1)
  const placementMap = useMemo(() => getPlacementMap(nextBet.numbers), [nextBet])
  const latestWinningNumber = trackedWinningNumbers[trackedWinningNumbers.length - 1] ?? null
  const lastResetIndex = useMemo(
    () => simulation.steps.reduce((last, step, idx) => (step.sessionOutcome !== 'continue' ? idx : last), -1),
    [simulation]
  )
  const totalStaked = useMemo(
    () =>
      simulation.steps
        .slice(lastResetIndex + 1)
        .reduce((sum, step) => sum + step.bet.totalStake + (step.bet.zeroStake ?? 0), 0) + nextBet.totalStake,
    [lastResetIndex, nextBet, simulation]
  )
  // const recentSteps = simulation.steps.slice(-6).reverse()
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
        // Sum stakes from the current session start up to and including this win step
        const stepIdx = step.spinIndex - 1
        let sessionStake = step.bet.totalStake
        for (let i = stepIdx - 1; i >= 0; i--) {
          const prevStep = simulation.steps[i]
          if (prevStep.sessionOutcome !== 'continue') break
          sessionStake += prevStep.bet.totalStake
        }
        const profit = getKimAlgoGrossReturn(step.bet, step.landedNumber) - sessionStake
        winningsGained += profit
        latestProfit = profit
      }
    }

    setWinStreak((prev) => (streakReset ? 0 : prev + streakDelta))
    if (winningsGained !== 0) setAccWinnings((prev) => prev + winningsGained)
    if (latestProfit !== null) {
      setLastWinProfit(latestProfit)
      setWinVerb(pickVerb())
    }
  }, [simulation.steps])

  // Auto-disarm on win, max-loss, or zero without a hedge (rounds 1–3)
  useEffect(() => {
    if (!isTracking) return
    const latestStep = simulation.steps[simulation.steps.length - 1]
    if (!latestStep) return
    if (
      latestStep.sessionOutcome === 'reset_after_win' ||
      latestStep.sessionOutcome === 'reset_after_max_loss' ||
      (latestStep.landedNumber === 0 && latestStep.bet.zeroStake === 0)
    ) {
      setIsTracking(false)
    }
  }, [simulation.steps, isTracking])

  // ── Auto-arm ──────────────────────────────────────────────────────────────
  // Fire exactly once on the rising edge of signalFound while auto is on.
  useEffect(() => {
    const wasSignal = prevSignalFoundRef.current
    prevSignalFoundRef.current = signalFound
    if (!auto || isTracking) return
    if (signalFound && !wasSignal) {
      // Signal just appeared — arm the board
      if (autoStartingQuadrant) setStartingQuadrant(autoStartingQuadrant)
      setTrackedWinningNumbers([])
      setLastConsumedIndex(winningNumbers.length)
      setLockedBankValue(baseUnit * 272)
      setIsTracking(true)
    }
  }, [auto, signalFound, isTracking, autoStartingQuadrant, baseUnit, winningNumbers.length])

  // ── Loaded: auto-execute bets once per simulation step ───────────────────
  // Reset the step guard on every arm/disarm so each new session starts fresh.
  // On disarm (win, loss, or manual), also clear stale bet status and tracked numbers
  // so the board returns to a clean idle state without requiring a manual re-arm cycle.
  useEffect(() => {
    lastBetStepRef.current = -1
    claimedStepRef.current = -1
    if (!isTracking) {
      setBetStatus('idle')
      setTrackedWinningNumbers([])
    }
  }, [isTracking])

  useEffect(() => {
    if (!loaded || !isTracking || evolutionTableState !== 'BETS_OPEN') return
    if (!selectedChip) return // no chip selected yet
    if (nextBet.numbers.length === 0) return // nothing to bet

    const currentStep = simulation.steps.length
    if (lastBetStepRef.current === currentStep) return // already dispatched for this step
    if (claimedStepRef.current === currentStep) return // timer already pending for this step
    claimedStepRef.current = currentStep // reserve a pending timer slot

    setBetStatus('placing')

    // Snapshot everything needed inside the closure so the delayed callback
    // uses the values from *this* render, not a potentially-stale later one.
    const effectivePlacementMap = new Map(placementMap)
    if (nextBet.zeroStake > 0) effectivePlacementMap.set(0, 1)

    const baseNumbers: number[] = []
    for (const [num, count] of effectivePlacementMap) {
      for (let i = 0; i < count; i++) baseNumbers.push(num)
    }

    const doubleCount = roundMultiplier > 1 ? Math.log2(roundMultiplier) : 0
    const chip = selectedChip
    const round = nextBet.round
    const multiplier = roundMultiplier
    const effectiveDelay = 700

    // console.log(
    //   `[Load] Scheduling bets in ${effectiveDelay}ms — round ${round}, ${multiplier}x (${doubleCount} doubles), chip ${chip}, ${baseNumbers.length} slot clicks`,
    //   baseNumbers
    // )

    // Delay the actual placement so Evolution's bet-spot DOM has time to render
    // after the betting-window signal fires.
    const timer = setTimeout(() => {
      claimedStepRef.current = -1 // release the pending slot
      lastBetStepRef.current = currentStep // mark step as dispatched
      chrome.runtime.sendMessage(
        { type: 'PLACE_EVOLUTION_BETS', chipValue: chip, numbers: baseNumbers, doubleCount },
        (response) => {
          const missed: number[] = response?.missed ?? []
          const placed: number[] = response?.placed ?? []
          const ok = !chrome.runtime.lastError && response?.ok && missed.length === 0

          setPlacedLog((prev) => [...prev, placed])
          console.log(`[kim] R${round} placed on table: [${placed.join(', ')}]`)

          setBetStatus(ok ? 'ok' : 'missed')
          setTimeout(() => setBetStatus('idle'), 4000)

          if (!ok) {
            const runtimeErr = chrome.runtime.lastError?.message ?? 'none'
            const missedStr = missed.length ? missed.join(', ') : 'none'
            console.warn(
              `[Load] ⚠ placed ${placed.length}/${baseNumbers.length} — missed: [${missedStr}] | runtime error: ${runtimeErr} | round ${round} (chip ${chip})`
            )
          }
        }
      )
    }, effectiveDelay)

    return () => {
      clearTimeout(timer)
      claimedStepRef.current = -1 // release claim without dispatching — next window can retry
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evolutionTableState, loaded, isTracking, selectedChip, simulation.steps.length])
  // ^ placementMap/roundMultiplier/nextBet intentionally omitted from deps —
  //   they are snapshotted into locals at fire time. The primary triggers are:
  //   • evolutionTableState === 'BETS_OPEN'  — window opens for a new round
  //   • simulation.steps.length — a new round has been logged (succeeding rounds)

  const handleTrackingToggle = () => {
    if (isTracking) {
      setIsTracking(false)
      return
    }

    if (autoStartingQuadrant) {
      setStartingQuadrant(autoStartingQuadrant)
    }

    setTrackedWinningNumbers([])
    setPlacedLog([])
    setLastConsumedIndex(winningNumbers.length)
    setLockedBankValue(baseUnit * 272)
    setIsTracking(true)
  }
  const placeEvolutionBets = (numbers: number[]) => {
    if (!selectedChip) return
    chrome.runtime.sendMessage({ type: 'PLACE_EVOLUTION_BETS', chipValue: selectedChip, numbers }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn('Failed to place bets:', chrome.runtime.lastError.message)
        return
      }
      if (response?.ok) {
        console.log('Bets placed:', response.placed)
      } else {
        console.warn('Bet placement issue:', response)
      }
    })
  }

  const winAmount = 36 * nextBet.unitStake

  const sendEvoClick = useCallback((selector: string, label: string) => {
    chrome.runtime.sendMessage({ type: 'CLICK_EVOLUTION_ELEMENT', selector }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn(`[evo] ${label} click failed:`, chrome.runtime.lastError.message)
      } else {
        console.log(`[evo] ${label} click:`, response)
      }
    })
  }, [])

  const onChipSelect = useCallback(
    (v: number) => () => {
      setSelectedChip(v)
      // While armed, keep the base unit locked to its configured value so the
      // KIM algorithm's multiplier math stays correct.  Only sync the input field
      // when the board is disarmed.
      if (!isTracking) {
        setBaseUnitInput(String(v))
        setInputMode('base')
      }
      sendEvoClick(`div[data-role="chip"][data-value="${v}"]`, `chip-${v}`)
    },
    [sendEvoClick, isTracking]
  )

  const toggleAuto = useCallback(() => setAuto((v) => !v), [setAuto])
  const toggleLoaded = useCallback(() => setLoaded((v) => !v), [setLoaded])
  const toggleScatter = useCallback(() => setScatter((v) => !v), [setScatter])
  const toggleAllowOverlaps = useCallback(() => setAllowOverlaps((v) => !v), [setAllowOverlaps])
  const toggleSpreadSelectionMode = useCallback(
    () => setSpreadSelectionMode((current) => (current === 'within' ? 'across' : 'within')),
    [setSpreadSelectionMode]
  )

  const onUndo = useCallback(() => sendEvoClick(EVO_BUTTON_SELECTORS.undo, 'undo'), [sendEvoClick])
  const onRebet = useCallback(() => sendEvoClick(EVO_BUTTON_SELECTORS.rebet, 'rebet'), [sendEvoClick])
  const onDouble = useCallback(() => sendEvoClick(EVO_BUTTON_SELECTORS.double, 'double'), [sendEvoClick])
  const onTables = useCallback(() => sendEvoClick('[data-role="plus-table-button"]', 'tables'), [sendEvoClick])
  // border border-white/12 bg-[linear-gradient(180deg,rgba(8,15,29,0.96),rgba(11,19,35,0.92))]
  return (
    <section
      className={cn(
        'overflow-hidden rounded-s-lg text-white pl-2',
        'bg-[radial-gradient(circle,rgba(239,68,68,0.28),transparent_68%)]'
      )}>
      <RouletteControls
        fmtAmt={fmtAmt}
        winVerb={winVerb}
        lastWinProfit={lastWinProfit}
        signalFound={false}
        isTracking={isTracking}
        auto={auto}
        toggleAuto={toggleAuto}
        scatter={scatter}
        toggleScatter={toggleScatter}
        allowOverlaps={allowOverlaps}
        toggleAllowOverlaps={toggleAllowOverlaps}
        spreadSelectionMode={spreadSelectionMode}
        toggleSpreadSelectionMode={toggleSpreadSelectionMode}
        loaded={loaded}
        toggleLoaded={toggleLoaded}
        toggleTracking={handleTrackingToggle}
        betStatus={betStatus}
      />

      <div className='grid gap-2 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]'>
        <div className='bg-[linear-gradient(180deg,rgba(255,255,255,0.01),rgba(255,255,255,0)),linear-gradient(180deg,rgba(31,35,41,0.96),rgba(12,14,19,0.9))]'>
          <RouletteGrid
            selectedChip={selectedChip}
            placeEvolutionBets={placeEvolutionBets}
            zeroStake={nextBet.zeroStake}
            latestWinningNumber={latestWinningNumber}
            roundMultiplier={roundMultiplier}
            round={nextBet.round}
            placementMap={placementMap}
            getESM={getEffectiveStakeMultiplier}
            unitStake={nextBet.unitStake}
            baseUnit={baseUnit}
            hotNumbers={hotNumbers}
            selectedStartingQuadrantNumbers={selectedStartingQuadrantNumbers}
            hoveredQuadrantNumbers={hoveredQuadrantNumbers}
            hotRankMap={hotRankMap}
            startingQuadrant={startingQuadrant}
            setStartingQuadrant={setStartingQuadrant}
            setHoveredQuadrant={setHoveredQuadrant}
          />

          <div className='relative mt-2'>
            {/*Hover a quadrant corner pocket to preview all four numbers, or click it to set the starting quadrant.*/}
            {!isTracking && autoStartingQuadrant ? (
              <span className='absolute top-0 left-4 block text-slate-400 text-xs italic'>
                Auto idle start: {formatQuadrantLabel(autoStartingQuadrant)} from the latest shared pair.
              </span>
            ) : null}
          </div>

          <div className='mt-2'>
            <ChipStack
              chipsDetected={evolutionChips}
              onChipSelect={onChipSelect}
              onUndo={onUndo}
              onRebet={evolutionRebetVisible ? onRebet : undefined}
              onDouble={onDouble}
              onTables={onTables}
              tableState={evolutionTableState}
            />
          </div>
          <RouletteStats
            spins={winningNumbers.length}
            steps={simulation.steps.length}
            round={nextBet.round}
            winStreak={winStreak}
            accWinnings={accWinnings}
            setInputMode={setInputMode}
            inputMode={inputMode}
            baseUnit={baseUnit}
            baseUnitInput={baseUnitInput}
            setBaseUnitInput={setBaseUnitInput}
            totalStaked={totalStaked}
            nextBet={nextBet.unitStake}
            winAmount={winAmount}
            profitValue={winAmount - totalStaked}
            profitPercent={((winAmount - totalStaked) / (baseUnit * 272)) * 100}
            coverage={nextBet.coverageCount}
            coveragePercent={nextBet.coveragePercent}
          />
        </div>
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
