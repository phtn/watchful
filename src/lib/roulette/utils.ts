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
    ? 'border-[#89211d] bg-[#89211d] text-neutral-50'
    : 'border-black/50 bg-black text-slate-200'
}

function getSourceLabel(status: PanelStatus): string {
  if (!status.connected || !status.site) {
    return 'No live roulette source armed yet'
  }

  return `${status.site === 'stake' ? 'Stake' : 'bet88.ph'} connected`
}
