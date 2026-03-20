import { normalizeStoredData, summarizeResults, type GameResult, type SupportedGameKey } from '../types'
import type { Bet88, Bet88Dice, Bet88Keno, Bet88Limbo, Bet88Mines } from '../types/bet88'
import type {
  Stake,
  StakeDice,
  StakeKeno,
  StakeLimbo,
  StakeMinesBet,
  StakeMinesCashOut,
  StakeMinesNext
} from '../types/stake'
import { getSupportedSite } from './siteConfig'

interface InterceptedNetworkPayload {
  url: string
  method: string
  status: number
  data: unknown
  requestBody?: unknown
  timestamp: number
}

type UnknownRecord = Record<string, unknown>
type StakeAction = 'bet' | 'roll' | 'next' | 'cashout'
type Bet88Action = 'bet' | 'play'

const script = document.createElement('script')
script.src = chrome.runtime.getURL('dist/injected.js')
script.onload = function () {
  script.remove()
}
;(document.head || document.documentElement).appendChild(script)

window.addEventListener('message', async (event: MessageEvent) => {
  if (event.source !== window || event.data?.type !== 'CASINO_RESPONSE') {
    return
  }

  const responseData = event.data.data as InterceptedNetworkPayload
  await processGameResult(responseData)
})

async function processGameResult(responseData: InterceptedNetworkPayload): Promise<void> {
  try {
    const result = parseGameResult(responseData)

    if (!result) {
      return
    }

    await saveGameResult(result)
    console.log('Casino game result saved:', result)
  } catch (error) {
    console.error('Error processing game result:', error)
  }
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isSupportedGameKey(value: unknown): value is SupportedGameKey {
  return value === 'keno' || value === 'limbo' || value === 'dice' || value === 'mines'
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return undefined
}

function getStoredPort(value: unknown): number {
  return toNumber(value) ?? 3000
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'number' && Number.isFinite(entry))
}

function parseTimestamp(value: unknown): number | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? undefined : timestamp
}

function isStakeBase(value: unknown): value is Stake<unknown> {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.active === 'boolean' &&
    typeof value.currency === 'string' &&
    typeof value.amountMultiplier === 'number' &&
    typeof value.payoutMultiplier === 'number' &&
    typeof value.amount === 'number' &&
    typeof value.payout === 'number' &&
    typeof value.updatedAt === 'string' &&
    isSupportedGameKey(value.game) &&
    isRecord(value.user) &&
    typeof value.user.id === 'string' &&
    typeof value.user.name === 'string' &&
    isRecord(value.state)
  )
}

function isStakeKenoState(value: unknown): value is StakeKeno {
  return (
    isRecord(value) &&
    typeof value.risk === 'string' &&
    isNumberArray(value.drawnNumbers) &&
    isNumberArray(value.selectedNumbers)
  )
}

function isStakeLimboState(value: unknown): value is StakeLimbo {
  return isRecord(value) && typeof value.result === 'number' && typeof value.multiplierTarget === 'number'
}

function isStakeDiceState(value: unknown): value is StakeDice {
  return (
    isRecord(value) &&
    typeof value.result === 'number' &&
    typeof value.target === 'number' &&
    typeof value.condition === 'string'
  )
}

function isStakeMinesRound(value: unknown): value is { field: number; payoutMultiplier: number } {
  return isRecord(value) && typeof value.field === 'number' && typeof value.payoutMultiplier === 'number'
}

function isStakeMinesBetState(value: unknown): value is StakeMinesBet {
  return isRecord(value) && Array.isArray(value.rounds) && typeof value.minesCount === 'number' && value.mines === null
}

function isStakeMinesNextState(value: unknown): value is StakeMinesNext {
  return (
    isRecord(value) &&
    Array.isArray(value.rounds) &&
    value.rounds.every(isStakeMinesRound) &&
    typeof value.minesCount === 'number' &&
    value.mines === null
  )
}

