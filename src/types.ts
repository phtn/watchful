import type { HTMLProps } from 'react'
import type { Bet88, Bet88Dice, Bet88Keno, Bet88Limbo, Bet88Mines } from './types/bet88'
import type { Stake, StakeDice, StakeKeno, StakeLimbo, StakeMinesCashOut } from './types/stake'

export type ClassName = HTMLProps<HTMLElement>['className']

export type SupportedSiteKey = 'bet88' | 'stake'
export type SupportedGameKey = 'keno' | 'limbo' | 'dice' | 'mines'
export type GameOutcome = 'win' | 'loss'

export interface ResultSummary {
  totalGames: number
  wins: number
  losses: number
  winRate: number
}

export type ProviderPayload =
  | {
      provider: 'stake'
      game: 'keno'
      action: 'bet'
      response: Stake<StakeKeno>
    }
  | {
      provider: 'stake'
      game: 'limbo'
      action: 'bet'
      response: Stake<StakeLimbo>
    }
  | {
      provider: 'stake'
      game: 'dice'
      action: 'roll'
      response: Stake<StakeDice>
    }
  | {
      provider: 'stake'
      game: 'mines'
      action: 'cashout'
      response: Stake<StakeMinesCashOut>
    }
  | {
      provider: 'bet88'
      game: 'keno'
      action: 'bet'
      response: Bet88<Bet88Keno>
    }
  | {
      provider: 'bet88'
      game: 'limbo'
      action: 'bet'
      response: Bet88<Bet88Limbo>
    }
  | {
      provider: 'bet88'
      game: 'dice'
      action: 'bet'
      response: Bet88<Bet88Dice>
    }
  | {
      provider: 'bet88'
      game: 'mines'
      action: 'play'
      response: Bet88<Bet88Mines>
    }

export interface GameResult {
  id?: string
  timestamp: number
  updatedAt?: string
  result: GameOutcome
  provider: SupportedSiteKey
  game: SupportedGameKey
  action: ProviderPayload['action']
  providerData: ProviderPayload
  amount?: number
  payout?: number
  profit?: number
  currency?: string
  auto?: boolean
  active?: boolean
  roundId?: number | string
  multiplier?: number
  payoutMultiplier?: number
  winAmount?: string
  playerId?: number | string
  userName?: string
  url: string
}

export type ProviderSummaries = Record<SupportedSiteKey, ResultSummary>

export interface StoredData extends ResultSummary {
  results: GameResult[]
  providers: ProviderSummaries
}

export const EMPTY_RESULT_SUMMARY: ResultSummary = {
  totalGames: 0,
  wins: 0,
  losses: 0,
  winRate: 0
}

export const EMPTY_PROVIDER_SUMMARIES: ProviderSummaries = {
  bet88: { ...EMPTY_RESULT_SUMMARY },
  stake: { ...EMPTY_RESULT_SUMMARY }
}

export const EMPTY_STORED_DATA: StoredData = {
  results: [],
  ...EMPTY_RESULT_SUMMARY,
  providers: EMPTY_PROVIDER_SUMMARIES
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isSupportedSite(value: unknown): value is SupportedSiteKey {
  return value === 'bet88' || value === 'stake'
}

function isSupportedGame(value: unknown): value is SupportedGameKey {
  return value === 'keno' || value === 'limbo' || value === 'dice' || value === 'mines'
}

function isGameOutcome(value: unknown): value is GameOutcome {
  return value === 'win' || value === 'loss'
}

function isGameResult(value: unknown): value is GameResult {
  return (
    isRecord(value) &&
    typeof value.timestamp === 'number' &&
    typeof value.url === 'string' &&
    isGameOutcome(value.result) &&
    isSupportedSite(value.provider) &&
    isSupportedGame(value.game) &&
    isRecord(value.providerData)
  )
}

function summarizeGroup(results: GameResult[]): ResultSummary {
  const wins = results.filter((result) => result.result === 'win').length
  const totalGames = results.length
  const losses = totalGames - wins

  return {
    totalGames,
    wins,
    losses,
    winRate: totalGames > 0 ? (wins / totalGames) * 100 : 0
  }
}

export function summarizeResults(results: GameResult[]): StoredData {
  return {
    results,
    ...summarizeGroup(results),
    providers: {
      bet88: summarizeGroup(results.filter((result) => result.provider === 'bet88')),
      stake: summarizeGroup(results.filter((result) => result.provider === 'stake'))
    }
  }
}

export function normalizeStoredData(stored: unknown): StoredData {
  if (!isRecord(stored) || !Array.isArray(stored.results)) {
    return EMPTY_STORED_DATA
  }

  const results = stored.results.filter(isGameResult)
  return summarizeResults(results)
}
