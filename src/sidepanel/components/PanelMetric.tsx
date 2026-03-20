interface PanelMetricProps {
  label: string
  value: string
  tone: string
}

export function PanelMetric({ label, value, tone }: PanelMetricProps) {
  return (
    <div className='rounded-[14.01px] border border-slate-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,247,250,0.88))] p-1'>
      <p className='text-[0.62rem] uppercase tracking-[0.24em] text-slate-500'>{label}</p>
      <p className={`text-lg font-semibold ${tone}`}>{value}</p>
    </div>
  )
}
