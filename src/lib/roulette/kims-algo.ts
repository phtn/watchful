export type KimQuadrantId = 'q1' | 'q2' | 'q3' | 'q4' | 'q5' | 'q6' | 'q7' | 'q8' | 'q9' | 'q10' | 'q11' | 'q12'
export type KimAlgoRound = 1 | 2 | 3 | 4 | 5
export type KimSpreadSelectionMode = 'within' | 'across'

const EUROPEAN_ROULETTE_SLOT_COUNT = 37

export interface KimAlgoOptions {
  startingQuadrant: KimQuadrantId
  baseUnit: number
  allowOverlaps?: boolean
  spreadSelectionMode?: KimSpreadSelectionMode
  hotNumbers?: readonly number[]
}

export interface KimAlgoBetPlan {
  round: KimAlgoRound
  quadrant: KimQuadrantId
  quadrants: KimQuadrantId[]
  numbers: number[]
  unitStake: number
  zeroStake: number
  totalStake: number
  coverageCount: number
  coveragePercent: number
  allowOverlaps: boolean
  spreadQuadrants: KimQuadrantId[]
  spreadSelectionMode: KimSpreadSelectionMode
}

export interface KimAlgoSelection {
  number: number
  candidateQuadrants: KimQuadrantId[]
  selectedQuadrant: KimQuadrantId | null
}

export interface KimAlgoStep {
  spinIndex: number
  landedNumber: number
  bet: KimAlgoBetPlan
  hit: boolean
  hitType: 'quadrant' | 'zero' | 'miss'
  sessionOutcome: 'continue' | 'reset_after_win' | 'reset_after_max_loss'
  selection: KimAlgoSelection
  nextRound: KimAlgoRound
  nextQuadrant: KimQuadrantId
  nextQuadrants: KimQuadrantId[]
}

export interface KimAlgoSimulation {
  options: KimAlgoOptions
  assumptions: string[]
  steps: KimAlgoStep[]
  stats: {
    winCount: number
    currentWinStreak: number
    bestWinStreak: number
  }
  finalState: {
    nextRound: KimAlgoRound
    nextQuadrant: KimQuadrantId
    nextQuadrants: KimQuadrantId[]
  }
}

export const KIMS_ALGO_QUADRANTS: Record<KimQuadrantId, readonly number[]> = {
  q1: [1, 2, 5, 4],
  q2: [2, 3, 6, 5],
  q3: [7, 8, 11, 10],
  q4: [8, 9, 12, 11],
  q5: [13, 14, 17, 16],
  q6: [14, 15, 18, 17],
  q7: [19, 20, 23, 22],
  q8: [20, 21, 24, 23],
  q9: [25, 26, 29, 28],
  q10: [26, 27, 30, 29],
  q11: [31, 32, 35, 34],
  q12: [32, 33, 36, 35]
} as const

export const KIMS_ALGO_MAX_ROUNDS = 5
export const KIMS_ALGO_PROGRESSIVE_MULTIPLIERS = [1, 1, 2, 4, 8] as const

export const KIMS_ALGO_ASSUMPTIONS = [
  'The YAML is treated as authoritative for all quadrant definitions, including q5 = [13, 14, 17, 16].',
  'The round ladder counts straight-up number placements, not unique board coverage: round 1 places 4 numbers, round 2 places 8, round 3 places 12, round 4 places 16 plus zero, and round 5 places 20 plus zero.',
  'Per-number stake progression is interpreted as [1x, 1x, 2x, 4x, 8x].',
  'Overlap mode defaults to off. When a new quadrant would overlap an existing paired quadrant, the overlapping half is replaced by hot-prioritized local spread picks.',
  'Idle auto-start uses the latest two logged numbers when they share a quadrant; shared top-vs-bottom ties are broken by hot-number density, then hot rank, then current quadrant.',
  'Zero is hedged on rounds 4 and 5 with the same per-number stake used on the quadrant.',
  'After each miss, the next quadrant is chosen from the landed number and added to the active sequence before the next round begins.',
  'If a winning number belongs to multiple quadrants, the selector prefers a quadrant that has not already appeared in the active sequence; ties break by proximity to the current quadrant id, then by lower quadrant id.',
  'If a reset spin lands on 0, the next quadrant stays on the current quadrant because 0 does not belong to any quadrant.'
] as const

