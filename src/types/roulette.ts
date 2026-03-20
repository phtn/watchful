export interface EvoRouletteResult {
  number: string
}

export interface EvoMessage {
  id: string
  type: string
  args: {
    gameId: string
    code: string
    description: string
    winSpots: Record<string, unknown>
    timestamp: string
    result: EvoRouletteResult[]
  }
  time: number
}

export interface RouletteSpinResult {
  id: string
  provider: 'stake'
  source: 'evolution'
  game: 'roulette'
  eventType: 'winSpots'
  gameId: string
  code: string
  description: string
  winSpots: Record<string, unknown>
  resultNumbers: number[]
  winningNumber: number
  timestamp: number
  updatedAt: string
  url: string
}

export interface RouletteStoredData {
  results: RouletteSpinResult[]
  totalSpins: number
  latestNumber: number | null
  latestTimestamp: number | null
}

export const EMPTY_ROULETTE_STORED_DATA: RouletteStoredData = {
  results: [],
  totalSpins: 0,
  latestNumber: null,
  latestTimestamp: null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isResultNumbers(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((entry) => Number.isInteger(entry) && entry >= 0 && entry <= 36)
}

function isRouletteSpinResult(value: unknown): value is RouletteSpinResult {
  const winningNumber = isRecord(value) ? value.winningNumber : null

  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    value.provider === 'stake' &&
    value.source === 'evolution' &&
    value.game === 'roulette' &&
    value.eventType === 'winSpots' &&
    typeof value.gameId === 'string' &&
    typeof value.code === 'string' &&
    typeof value.description === 'string' &&
    isRecord(value.winSpots) &&
    isResultNumbers(value.resultNumbers) &&
    typeof winningNumber === 'number' &&
    Number.isInteger(winningNumber) &&
    winningNumber >= 0 &&
    winningNumber <= 36 &&
    isFiniteNumber(value.timestamp) &&
    typeof value.updatedAt === 'string' &&
    typeof value.url === 'string'
  )
}

export function summarizeRouletteResults(results: RouletteSpinResult[]): RouletteStoredData {
  const latestResult = results[results.length - 1] ?? null

  return {
    results,
    totalSpins: results.length,
    latestNumber: latestResult?.winningNumber ?? null,
    latestTimestamp: latestResult?.timestamp ?? null
  }
}

export function normalizeRouletteStoredData(stored: unknown): RouletteStoredData {
  if (!isRecord(stored) || !Array.isArray(stored.results)) {
    return EMPTY_ROULETTE_STORED_DATA
  }

  return summarizeRouletteResults(stored.results.filter(isRouletteSpinResult))
}

/*
Example:
{
    "id": "1774039601601-4617",
    "type": "roulette.winSpots",
    "args": {
        "gameId": "189ea79258a86b5733ad6074",
        "code": "36",
        "description": "36 Red",
        "winSpots": {},
        "timestamp": "2026-03-20T20:46:41.577Z",
        "result": [
            {
                "number": "36"
            }
        ]
    },
    "time": 1774039601601
}
*/
