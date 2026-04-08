import { SAMPLE_SPIN_TAPE } from '../../lib/roulette'
import type { PanelStatus } from '../../types'
import type { RouletteStoredData } from '../../types/roulette'
import { Analytics } from './RouletteAnalytics'
import { RouletteHeader } from './RouletteHeader'
import { RouletteVirtualBoard } from './RouletteVirtualBoard'

interface RouletteWorkspaceProps {
  status: PanelStatus
  stats: RouletteStoredData
  onReset: () => void
}

export function RouletteWorkspace({ status, stats, onReset }: RouletteWorkspaceProps) {
  const recentSpins = stats.results.slice(-26).reverse()
  const previewSpins = recentSpins.length > 0 ? recentSpins.map((result) => result.winningNumber) : SAMPLE_SPIN_TAPE
  const latestSpin = recentSpins[0] ?? null
  const winningNumbers = stats.results.map((result) => result.winningNumber)

  return (
    <div className='space-y-2 pb-6 bg-[#282828]'>
      <RouletteHeader stats={stats} latestSpin={latestSpin} previewSpins={previewSpins} />
      <RouletteVirtualBoard status={status} winningNumbers={winningNumbers} />
      <Analytics winningNumbers={winningNumbers} onReset={onReset} />
    </div>
  )
}