function getQuadrantIndex(quadrantId: KimQuadrantId): number {
  return Number.parseInt(quadrantId.slice(1), 10)
}

function getQuadrantBand(quadrantId: KimQuadrantId): 'lower' | 'upper' {
  return getQuadrantIndex(quadrantId) % 2 === 1 ? 'lower' : 'upper'
}

function getQuadrantUniquePair(quadrantId: KimQuadrantId): number[] {
  const numbers = KIMS_ALGO_QUADRANTS[quadrantId]

  return getQuadrantBand(quadrantId) === 'lower' ? [numbers[0], numbers[3]] : [numbers[1], numbers[2]]
}

function toQuadrantId(index: number): KimQuadrantId {
  return `q${index}` as KimQuadrantId
}

function getAdjacentSpreadQuadrants(quadrantId: KimQuadrantId, mode: KimSpreadSelectionMode): KimQuadrantId[] {
  const quadrantIndex = getQuadrantIndex(quadrantId)
  const offsets = mode === 'within' ? [2, -2] : [1, -1, 2, -2]

  return offsets
    .map((offset) => quadrantIndex + offset)
    .filter((index) => index >= 1 && index <= 12)
    .map((index) => toQuadrantId(index))
}

function assertValidRound(round: number): asserts round is KimAlgoRound {
  if (!Number.isInteger(round) || round < 1 || round > KIMS_ALGO_MAX_ROUNDS) {
    throw new Error(`Round must be an integer between 1 and ${KIMS_ALGO_MAX_ROUNDS}.`)
  }
}

function assertValidUnit(baseUnit: number): void {
  if (!Number.isFinite(baseUnit) || baseUnit <= 0) {
    throw new Error('Base unit must be a finite number greater than 0.')
  }
}

function assertValidSpinNumber(number: number): void {
  if (!Number.isInteger(number) || number < 0 || number > 36) {
    throw new Error('Roulette spin numbers must be integers between 0 and 36.')
  }
}

export function getKimQuadrantsContainingNumber(number: number): KimQuadrantId[] {
  assertValidSpinNumber(number)

  return (Object.entries(KIMS_ALGO_QUADRANTS) as Array<[KimQuadrantId, readonly number[]]>)
    .filter(([, values]) => values.includes(number))
    .map(([quadrantId]) => quadrantId)
}

export function getKimQuadrantsContainingPair(firstNumber: number, secondNumber: number): KimQuadrantId[] {
  assertValidSpinNumber(firstNumber)
  assertValidSpinNumber(secondNumber)

  const secondQuadrants = new Set(getKimQuadrantsContainingNumber(secondNumber))
  return getKimQuadrantsContainingNumber(firstNumber).filter((quadrant) => secondQuadrants.has(quadrant))
}

export function resolveKimQuadrantPreference(
  candidateQuadrants: readonly KimQuadrantId[],
  hotNumbers: readonly number[],
  currentQuadrant?: KimQuadrantId
): KimQuadrantId | null {
  if (candidateQuadrants.length === 0) {
    return null
  }

  if (candidateQuadrants.length === 1) {
    return candidateQuadrants[0]
  }

  const hotNumberRanks = new Map(hotNumbers.map((value, index) => [value, index]))

  return [...candidateQuadrants].sort((left, right) => {
    const leftNumbers = KIMS_ALGO_QUADRANTS[left]
    const rightNumbers = KIMS_ALGO_QUADRANTS[right]
    const leftHotCount = leftNumbers.filter((value) => hotNumberRanks.has(value)).length
    const rightHotCount = rightNumbers.filter((value) => hotNumberRanks.has(value)).length

    if (leftHotCount !== rightHotCount) {
      return rightHotCount - leftHotCount
    }

    const leftHotRankScore = leftNumbers.reduce((score, value) => {
      const rank = hotNumberRanks.get(value)
      return score + (rank === undefined ? 0 : hotNumbers.length - rank)
    }, 0)
    const rightHotRankScore = rightNumbers.reduce((score, value) => {
      const rank = hotNumberRanks.get(value)
      return score + (rank === undefined ? 0 : hotNumbers.length - rank)
    }, 0)

    if (leftHotRankScore !== rightHotRankScore) {
      return rightHotRankScore - leftHotRankScore
    }

    if (currentQuadrant) {
      const leftMatchesCurrent = left === currentQuadrant
      const rightMatchesCurrent = right === currentQuadrant

      if (leftMatchesCurrent !== rightMatchesCurrent) {
        return leftMatchesCurrent ? -1 : 1
      }
    }

    return getQuadrantIndex(left) - getQuadrantIndex(right)
  })[0]
}

