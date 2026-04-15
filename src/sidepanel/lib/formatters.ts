import type { GameOutcome, SupportedSiteKey } from '../../types'

export function formatGameLabel(value?: string): string {
  if (!value) {
    return 'Unknown Game'
  }

  return value.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

export function formatAmount(value?: number, currency?: string): string {
  if (value === undefined) {
    return '—'
  }

  const maximumFractionDigits = Number.isInteger(value) ? 0 : 4
  const formatted = value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits
  })

  return currency ? `${formatted} ${currency.toUpperCase()}` : formatted
}

export function formatSignedAmount(value?: number, currency?: string): string {
  if (value === undefined) {
    return '—'
  }

  const sign = value > 0 ? '+' : value < 0 ? '-' : ''
  return `${sign}${formatAmount(Math.abs(value), currency)}`
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function getSiteBadgeClass(site?: SupportedSiteKey): string {
  switch (site) {
    case 'stake':
      return 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100'
    case 'bet88':
      return 'border-sky-300/20 bg-sky-300/10 text-sky-100'
    default:
      return 'border-white/10 bg-white/6 text-slate-300'
  }
}

export function getResultClass(result: GameOutcome): string {
  return result === 'win'
    ? 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100'
    : 'border-rose-300/20 bg-rose-300/10 text-rose-100'
}

export function getNetTone(value: number): string {
  if (value > 0) {
    return 'text-emerald-300'
  }

  if (value < 0) {
    return 'text-rose-300'
  }

  return 'text-slate-300'
}

export function formatScalar(value: number | string): string {
  if (typeof value === 'number') {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4
    })
  }

  return value
}