function isStakeMinesCashOutState(value: unknown): value is StakeMinesCashOut {
  return (
    isRecord(value) &&
    Array.isArray(value.rounds) &&
    value.rounds.every(isStakeMinesRound) &&
    typeof value.minesCount === 'number' &&
    isNumberArray(value.mines)
  )
}

function isBet88Base(value: unknown): value is Bet88<unknown> {
  return (
    isRecord(value) &&
    typeof value.roundId === 'number' &&
    typeof value.win === 'boolean' &&
    typeof value.active === 'boolean' &&
    typeof value.multiplier === 'number' &&
    typeof value.winAmount === 'string' &&
    typeof value.profit === 'string' &&
    typeof value.playerId === 'number' &&
    isRecord(value.custom)
  )
}

function isBet88KenoCustom(value: unknown): value is Bet88Keno {
  return isRecord(value) && isNumberArray(value.drawNumbers) && typeof value.numberOfMatches === 'number'
}

function isBet88LimboCustom(value: unknown): value is Bet88Limbo {
  return isRecord(value) && typeof value.multiplier === 'number' && typeof value.winningChance === 'number'
}

function isBet88DiceCustom(value: unknown): value is Bet88Dice {
  return isRecord(value) && typeof value.result === 'string' && typeof value.winningChance === 'string'
}

function isBet88MinesCustom(value: unknown): value is Bet88Mines {
  return (
    isRecord(value) &&
    isNumberArray(value.selected) &&
    isNumberArray(value.mines) &&
    typeof value.mineCount === 'number'
  )
}

function inferBet88Game(custom: unknown): SupportedGameKey | null {
  if (isBet88KenoCustom(custom)) {
    return 'keno'
  }

  if (isBet88LimboCustom(custom)) {
    return 'limbo'
  }

  if (isBet88DiceCustom(custom)) {
    return 'dice'
  }

  if (isBet88MinesCustom(custom)) {
    return 'mines'
  }

  return null
}

function findMatchingRecord<T>(value: unknown, matcher: (candidate: unknown) => candidate is T, depth = 0): T | null {
  if (matcher(value)) {
    return value
  }

  if (!isRecord(value) || depth >= 4) {
    return null
  }

  for (const nestedValue of Object.values(value)) {
    const match = findMatchingRecord(nestedValue, matcher, depth + 1)
    if (match) {
      return match
    }
  }

  return null
}

function extractStakePayload(payload: InterceptedNetworkPayload): Stake<unknown> | null {
  const candidates = [payload.data, payload.requestBody]

  for (const candidate of candidates) {
    const match = findMatchingRecord(candidate, isStakeBase)
    if (match) {
      return match
    }
  }

  return null
}

function extractBet88Payload(payload: InterceptedNetworkPayload): Bet88<unknown> | null {
  const candidates = [payload.data, isRecord(payload.data) ? payload.data.data : undefined]

  for (const candidate of candidates) {
    if (isBet88Base(candidate)) {
      return candidate
    }
  }

  return null
}

function detectStakeRoute(url: string, providerData: Stake<unknown>): { game: SupportedGameKey; action: StakeAction } {
  const match = url.toLowerCase().match(/\/casino\/(keno|limbo|dice|mines)\/(bet|roll|next|cashout)\b/)
  if (match && isSupportedGameKey(match[1])) {
    return {
      game: match[1],
      action: match[2] as StakeAction
    }
  }

  if (providerData.game === 'dice') {
    return { game: 'dice', action: 'roll' }
  }

  if (providerData.game === 'mines') {
    if (isStakeMinesCashOutState(providerData.state)) {
      return { game: 'mines', action: 'cashout' }
    }

    if (isStakeMinesNextState(providerData.state)) {
      return { game: 'mines', action: 'next' }
    }
  }

  return {
    game: providerData.game,
    action: 'bet'
  }
}

