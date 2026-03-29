import { RED_NUMBERS_SET } from '.'
import { PanelStatus } from '../../types'

export function getNumberTone(value: number | undefined): string {
  if (value === undefined) {
    return 'border-slate-200/15 bg-slate-950/78 text-slate-100'
  }
  if (value === 0) {
    return 'border-[#166958] bg-[#166958] text-white'
  }

  return RED_NUMBERS_SET.has(value)
    ? 'border-[#b51b13] bg-[#b51b13] text-white'
    : 'border-slate-200/15 bg-slate-950/78 text-slate-100'
}

function getSourceLabel(status: PanelStatus): string {
  if (!status.connected || !status.site) {
    return 'No live roulette source armed yet'
  }

  return `${status.site === 'stake' ? 'Stake' : 'bet88.ph'} connected`
}