export function resolveKimAutoStartingQuadrant(
  spins: readonly number[],
  hotNumbers: readonly number[],
  currentQuadrant?: KimQuadrantId
): KimQuadrantId | null {
  if (spins.length < 2) {
    return null
  }

  const [firstNumber, secondNumber] = spins.slice(-2)
  const candidateQuadrants = getKimQuadrantsContainingPair(firstNumber, secondNumber)

  return resolveKimQuadrantPreference(candidateQuadrants, hotNumbers, currentQuadrant)
}

function resolveQuadrantPlacements(
  quadrant: KimQuadrantId,
  placedNumbers: readonly number[],
  allowOverlaps: boolean,
  spreadSelectionMode: KimSpreadSelectionMode,
  hotNumbers: readonly number[]
): {
  numbers: number[]
  spreadApplied: boolean
} {
  const baseNumbers = [...KIMS_ALGO_QUADRANTS[quadrant]]

  if (allowOverlaps) {
    return {
      numbers: baseNumbers,
      spreadApplied: false
    }
  }

  const placedSet = new Set(placedNumbers)
  const uniqueNumbers = baseNumbers.filter((value) => !placedSet.has(value))
  const hotNumberRanks = new Map(hotNumbers.map((value, index) => [value, index]))

  if (uniqueNumbers.length !== 2) {
    return {
      numbers: baseNumbers,
      spreadApplied: false
    }
  }

  const spreadPair = getAdjacentSpreadQuadrants(quadrant, spreadSelectionMode)
    .flatMap((candidateQuadrant) => getQuadrantUniquePair(candidateQuadrant))
    .filter((value) => !placedSet.has(value) && !uniqueNumbers.includes(value))
    .sort((left, right) => {
      const hotRankLeft = hotNumberRanks.get(left)
      const hotRankRight = hotNumberRanks.get(right)
      const leftIsHot = hotRankLeft !== undefined
      const rightIsHot = hotRankRight !== undefined

      if (leftIsHot !== rightIsHot) {
        return leftIsHot ? -1 : 1
      }

      if (leftIsHot && rightIsHot && hotRankLeft !== hotRankRight) {
        return hotRankLeft - hotRankRight
      }

      return right - left
    })
    .slice(0, 2)

  if (spreadPair.length < 2) {
    return {
      numbers: baseNumbers,
      spreadApplied: false
    }
  }

  return {
    numbers: [...uniqueNumbers, ...spreadPair],
    spreadApplied: true
  }
}

function appendKimQuadrant(quadrants: readonly KimQuadrantId[], nextQuadrant: KimQuadrantId): KimQuadrantId[] {
  return [...quadrants, nextQuadrant]
}

function summarizeKimWinStreaks(steps: readonly KimAlgoStep[]): KimAlgoSimulation['stats'] {
  let winCount = 0
  let currentWinStreak = 0
  let bestWinStreak = 0

  for (const step of steps) {
    if (step.hitType === 'miss') {
      // Only reset streak when the full sequence is exhausted or zero hit without a hedge
      if (step.sessionOutcome === 'reset_after_max_loss') {
        currentWinStreak = 0
      }
      continue
    }

    winCount += 1
    currentWinStreak += 1
    bestWinStreak = Math.max(bestWinStreak, currentWinStreak)
  }

  return {
    winCount,
    currentWinStreak,
    bestWinStreak
  }
}

