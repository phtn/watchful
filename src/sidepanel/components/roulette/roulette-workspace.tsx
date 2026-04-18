import { useState } from 'react'
import { KimQuadrantId, KIMS_ALGO_QUADRANTS, SAMPLE_SPIN_TAPE } from '../../../lib/roulette'
import type { PanelStatus } from '../../../types'
import type { RouletteStoredData } from '../../../types/roulette'
import { Analytics } from './roulette-analytics'
import { RouletteHeader } from './roulette-header'
import { RouletteVirtualBoard } from './roulette-virtual-board'

interface RouletteWorkspaceProps {
  status: PanelStatus
  stats: RouletteStoredData
  evolutionChips: number[]
  evolutionRebetVisible: boolean
  evolutionBettingOpen: boolean
  onReset: () => void
}

export function RouletteWorkspace({ status, stats, evolutionChips, evolutionRebetVisible, evolutionBettingOpen, onReset }: RouletteWorkspaceProps) {
  const [startingQuadrant, setStartingQuadrant] = useState<KimQuadrantId>('q1')
  const [hoveredQuadrant, setHoveredQuadrant] = useState<KimQuadrantId | null>(null)
  const [selectedStartingQuadrantNumbers, setSelectedStartingQuadrantNumbers] = useState<Set<number>>(new Set())
  const [hoveredQuadrantNumbers, setHoveredQuadrantNumbers] = useState<Set<number>>(new Set())
  const recentSpins = stats.results.slice(-26).reverse()
  const previewSpins = recentSpins.length > 0 ? recentSpins.map((result) => result.winningNumber) : SAMPLE_SPIN_TAPE

  const handleQuadrantClick = (quadrant: KimQuadrantId) => {
    setStartingQuadrant(quadrant)
    const numbers = new Set(KIMS_ALGO_QUADRANTS[quadrant])
    setSelectedStartingQuadrantNumbers(numbers)
  }

  const handleQuadrantHover = (quadrant: KimQuadrantId | null) => {
    setHoveredQuadrant(quadrant)
    if (quadrant) {
      const numbers = new Set(KIMS_ALGO_QUADRANTS[quadrant])
      setHoveredQuadrantNumbers(numbers)
    } else {
      setHoveredQuadrantNumbers(new Set())
    }
  }
  const latestSpin = recentSpins[0] ?? null
  const winningNumbers = stats.results.map((result) => result.winningNumber)

  return (
    <div className='space-y-2 pb-6 bg-[#282828]'>
      <RouletteHeader stats={stats} latestSpin={latestSpin} previewSpins={previewSpins} />
      <RouletteVirtualBoard status={status} winningNumbers={winningNumbers} evolutionChips={evolutionChips} evolutionRebetVisible={evolutionRebetVisible} evolutionBettingOpen={evolutionBettingOpen} />
      <Analytics winningNumbers={winningNumbers} onReset={onReset} />
    </div>
  )
}
