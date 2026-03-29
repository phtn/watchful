import type { SupportedSiteKey } from '../types'

export interface TennisParticipant {
  name: string
  flagUrl?: string
}

export interface TennisOutcome {
  label: string
  odds: number | null
  oddsText: string
}

export interface TennisMarket {
  name: string
  outcomes: TennisOutcome[]
}

export interface TennisEvent {
  id: string
  provider: SupportedSiteKey
  sport: 'tennis'
  href: string
  statusLabel: string
  tour: string
  tournament: string
  players: TennisParticipant[]
  markets: TennisMarket[]
  timestamp: number
  updatedAt: string
  url: string
}

export interface TennisStoredData {
  events: TennisEvent[]
  totalEvents: number
  totalMarkets: number
  tournamentCount: number
  latestTimestamp: number | null
}

export const EMPTY_TENNIS_STORED_DATA: TennisStoredData = {
  events: [],
  totalEvents: 0,
  totalMarkets: 0,
  tournamentCount: 0,
  latestTimestamp: null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isParticipant(value: unknown): value is TennisParticipant {
  return isRecord(value) && typeof value.name === 'string' && (value.flagUrl === undefined || typeof value.flagUrl === 'string')
}

function isOutcome(value: unknown): value is TennisOutcome {
  return (
    isRecord(value) &&
    typeof value.label === 'string' &&
    typeof value.oddsText === 'string' &&
    (value.odds === null || (typeof value.odds === 'number' && Number.isFinite(value.odds)))
  )
}

function isMarket(value: unknown): value is TennisMarket {
  return isRecord(value) && typeof value.name === 'string' && Array.isArray(value.outcomes) && value.outcomes.every(isOutcome)
}

function isTennisEvent(value: unknown): value is TennisEvent {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    (value.provider === 'stake' || value.provider === 'bet88') &&
    value.sport === 'tennis' &&
    typeof value.href === 'string' &&
    typeof value.statusLabel === 'string' &&
    typeof value.tour === 'string' &&
    typeof value.tournament === 'string' &&
    Array.isArray(value.players) &&
    value.players.every(isParticipant) &&
    Array.isArray(value.markets) &&
    value.markets.every(isMarket) &&
    typeof value.timestamp === 'number' &&
    Number.isFinite(value.timestamp) &&
    typeof value.updatedAt === 'string' &&
    typeof value.url === 'string'
  )
}

export function summarizeTennisEvents(events: TennisEvent[]): TennisStoredData {
  const latestEvent = events.reduce<TennisEvent | null>((latest, event) => {
    if (!latest || event.timestamp > latest.timestamp) {
      return event
    }

    return latest
  }, null)

  return {
    events,
    totalEvents: events.length,
    totalMarkets: events.reduce((sum, event) => sum + event.markets.length, 0),
    tournamentCount: new Set(events.map((event) => `${event.tour}:${event.tournament}`)).size,
    latestTimestamp: latestEvent?.timestamp ?? null
  }
}

export function normalizeTennisStoredData(stored: unknown): TennisStoredData {
  if (!isRecord(stored) || !Array.isArray(stored.events)) {
    return EMPTY_TENNIS_STORED_DATA
  }

  return summarizeTennisEvents(stored.events.filter(isTennisEvent))
}
