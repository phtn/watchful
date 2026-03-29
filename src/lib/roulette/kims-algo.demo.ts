import { KIMS_ALGO_ASSUMPTIONS, simulateKimsAlgo, type KimAlgoSimulation } from './kims-algo'
import { KIMS_ALGO_SCENARIOS } from './kims-algo.scenarios'

function printSimulation(simulation: KimAlgoSimulation, label: string): void {
  console.log(`\n=== ${label} ===`)
  console.log(
    `Start: quadrant ${simulation.options.startingQuadrant}, base unit ${simulation.options.baseUnit}, next state -> round ${simulation.finalState.nextRound} on ${simulation.finalState.nextQuadrant} with [${simulation.finalState.nextQuadrants.join(', ')}]`
  )

  const rows = simulation.steps.map((step) => ({
    spin: step.spinIndex,
    landed: step.landedNumber,
    round: step.bet.round,
    quadrant: step.bet.quadrant,
    quadrants: `[${step.bet.quadrants.join(', ')}]`,
    bet: `[${step.bet.numbers.join(', ')}]`,
    coverage: `${step.bet.coverageCount}/37 (${step.bet.coveragePercent.toFixed(2)}%)`,
    unit: step.bet.unitStake,
    zero: step.bet.zeroStake,
    total: step.bet.totalStake,
    hit: step.hitType,
    outcome: step.sessionOutcome,
    candidates: step.selection.candidateQuadrants.join(', ') || '-',
    next: `${step.nextQuadrant} / r${step.nextRound}`
  }))

  console.table(rows)
}

console.log("Kim's Algo implementation demo")
console.log('\nWhat it is trying to achieve:')
console.log(
  '- Track a rolling 2x2 quadrant sequence on the European layout, add the next qualifying quadrant after each miss, and reset the sequence on a hit or after a full 5-round miss.'
)
console.log('- Add a zero hedge only on rounds 4 and 5.')
console.log(
  '- Grow coverage by round to 4, 8, 12, 17, and 21 slots out of 37, with stake multipliers of x2 on round 3, x4 on round 4, and x8 on round 5.'
)

console.log('\nAssumptions used in this implementation:')
for (const assumption of KIMS_ALGO_ASSUMPTIONS) {
  console.log(`- ${assumption}`)
}

for (const scenario of KIMS_ALGO_SCENARIOS) {
  const simulation = simulateKimsAlgo(scenario.spins, {
    startingQuadrant: scenario.startingQuadrant,
    baseUnit: scenario.baseUnit
  })

  printSimulation(simulation, scenario.label)
}
