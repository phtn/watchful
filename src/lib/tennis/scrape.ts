import type { SupportedSiteKey } from '../../types'
import type { TennisEvent, TennisMarket, TennisOutcome, TennisParticipant } from '../../types/tennis'

const TENNIS_EVENT_SELECTOR = 'a[data-editor-id="eventCardContent"][href*="/tennis/"]'

const ACRONYM_TOKENS = new Set(['atp', 'wta', 'itf', 'usa', 'uk', 'u20', 'u18'])

function normalizeText(value: string | null | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim()
}

function toAbsoluteUrl(value: string, pageUrl: string): string {
  try {
    return new URL(value, pageUrl).href
  } catch {
    return value
  }
}

function parseOddsValue(value: string): number | null {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function titleizeSlug(value: string): string {
  return value
    .split('-')
    .filter(Boolean)
    .map((token) => {
      if (ACRONYM_TOKENS.has(token.toLowerCase()) || token.length <= 3) {
        return token.toUpperCase()
      }

      return token.charAt(0).toUpperCase() + token.slice(1)
    })
    .join(' ')
}

function getHrefParts(anchor: HTMLAnchorElement): { tour: string; tournament: string } {
  const rawHref = anchor.getAttribute('href') ?? ''
  const parts = rawHref.split('/').filter(Boolean)

  return {
    tour: titleizeSlug(parts[1] ?? 'tennis'),
    tournament: titleizeSlug(parts[2] ?? 'live board')
  }
}

function getCategoryTextParts(anchor: HTMLAnchorElement): string[] {
  const category = anchor.previousElementSibling?.querySelector('[data-editor-id="eventCardCategory"]')
  if (!category) {
    return []
  }

  return Array.from(category.querySelectorAll('span'))
    .flatMap((element) =>
      Array.from(element.childNodes)
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => normalizeText(node.textContent))
    )
    .filter(Boolean)
}

function getParticipants(anchor: HTMLAnchorElement, pageUrl: string): TennisParticipant[] {
  const participantsFromFlags = Array.from(
    anchor.querySelectorAll<HTMLImageElement>('img[src*="/flags_by_code/"]')
  ).reduce<TennisParticipant[]>((participants, image) => {
    const name = normalizeText(image.parentElement?.nextElementSibling?.textContent)
    if (!name) {
      return participants
    }

    participants.push({
      name,
      flagUrl: image.getAttribute('src') ? toAbsoluteUrl(image.getAttribute('src')!, pageUrl) : undefined
    })

    return participants
  }, [])

  if (participantsFromFlags.length >= 2) {
    return participantsFromFlags
  }

  const statusLabel = normalizeText(anchor.querySelector('[data-editor-id="eventCardStatusLabel"]')?.textContent)
  const fallbackNames = Array.from(anchor.querySelectorAll('div'))
    .filter((element) => element.children.length === 0)
    .map((element) => normalizeText(element.textContent))
    .filter((text) => Boolean(text) && text !== statusLabel)
    .filter((text) => !/^(today|tomorrow|live|starting|suspended|closed)/i.test(text))
    .filter((text) => !/^\d{1,2}:\d{2}$/.test(text))
    .filter((text, index, values) => values.indexOf(text) === index)
    .slice(0, 2)

  return fallbackNames.map((name, index) => ({
    name,
    flagUrl: participantsFromFlags[index]?.flagUrl
  }))
}

function getMarketBlocks(anchor: HTMLAnchorElement): Element[] {
  const container = anchor.parentElement?.parentElement
  if (!container) {
    const marketRail = anchor.nextElementSibling
    if (!marketRail) {
      return []
    }

    return Array.from(marketRail.querySelectorAll('[data-editor-id="eventCard"]'))
      .map((titleCard) => titleCard.parentElement)
      .filter((parent): parent is HTMLElement => parent instanceof HTMLElement)
      .filter((parent) => parent.querySelectorAll('[data-editor-id="outcomePlate"]').length > 0)
  }

  return Array.from(container.querySelectorAll('[data-editor-id="eventCard"]'))
    .map((titleCard) => titleCard.parentElement)
    .filter((parent): parent is HTMLElement => parent instanceof HTMLElement)
    .filter((parent) => parent.querySelectorAll('[data-editor-id="outcomePlate"]').length > 0)
}

function getMarkets(anchor: HTMLAnchorElement): TennisMarket[] {
  const marketBlocks = getMarketBlocks(anchor)
  const seenNames = new Set<string>()

  return marketBlocks
    .map((block) => {
      const title = normalizeText(block.querySelector('[data-editor-id="eventCard"]')?.textContent)
      if (!title || seenNames.has(title)) {
        return null
      }

      const outcomes = Array.from(block.querySelectorAll('[data-editor-id="outcomePlate"]'))
        .map((plate) => {
          const label = normalizeText(plate.querySelector('[data-editor-id="outcomePlateName"]')?.textContent)
          const oddsText = normalizeText(plate.querySelector('.bt196')?.textContent)
          if (!label || !oddsText) {
            return null
          }

          return {
            label,
            odds: parseOddsValue(oddsText),
            oddsText
          } satisfies TennisOutcome
        })
        .filter((outcome): outcome is TennisOutcome => outcome !== null)

      if (outcomes.length === 0) {
        return null
      }

      seenNames.add(title)
      return { name: title, outcomes } satisfies TennisMarket
    })
    .filter((market): market is TennisMarket => market !== null)
}

function getEventId(anchor: HTMLAnchorElement): string {
  const href = anchor.getAttribute('href') ?? ''
  const match = href.match(/(\d+)(?:\/)?$/)
  return match?.[1] ?? href
}

function parseTennisEvent(anchor: HTMLAnchorElement, pageUrl: string, provider: SupportedSiteKey): TennisEvent | null {
  const href = anchor.getAttribute('href')
  if (!href) {
    return null
  }

  const categoryParts = getCategoryTextParts(anchor)
  const hrefParts = getHrefParts(anchor)
  const players = getParticipants(anchor, pageUrl)
  const markets = getMarkets(anchor)

  if (players.length < 2) {
    return null
  }

  const timestamp = Date.now()

  return {
    id: getEventId(anchor),
    provider,
    sport: 'tennis',
    href: toAbsoluteUrl(href, pageUrl),
    statusLabel: normalizeText(anchor.querySelector('[data-editor-id="eventCardStatusLabel"]')?.textContent),
    tour: categoryParts[0] ?? hrefParts.tour,
    tournament: categoryParts[1] ?? hrefParts.tournament,
    players,
    markets,
    timestamp,
    updatedAt: new Date(timestamp).toISOString(),
    url: pageUrl
  }
}

export function hasTennisSurface(root: ParentNode): boolean {
  return root.querySelector('[data-cy="sport-tennis"]') !== null || root.querySelector(TENNIS_EVENT_SELECTOR) !== null
}

export function extractTennisEvents(root: ParentNode, pageUrl: string, provider: SupportedSiteKey): TennisEvent[] {
  const events = Array.from(root.querySelectorAll<HTMLAnchorElement>(TENNIS_EVENT_SELECTOR))
    .map((anchor) => parseTennisEvent(anchor, pageUrl, provider))
    .filter((event): event is TennisEvent => event !== null)

  const deduped = new Map<string, TennisEvent>()
  events.forEach((event) => {
    deduped.set(event.id, event)
  })

  return Array.from(deduped.values())
}
