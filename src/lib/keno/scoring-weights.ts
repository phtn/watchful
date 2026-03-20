type DrawHistory = number[][]

interface ScoredNumber {
  value: number
  score: number
  frequency: number
  recencyBonus: number
}

interface RecommendationResult {
  recommended: number[]
  scoredNumbers: ScoredNumber[]
  expectedOverlap: number
}

function scoreNumbers(history: DrawHistory): ScoredNumber[] {
  const totalDraws = history.length
  const frequencyMap = new Map<number, number>()
  const recencyMap = new Map<number, number>()

  // Count frequency and recency-weighted appearances
  history.forEach((draw, drawIndex) => {
    // More recent draws get higher weight (linear decay)
    const recencyWeight = (drawIndex + 1) / totalDraws

    draw.forEach((num) => {
      frequencyMap.set(num, (frequencyMap.get(num) ?? 0) + 1)
      recencyMap.set(num, (recencyMap.get(num) ?? 0) + recencyWeight)
    })
  })

  const maxFrequency = Math.max(...frequencyMap.values(), 1)
  const maxRecency = Math.max(...recencyMap.values(), 1)

  return Array.from({ length: 40 }, (_, i) => i + 1).map((num) => {
    const frequency = frequencyMap.get(num) ?? 0
    const recencyBonus = recencyMap.get(num) ?? 0

    // Normalize both scores to [0, 1] and combine
    const normalizedFreq = frequency / maxFrequency
    const normalizedRecency = recencyBonus / maxRecency

    // 60% weight on frequency, 40% on recency
    const score = normalizedFreq * 0.6 + normalizedRecency * 0.4

    return { value: num, score, frequency, recencyBonus }
  })
}

function ensureRangeCoverage(candidates: ScoredNumber[], poolSize: number): number[] {
  // Divide 1–40 into 4 ranges of 10 to avoid clustering
  const ranges = [
    candidates.filter((n) => n.value <= 10),
    candidates.filter((n) => n.value > 10 && n.value <= 20),
    candidates.filter((n) => n.value > 20 && n.value <= 30),
    candidates.filter((n) => n.value > 30)
  ]

  const minPerRange = Math.floor(poolSize / ranges.length) // at least 2 per range
  const selected = new Set<number>()

  // Guarantee minimum coverage per range
  for (const range of ranges) {
    const sorted = [...range].sort((a, b) => b.score - a.score)
    sorted.slice(0, minPerRange).forEach((n) => selected.add(n.value))
  }

  // Fill remaining slots from top-scored unselected numbers
  const remaining = candidates.filter((n) => !selected.has(n.value)).sort((a, b) => b.score - a.score)

  for (const n of remaining) {
    if (selected.size >= poolSize) break
    selected.add(n.value)
  }

  return [...selected].sort((a, b) => a - b)
}

function estimateExpectedOverlap(recommended: number[], history: DrawHistory): number {
  if (history.length === 0) return 3 // baseline: 10 drawn from 40, pick 10 → E[overlap] = 2.5

  const overlaps = history.map((draw) => draw.filter((n) => recommended.includes(n)).length)
  return overlaps.reduce((sum, o) => sum + o, 0) / overlaps.length
}

export function recommendNumbers(history: DrawHistory, poolSize: number = 10): RecommendationResult {
  if (history.some((draw) => draw.some((n) => n < 1 || n > 40))) {
    throw new Error('All numbers must be in range 1–40.')
  }

  const scoredNumbers = scoreNumbers(history)

  const recommended =
    history.length === 0
      ? Array.from({ length: poolSize }, (_, i) => i + 1) // no history: pick 1–10
      : ensureRangeCoverage(scoredNumbers, poolSize)

  const expectedOverlap = estimateExpectedOverlap(recommended, history)

  return { recommended, scoredNumbers, expectedOverlap }
}

// --- Example usage ---

const history: DrawHistory = [
  [1, 5, 12, 17, 23, 28, 33, 36, 38, 40],
  [2, 5, 11, 17, 22, 27, 33, 35, 37, 40],
  [3, 7, 12, 18, 23, 29, 31, 35, 38, 39],
  [5, 9, 14, 17, 24, 28, 32, 35, 37, 40],
  [1, 6, 12, 19, 23, 27, 33, 36, 38, 40]
]

const result = recommendNumbers(history, 10)

console.log('Recommended numbers:', result.recommended)
console.log('Expected overlap with a future draw (historical avg):', result.expectedOverlap.toFixed(2))
console.log(
  '\nTop 10 scored numbers:',
  result.scoredNumbers
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((n) => `${n.value} (score: ${n.score.toFixed(3)})`)
)