export function selectKimQuadrant(
  number: number,
  options: {
    currentQuadrant?: KimQuadrantId
    usedQuadrants?: readonly KimQuadrantId[]
    hotNumbers?: readonly number[]
  } = {}
): KimAlgoSelection {
  const candidateQuadrants = getKimQuadrantsContainingNumber(number)
  const { currentQuadrant, usedQuadrants = [], hotNumbers = [] } = options

  if (candidateQuadrants.length === 0) {
    return {
      number,
      candidateQuadrants,
      selectedQuadrant: currentQuadrant ?? null
    }
  }

  const usedQuadrantSet = new Set(usedQuadrants)
  const hotNumberRanks = new Map(hotNumbers.map((value, index) => [value, index]))
  const currentIndex = currentQuadrant ? getQuadrantIndex(currentQuadrant) : null

  const selectedQuadrant = [...candidateQuadrants].sort((left, right) => {
    // 1. Prefer quadrant not already in the active sequence
    const leftIsUsed = usedQuadrantSet.has(left)
    const rightIsUsed = usedQuadrantSet.has(right)
    if (leftIsUsed !== rightIsUsed) {
      return leftIsUsed ? 1 : -1
    }

    // 2. Prefer quadrant with more hot numbers
    const leftNumbers = KIMS_ALGO_QUADRANTS[left]
    const rightNumbers = KIMS_ALGO_QUADRANTS[right]
    const leftHotCount = leftNumbers.filter((value) => hotNumberRanks.has(value)).length
    const rightHotCount = rightNumbers.filter((value) => hotNumberRanks.has(value)).length
    if (leftHotCount !== rightHotCount) {
      return rightHotCount - leftHotCount
    }

    // 3. Prefer quadrant with higher cumulative hot rank score (lower rank index = hotter)
    const leftHotScore = leftNumbers.reduce((score, value) => {
      const rank = hotNumberRanks.get(value)
      return score + (rank === undefined ? 0 : hotNumbers.length - rank)
    }, 0)
    const rightHotScore = rightNumbers.reduce((score, value) => {
      const rank = hotNumberRanks.get(value)
      return score + (rank === undefined ? 0 : hotNumbers.length - rank)
    }, 0)
    if (leftHotScore !== rightHotScore) {
      return rightHotScore - leftHotScore
    }

    // 4. Prefer quadrant closest to the current quadrant by index
    if (currentIndex !== null) {
      const distanceToLeft = Math.abs(getQuadrantIndex(left) - currentIndex)
      const distanceToRight = Math.abs(getQuadrantIndex(right) - currentIndex)
      if (distanceToLeft !== distanceToRight) {
        return distanceToLeft - distanceToRight
      }
    }

    // 5. Lower quadrant id as final tiebreaker
    return getQuadrantIndex(left) - getQuadrantIndex(right)
  })[0]

  return {
    number,
    candidateQuadrants,
    selectedQuadrant
  }
}

export function createKimAlgoBetPlan(
  round: KimAlgoRound,
  quadrants: readonly KimQuadrantId[],
  baseUnit: number = 1,
  options: Pick<KimAlgoOptions, 'allowOverlaps' | 'spreadSelectionMode' | 'hotNumbers'> = {}
): KimAlgoBetPlan {
  assertValidRound(round)
  assertValidUnit(baseUnit)

  if (quadrants.length === 0) {
    throw new Error('At least one quadrant is required to create a Kim Algo bet plan.')
  }

  const unitStake = baseUnit * KIMS_ALGO_PROGRESSIVE_MULTIPLIERS[round - 1]
  const zeroStake = round >= 4 ? unitStake : 0
  const allowOverlaps = options.allowOverlaps ?? false
  const spreadSelectionMode = options.spreadSelectionMode ?? 'within'
  const spreadQuadrants: KimQuadrantId[] = []
  const numbers = quadrants.reduce<number[]>((placements, quadrant) => {
    const resolved = resolveQuadrantPlacements(
      quadrant,
      placements,
      allowOverlaps,
      spreadSelectionMode,
      options.hotNumbers ?? []
    )

    if (resolved.spreadApplied) {
      spreadQuadrants.push(quadrant)
    }

    placements.push(...resolved.numbers)
    return placements
  }, [])
  const coverageCount = numbers.length + (zeroStake > 0 ? 1 : 0)

  return {
    round,
    quadrant: quadrants[quadrants.length - 1],
    quadrants: [...quadrants],
    numbers,
    unitStake,
    zeroStake,
    totalStake: numbers.length * unitStake + zeroStake,
    coverageCount,
    coveragePercent: (coverageCount / EUROPEAN_ROULETTE_SLOT_COUNT) * 100,
    allowOverlaps,
    spreadQuadrants,
    spreadSelectionMode
  }
}

