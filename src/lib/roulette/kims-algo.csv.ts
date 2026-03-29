import { simulateKimsAlgo } from './kims-algo'
import { KIMS_ALGO_SCENARIOS } from './kims-algo.scenarios'

const CSV_HEADERS = [
  'scenario',
  'starting_quadrant',
  'base_unit',
  'spin_index',
  'landed_number',
  'round',
  'active_quadrants',
  'bet_numbers',
  'placement_count',
  'coverage_percent',
  'unit_stake',
  'zero_stake',
  'total_stake',
  'hit',
  'hit_type',
  'session_outcome',
  'candidate_quadrants',
  'selected_quadrant',
  'next_round',
  'next_quadrant',
  'next_quadrants'
] as const

function escapeCsvCell(value: string | number | boolean): string {
  const stringValue = String(value)

  if (!/[",\n]/.test(stringValue)) {
    return stringValue
  }

  return `"${stringValue.replace(/"/g, '""')}"`
}

function joinList(values: readonly (string | number)[]): string {
  return values.join(' ')
}

function buildCsv(): string {
  const rows: Array<Array<string | number | boolean>> = [Array.from(CSV_HEADERS)]

  for (const scenario of KIMS_ALGO_SCENARIOS) {
    const simulation = simulateKimsAlgo(scenario.spins, {
      startingQuadrant: scenario.startingQuadrant,
      baseUnit: scenario.baseUnit
    })

    for (const step of simulation.steps) {
      rows.push([
        scenario.label,
        scenario.startingQuadrant,
        scenario.baseUnit,
        step.spinIndex,
        step.landedNumber,
        step.bet.round,
        joinList(step.bet.quadrants),
        joinList(step.bet.numbers),
        step.bet.coverageCount,
        step.bet.coveragePercent.toFixed(2),
        step.bet.unitStake,
        step.bet.zeroStake,
        step.bet.totalStake,
        step.hit,
        step.hitType,
        step.sessionOutcome,
        joinList(step.selection.candidateQuadrants),
        step.selection.selectedQuadrant ?? '',
        step.nextRound,
        step.nextQuadrant,
        joinList(step.nextQuadrants)
      ])
    }
  }

  return rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n')
}

console.log(buildCsv())
