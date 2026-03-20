import type { GameResult, VirtualBankrollState } from '../types'

export interface VirtualBankrollSnapshot {
  currentBalance: number
  profitLoss: number
  totalReplenished: number
  trackedGames: number
  trackingStartedAt: number | null
  baseBetAmount: number
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function getEffectiveAmount(result: GameResult, fallbackBetAmount: number): number {
  if (isFiniteNumber(result.amount) && result.amount > 0) {
    return result.amount
  }

  return fallbackBetAmount > 0 ? fallbackBetAmount : 0
}

function getGameProfit(result: GameResult, fallbackBetAmount: number): number {
  const effectiveAmount = getEffectiveAmount(result, fallbackBetAmount)

  if (isFiniteNumber(result.payout)) {
    return result.payout - effectiveAmount
  }

  if (isFiniteNumber(result.profit) && isFiniteNumber(result.amount) && result.amount > 0) {
    return result.profit
  }

  return result.result === 'win' ? 0 : -effectiveAmount
}

export function deriveVirtualBankroll(bankroll: VirtualBankrollState, results: GameResult[]): VirtualBankrollSnapshot {
  if (!bankroll.enabled || bankroll.trackingStartedAt === null) {
    return {
      currentBalance: bankroll.seedBalance,
      profitLoss: 0,
      totalReplenished: bankroll.replenishedTotal,
      trackedGames: 0,
      trackingStartedAt: bankroll.trackingStartedAt,
      baseBetAmount: bankroll.baseBetAmount
    }
  }

  const trackedResults = results.filter((result) => result.timestamp >= bankroll.trackingStartedAt!)
  const profitLoss = trackedResults.reduce((sum, result) => sum + getGameProfit(result, bankroll.baseBetAmount), 0)

  return {
    currentBalance: bankroll.seedBalance + bankroll.replenishedTotal + profitLoss,
    profitLoss,
    totalReplenished: bankroll.replenishedTotal,
    trackedGames: trackedResults.length,
    trackingStartedAt: bankroll.trackingStartedAt,
    baseBetAmount: bankroll.baseBetAmount
  }
}
