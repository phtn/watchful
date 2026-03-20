import type { ResultSummary } from '../../types'

interface ProviderMetricProps {
  label: string
  summary: ResultSummary
  tone: string
}

export function ProviderMetric({ label, summary, tone }: ProviderMetricProps) {
  return (
    <div className={`rounded-[22px] border p-4 ${tone}`}>
      <p className='text-[0.62rem] uppercase tracking-[0.22em]'>{label}</p>
      <p className='mt-2 text-lg font-semibold'>{summary.totalGames} rounds</p>
      <p className='mt-1 text-xs opacity-80'>{summary.winRate.toFixed(1)}% win rate</p>
    </div>
  )
}