function detectBet88Route(
  url: string,
  providerData: Bet88<unknown>
): { game: SupportedGameKey; action: Bet88Action } | null {
  const match = url.toLowerCase().match(/\/game\/(keno|limbo|dice|mines)\/(bet|play)\b/)
  if (match && isSupportedGameKey(match[1])) {
    return {
      game: match[1],
      action: match[2] as Bet88Action
    }
  }

  const inferredGame = inferBet88Game(providerData.custom)
  if (!inferredGame) {
    return null
  }

  return {
    game: inferredGame,
    action: inferredGame === 'mines' ? 'play' : 'bet'
  }
}

function parseStakeResult(payload: InterceptedNetworkPayload): GameResult | null {
  const providerData = extractStakePayload(payload)
  if (!providerData || providerData.active) {
    return null
  }

  const route = detectStakeRoute(payload.url, providerData)
  const result: GameResult['result'] = providerData.payout > 0 || providerData.payoutMultiplier > 0 ? 'win' : 'loss'
  const baseResult = {
    id: providerData.id,
    timestamp: parseTimestamp(providerData.updatedAt) ?? payload.timestamp ?? Date.now(),
    updatedAt: providerData.updatedAt,
    result,
    provider: 'stake' as const,
    game: route.game,
    amount: providerData.amount,
    payout: providerData.payout,
    profit: providerData.payout - providerData.amount,
    currency: providerData.currency,
    active: providerData.active,
    roundId: providerData.id,
    multiplier: providerData.payoutMultiplier,
    payoutMultiplier: providerData.payoutMultiplier,
    userName: providerData.user.name,
    url: window.location.href
  }

  switch (route.game) {
    case 'keno':
      if (route.action !== 'bet' || !isStakeKenoState(providerData.state)) {
        return null
      }

      return {
        ...baseResult,
        action: 'bet',
        providerData: {
          provider: 'stake',
          game: 'keno',
          action: 'bet',
          response: {
            ...providerData,
            state: providerData.state
          }
        }
      }

    case 'limbo':
      if (route.action !== 'bet' || !isStakeLimboState(providerData.state)) {
        return null
      }

      return {
        ...baseResult,
        action: 'bet',
        providerData: {
          provider: 'stake',
          game: 'limbo',
          action: 'bet',
          response: {
            ...providerData,
            state: providerData.state
          }
        }
      }

    case 'dice':
      if (route.action !== 'roll' || !isStakeDiceState(providerData.state)) {
        return null
      }

      return {
        ...baseResult,
        action: 'roll',
        providerData: {
          provider: 'stake',
          game: 'dice',
          action: 'roll',
          response: {
            ...providerData,
            state: providerData.state
          }
        }
      }

    case 'mines':
      if (route.action === 'cashout' && isStakeMinesCashOutState(providerData.state)) {
        return {
          ...baseResult,
          action: 'cashout',
          providerData: {
            provider: 'stake',
            game: 'mines',
            action: 'cashout',
            response: {
              ...providerData,
              state: providerData.state
            }
          }
        }
      }

      return null
  }
}

