export type StakeGame = 'keno' | 'limbo' | 'dice' | 'mines'
export type StakeAction = 'bet' | 'roll' | 'next' | 'cashout'

export interface StakeUser {
  id: string
  name: string
}

export interface Stake<TState> {
  id: string
  active: boolean
  currency: string
  amountMultiplier: number
  payoutMultiplier: number
  amount: number
  payout: number
  updatedAt: string
  game: StakeGame
  user: StakeUser
  state: TState
}

// KENO
// https://stake.com/_api/casino/keno/bet
export interface StakeKeno {
  risk: string
  drawnNumbers: number[]
  selectedNumbers: number[]
}

// LIMBO
// https://stake.com/_api/casino/limbo/bet
export interface StakeLimbo {
  result: number
  multiplierTarget?: number
}

// DICE
// https://stake.com/_api/casino/dice/roll
export interface StakeDice {
  result: number
  target: number
  condition: string
}

export interface StakeMinesRound {
  field: number
  payoutMultiplier: number
}

// MINES
// https://stake.com/_api/casino/mines/bet
export interface StakeMinesBet {
  rounds: unknown[]
  minesCount: number
  mines: null
}

// MINES
// https://stake.com/_api/casino/mines/next
export interface StakeMinesNext {
  rounds: StakeMinesRound[]
  minesCount: number
  mines: null
}

// MINES
// https://stake.com/_api/casino/mines/cashout
export interface StakeMinesCashOut {
  rounds: StakeMinesRound[]
  minesCount: number
  mines: number[]
}