export function simulateKimsAlgo(spins: readonly number[], options: Partial<KimAlgoOptions> = {}): KimAlgoSimulation {
  const resolvedOptions: KimAlgoOptions = {
    startingQuadrant: options.startingQuadrant ?? 'q1',
    baseUnit: options.baseUnit ?? 1,
    allowOverlaps: options.allowOverlaps ?? false,
    spreadSelectionMode: options.spreadSelectionMode ?? 'within',
    hotNumbers: options.hotNumbers ?? []
  }

  assertValidUnit(resolvedOptions.baseUnit)

  let activeQuadrants: KimQuadrantId[] = [resolvedOptions.startingQuadrant]
  let activeQuadrant = resolvedOptions.startingQuadrant
  let activeRound: KimAlgoRound = 1

  const steps = spins.map((landedNumber, index) => {
    assertValidSpinNumber(landedNumber)

    const bet = createKimAlgoBetPlan(activeRound, activeQuadrants, resolvedOptions.baseUnit, {
      allowOverlaps: resolvedOptions.allowOverlaps,
      spreadSelectionMode: resolvedOptions.spreadSelectionMode,
      hotNumbers: resolvedOptions.hotNumbers
    })
    const hitQuadrant = bet.numbers.includes(landedNumber)
    const hitZero = bet.zeroStake > 0 && landedNumber === 0
    const hit = hitQuadrant || hitZero
    const selection = selectKimQuadrant(landedNumber, {
      currentQuadrant: activeQuadrant,
      usedQuadrants: activeQuadrants,
      hotNumbers: resolvedOptions.hotNumbers
    })

    let sessionOutcome: KimAlgoStep['sessionOutcome'] = 'continue'
    let nextRound: KimAlgoStep['nextRound'] = activeRound === 5 ? 5 : ((activeRound + 1) as KimAlgoStep['nextRound'])
    let nextQuadrant = activeQuadrant
    let nextQuadrants = [...activeQuadrants]

    // Zero on rounds 1–3 (no zero hedge) is an immediate loss — don't escalate
    const zeroOnUnhedgedRound = landedNumber === 0 && bet.zeroStake === 0

    if (hit) {
      sessionOutcome = 'reset_after_win'
      nextRound = 1
      nextQuadrant = selection.selectedQuadrant ?? activeQuadrant
      nextQuadrants = [nextQuadrant]
    } else if (activeRound === KIMS_ALGO_MAX_ROUNDS || zeroOnUnhedgedRound) {
      sessionOutcome = 'reset_after_max_loss'
      nextRound = 1
      nextQuadrant = selection.selectedQuadrant ?? activeQuadrant
      nextQuadrants = [nextQuadrant]
    } else {
      nextRound = (activeRound + 1) as KimAlgoStep['nextRound']
      nextQuadrant = selection.selectedQuadrant ?? activeQuadrant
      nextQuadrants = appendKimQuadrant(activeQuadrants, nextQuadrant)
    }

    const step: KimAlgoStep = {
      spinIndex: index + 1,
      landedNumber,
      bet,
      hit,
      hitType: hitQuadrant ? 'quadrant' : hitZero ? 'zero' : 'miss',
      sessionOutcome,
      selection,
      nextRound,
      nextQuadrant,
      nextQuadrants
    }

    activeRound = nextRound
    activeQuadrant = nextQuadrant
    activeQuadrants = nextQuadrants

    return step
  })

  return {
    options: resolvedOptions,
    assumptions: [...KIMS_ALGO_ASSUMPTIONS],
    steps,
    stats: summarizeKimWinStreaks(steps),
    finalState: {
      nextRound: activeRound,
      nextQuadrant: activeQuadrant,
      nextQuadrants: activeQuadrants
    }
  }
}
