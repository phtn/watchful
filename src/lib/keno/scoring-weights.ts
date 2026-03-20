import type { GameResult } from '../../types'

export type DrawHistory = number[][]

export interface ScoredNumber {
  value: number
  score: number
  frequency: number
  recencyBonus: number
}

export interface RecommendationResult {
  recommended: number[]
  scoredNumbers: ScoredNumber[]
  expectedOverlap: number
  sampleSize: number
}

const KENO_MIN = 1
const KENO_MAX = 40
const KENO_RANGE_SIZE = KENO_MAX - KENO_MIN + 1
const KENO_DRAW_SIZE = 10
const DEFAULT_POOL_SIZE = 10
const DEFAULT_HISTORY_LIMIT = 120

function getNumberRange(): number[] {
  return Array.from({ length: KENO_RANGE_SIZE }, (_, index) => index + KENO_MIN)
}

function validateHistory(history: DrawHistory): void {
  for (const draw of history) {
    if (!Array.isArray(draw)) {
      throw new Error('Each Keno draw must be an array of numbers.')
    }

    const uniqueValues = new Set(draw)
    if (uniqueValues.size !== draw.length) {
      throw new Error('Keno draws must not contain duplicate numbers.')
    }

    if (draw.some((value) => !Number.isInteger(value) || value < KENO_MIN || value > KENO_MAX)) {
      throw new Error(`All Keno numbers must be integers in range ${KENO_MIN}-${KENO_MAX}.`)
    }
  }
}

function validatePoolSize(poolSize: number): void {
  if (!Number.isInteger(poolSize) || poolSize < 1 || poolSize > KENO_RANGE_SIZE) {
    throw new Error(`Pool size must be an integer between 1 and ${KENO_RANGE_SIZE}.`)
  }
}

function normalizeKenoDraw(draw: unknown): number[] | null {
  if (!Array.isArray(draw)) {
    return null
  }

  const normalized = draw.map((value) => {
    if (typeof value === 'number') {
      return Number.isInteger(value) ? value : null
    }

    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value)
      return Number.isInteger(parsed) ? parsed : null
    }

    return null
  })

  if (normalized.some((value) => value === null)) {
    return null
  }

  const integers = normalized.filter((value): value is number => value !== null)

  if (integers.some((value) => value < KENO_MIN || value > KENO_MAX)) {
    return null
  }

  const uniqueValues = new Set(integers)
  if (uniqueValues.size !== integers.length) {
    return null
  }

  return integers
}

function scoreNumbers(history: DrawHistory): ScoredNumber[] {
  const totalDraws = history.length
  const frequencyMap = new Map<number, number>()
  const recencyMap = new Map<number, number>()

  history.forEach((draw, drawIndex) => {
    const recencyWeight = totalDraws === 0 ? 0 : (drawIndex + 1) / totalDraws

    draw.forEach((num) => {
      frequencyMap.set(num, (frequencyMap.get(num) ?? 0) + 1)
      recencyMap.set(num, (recencyMap.get(num) ?? 0) + recencyWeight)
    })
  })

  const frequencyValues = [...frequencyMap.values()]
  const recencyValues = [...recencyMap.values()]
  const maxFrequency = frequencyValues.length > 0 ? Math.max(...frequencyValues) : 1
  const maxRecency = recencyValues.length > 0 ? Math.max(...recencyValues) : 1

  return getNumberRange().map((num) => {
    const frequency = frequencyMap.get(num) ?? 0
    const recencyBonus = recencyMap.get(num) ?? 0
    const normalizedFreq = frequency / maxFrequency
    const normalizedRecency = recencyBonus / maxRecency
    const score = normalizedFreq * 0.6 + normalizedRecency * 0.4

    return { value: num, score, frequency, recencyBonus }
  })
}

function ensureRangeCoverage(candidates: ScoredNumber[], poolSize: number): number[] {
  const ranges = [
    candidates.filter((candidate) => candidate.value <= 10),
    candidates.filter((candidate) => candidate.value > 10 && candidate.value <= 20),
    candidates.filter((candidate) => candidate.value > 20 && candidate.value <= 30),
    candidates.filter((candidate) => candidate.value > 30)
  ]

  const minPerRange = Math.floor(poolSize / ranges.length)
  const selected = new Set<number>()

  for (const range of ranges) {
    const sorted = [...range].sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score
      }

      return left.value - right.value
    })

    sorted.slice(0, minPerRange).forEach((candidate) => selected.add(candidate.value))
  }

  const remaining = candidates
    .filter((candidate) => !selected.has(candidate.value))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score
      }

      return left.value - right.value
    })

  for (const candidate of remaining) {
    if (selected.size >= poolSize) {
      break
    }

    selected.add(candidate.value)
  }

  return [...selected].sort((left, right) => left - right)
}

function estimateExpectedOverlap(recommended: number[], history: DrawHistory): number {
  if (history.length === 0) {
    return (recommended.length * KENO_DRAW_SIZE) / KENO_RANGE_SIZE
  }

  const recommendedSet = new Set(recommended)
  const overlaps = history.map((draw) => draw.filter((value) => recommendedSet.has(value)).length)
  return overlaps.reduce((sum, overlap) => sum + overlap, 0) / overlaps.length
}

function getStakeKenoDraw(game: GameResult): number[] | null {
  if (game.providerData.provider !== 'stake' || game.providerData.game !== 'keno') {
    return null
  }

  return game.providerData.response.state.drawnNumbers
}

function getBet88KenoDraw(game: GameResult): number[] | null {
  if (game.providerData.provider !== 'bet88' || game.providerData.game !== 'keno') {
    return null
  }

  return game.providerData.response.custom.drawNumbers
}

function getKenoDraw(game: GameResult): number[] | null {
  return getStakeKenoDraw(game) ?? getBet88KenoDraw(game)
}

export function extractKenoDrawHistory(
  results: GameResult[],
  historyLimit: number = DEFAULT_HISTORY_LIMIT
): DrawHistory {
  const limit = Number.isInteger(historyLimit) && historyLimit > 0 ? historyLimit : DEFAULT_HISTORY_LIMIT

  return results
    .filter((game) => game.game === 'keno')
    .slice(-limit)
    .map((game) => getKenoDraw(game))
    .map((draw) => normalizeKenoDraw(draw))
    .filter((draw): draw is number[] => Array.isArray(draw) && draw.length > 0)
}

export function recommendNumbers(history: DrawHistory, poolSize: number = DEFAULT_POOL_SIZE): RecommendationResult {
  validatePoolSize(poolSize)
  validateHistory(history)

  const scoredNumbers = scoreNumbers(history)
  const recommended = ensureRangeCoverage(scoredNumbers, poolSize)
  const expectedOverlap = estimateExpectedOverlap(recommended, history)

  return {
    recommended,
    scoredNumbers,
    expectedOverlap,
    sampleSize: history.length
  }
}

export function recommendKenoNumbers(
  results: GameResult[],
  options?: { poolSize?: number; historyLimit?: number }
): RecommendationResult {
  const history = extractKenoDrawHistory(results, options?.historyLimit)
  return recommendNumbers(history, options?.poolSize)
}
