import type { GameResult } from '../../types'
import { formatGameLabel, formatScalar } from './formatters'

export interface GameInsightTrack {
  label: string
  values: number[]
  tone: 'selected' | 'drawn'
  highlightedValues?: number[]
}

export interface GameInsights {
  chips: string[]
  tracks: GameInsightTrack[]
  risk?: string
}

export function getGameInsights(game: GameResult): GameInsights {
  const chips: string[] = []
  const tracks: GameInsightTrack[] = []

  if (game.providerData.provider === 'stake') {
    if (game.providerData.game === 'keno') {
      const selectedNumbers = game.providerData.response.state.selectedNumbers
      const drawnNumbers = game.providerData.response.state.drawnNumbers

      chips.push(`Multiplier x${formatScalar(game.providerData.response.payoutMultiplier)}`)
      tracks.push({
        label: 'Selected',
        values: selectedNumbers,
        tone: 'selected'
      })
      tracks.push({
        label: 'Drawn',
        values: drawnNumbers,
        tone: 'drawn',
        highlightedValues: selectedNumbers
      })

      return {
        chips,
        tracks,
        risk: game.providerData.response.state.risk
      }
    }

    if (game.providerData.game === 'limbo') {
      chips.push(`Target x${formatScalar(game.providerData.response.state.multiplierTarget)}`)
      chips.push(`Result x${formatScalar(game.providerData.response.state.result)}`)
      return { chips, tracks }
    }

    if (game.providerData.game === 'dice') {
      chips.push(`Roll ${formatScalar(game.providerData.response.state.result)}`)
      chips.push(
        `${formatGameLabel(game.providerData.response.state.condition)} ${formatScalar(game.providerData.response.state.target)}`
      )
      return { chips, tracks }
    }

    chips.push(`Mines ${game.providerData.response.state.minesCount}`)
    tracks.push({
      label: 'Opened',
      values: game.providerData.response.state.rounds.map((round) => round.field),
      tone: 'selected'
    })
    tracks.push({
      label: 'Mines',
      values: game.providerData.response.state.mines,
      tone: 'drawn'
    })

    return { chips, tracks }
  }

  if (game.providerData.game === 'keno') {
    chips.push(`Matches ${formatScalar(game.providerData.response.custom.numberOfMatches)}`)
    tracks.push({
      label: 'Drawn',
      values: game.providerData.response.custom.drawNumbers,
      tone: 'drawn'
    })
    return { chips, tracks }
  }

  if (game.providerData.game === 'limbo') {
    chips.push(`Result x${formatScalar(game.providerData.response.custom.multiplier)}`)
    chips.push(`Chance ${formatScalar(game.providerData.response.custom.winningChance)}`)
    return { chips, tracks }
  }

  if (game.providerData.game === 'dice') {
    chips.push(`Result ${game.providerData.response.custom.result}`)
    chips.push(`Chance ${game.providerData.response.custom.winningChance}`)
    return { chips, tracks }
  }

  tracks.push({
    label: 'Selected',
    values: game.providerData.response.custom.selected,
    tone: 'selected'
  })
  tracks.push({
    label: 'Mines',
    values: game.providerData.response.custom.mines,
    tone: 'drawn'
  })
  chips.push(`Mines ${formatScalar(game.providerData.response.custom.mineCount)}`)

  return { chips, tracks }
}
