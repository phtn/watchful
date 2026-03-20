import { resolveFinancialOutcome } from './result-outcome'

export interface PaperBankrollRound {
  result: 'win' | 'loss'
  amount?: number
  payout?: number
  profit?: number
  multiplier?: number
  payoutMultiplier?: number
  paperBankrollEnabled?: boolean
  paperBetAmount?: number
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function applyPaperBankrollToRound<TRound extends PaperBankrollRound>(round: TRound): TRound {
  if (round.paperBankrollEnabled !== true || !isFiniteNumber(round.paperBetAmount) || round.paperBetAmount <= 0) {
    return round
  }

  const amount = isFiniteNumber(round.amount) && round.amount > 0 ? round.amount : round.paperBetAmount
  const resolvedMultiplier =
    isFiniteNumber(round.payoutMultiplier) && round.payoutMultiplier > 0
      ? round.payoutMultiplier
      : isFiniteNumber(round.multiplier) && round.multiplier > 0
        ? round.multiplier
        : null
  const payout =
    isFiniteNumber(round.payout) && round.payout > 0
      ? round.payout
      : resolvedMultiplier !== null
        ? amount * resolvedMultiplier
        : 0
  const profit = payout - amount

  return {
    ...round,
    amount,
    payout,
    profit,
    result: resolveFinancialOutcome({
      amount,
      payout,
      profit,
      existingResult: round.result
    })
  }
}