function parseBet88Result(payload: InterceptedNetworkPayload): GameResult | null {
  const providerData = extractBet88Payload(payload)
  if (!providerData) {
    return null
  }

  const route = detectBet88Route(payload.url, providerData)
  if (!route) {
    return null
  }

  const requestBody = isRecord(payload.requestBody) ? payload.requestBody : null
  const amount = toNumber(requestBody?.amount) ?? toNumber(providerData.profit) ?? toNumber(providerData.winAmount)
  const payout = toNumber(providerData.winAmount)
  const profit =
    toNumber(providerData.profit) ?? (payout !== undefined && amount !== undefined ? payout - amount : undefined)
  const result: GameResult['result'] = providerData.win ? 'win' : 'loss'

  const baseResult = {
    timestamp: payload.timestamp ?? Date.now(),
    result,
    provider: 'bet88' as const,
    game: route.game,
    action: route.action,
    amount,
    payout,
    profit,
    currency: typeof requestBody?.currency === 'string' ? requestBody.currency : undefined,
    auto: typeof requestBody?.auto === 'boolean' ? requestBody.auto : undefined,
    roundId: providerData.roundId,
    active: providerData.active,
    multiplier: providerData.multiplier,
    winAmount: providerData.winAmount,
    playerId: providerData.playerId,
    url: window.location.href
  }

  switch (route.game) {
    case 'keno':
      if (!isBet88KenoCustom(providerData.custom)) {
        return null
      }

      return {
        ...baseResult,
        providerData: {
          provider: 'bet88',
          game: 'keno',
          action: 'bet',
          response: {
            ...providerData,
            custom: providerData.custom
          }
        }
      }

    case 'limbo':
      if (!isBet88LimboCustom(providerData.custom)) {
        return null
      }

      return {
        ...baseResult,
        providerData: {
          provider: 'bet88',
          game: 'limbo',
          action: 'bet',
          response: {
            ...providerData,
            custom: providerData.custom
          }
        }
      }

    case 'dice':
      if (!isBet88DiceCustom(providerData.custom)) {
        return null
      }

      return {
        ...baseResult,
        providerData: {
          provider: 'bet88',
          game: 'dice',
          action: 'bet',
          response: {
            ...providerData,
            custom: providerData.custom
          }
        }
      }

    case 'mines':
      if (route.action !== 'play' || !isBet88MinesCustom(providerData.custom)) {
        return null
      }

      return {
        ...baseResult,
        providerData: {
          provider: 'bet88',
          game: 'mines',
          action: 'play',
          response: {
            ...providerData,
            custom: providerData.custom
          }
        }
      }
  }
}

function parseGameResult(payload: InterceptedNetworkPayload): GameResult | null {
  const pageSite = getSupportedSite(window.location.href)?.key

  if (pageSite === 'stake') {
    return parseStakeResult(payload) ?? parseBet88Result(payload)
  }

  if (pageSite === 'bet88') {
    return parseBet88Result(payload) ?? parseStakeResult(payload)
  }

  return parseBet88Result(payload) ?? parseStakeResult(payload)
}

async function getDevServerPort(): Promise<number> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['devServerPort'], (data) => {
      resolve(getStoredPort(data.devServerPort))
    })
  })
}

async function sendToDevServer(result: GameResult, port: number): Promise<void> {
  try {
    const response = await fetch(`http://localhost:${port}/api/results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(result)
    })

    if (!response.ok) {
      console.warn(`Dev server responded with status ${response.status}`)
    }
  } catch (error) {
    console.debug('Dev server not available:', error)
  }
}

function findExistingResultIndex(results: GameResult[], candidate: GameResult): number {
  return results.findIndex((entry) => {
    if (
      candidate.id &&
      entry.id &&
      candidate.provider === entry.provider &&
      candidate.game === entry.game &&
      candidate.action === entry.action
    ) {
      return entry.id === candidate.id
    }

    if (
      candidate.roundId !== undefined &&
      entry.roundId !== undefined &&
      candidate.provider === entry.provider &&
      candidate.game === entry.game &&
      candidate.action === entry.action
    ) {
      return entry.roundId === candidate.roundId
    }

    return false
  })
}

async function saveGameResult(result: GameResult): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['casinoResults'], async (data) => {
      const stored = normalizeStoredData(data.casinoResults)
      let results = [...stored.results]

      const existingResultIndex = findExistingResultIndex(results, result)
      if (existingResultIndex >= 0) {
        results[existingResultIndex] = result
      } else {
        results.push(result)
      }

      if (results.length > 1000) {
        results = results.slice(-1000)
      }

      const nextStored = summarizeResults(results)

      chrome.storage.local.set({ casinoResults: nextStored }, async () => {
        const port = await getDevServerPort()
        await sendToDevServer(result, port)
        resolve()
      })
    })
  })
}
