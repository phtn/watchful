export interface FinancialOutcomeInput {
  amount?: number
  payout?: number
  profit?: number
  fallbackWin?: boolean
  existingResult?: 'win' | 'loss'
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function resolveFinancialOutcome({
  amount,
  payout,
  profit,
  fallbackWin,
  existingResult
}: FinancialOutcomeInput): 'win' | 'loss' {
  if (isFiniteNumber(amount) && isFiniteNumber(payout)) {
    return payout > amount ? 'win' : 'loss'
  }

  if (isFiniteNumber(profit)) {
    return profit > 0 ? 'win' : 'loss'
  }

  if (isFiniteNumber(payout)) {
    return payout > 0 ? 'win' : 'loss'
  }

  if (typeof fallbackWin === 'boolean') {
    return fallbackWin ? 'win' : 'loss'
  }

  return existingResult === 'win' ? 'win' : 'loss'
}
