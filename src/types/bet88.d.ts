export type Bet88Game = 'keno' | 'limbo' | 'dice' | 'mines'

export interface Bet88<TCustom> {
  roundId: number
  win: boolean
  active: boolean
  multiplier: number
  winAmount: string
  profit: string
  playerId: number
  custom: TCustom
}

// KENO
// https://ap.blink.run/api/game/keno/bet
export interface Bet88Keno {
  drawNumbers: number[]
  numberOfMatches: number
}

// LIMBO
// https://ap.blink.run/api/game/limbo/bet
export interface Bet88Limbo {
  multiplier: number
  winningChance: number
}

// DICE
// https://ap.blink.run/api/game/dice/bet
export interface Bet88Dice {
  result: string
  winningChance: string
}

// MINES
// https://ap.blink.run/api/game/mines/play
export interface Bet88Mines {
  selected: number[]
  mines: number[]
  mineCount: number
}
