import { ClassName } from '../../types'

interface HeroMetricProps {
  label: string
  value: string
  detail?: string
  className?: ClassName
}

export function HeroMetric({ label, value, detail, className }: HeroMetricProps) {
  return (
    <div className={`rounded-xl border border-white/10 bg-white/8 p-2 backdrop-blur-md ` + className}>
      <p className='text-[0.62rem] uppercase tracking-[0.26em] text-cyan-100/65'>{label}</p>
      <div className='w-full flex items-end justify-between'>
        <p className='mt-2 text-xl font-semibold text-white font-tri'>{value}</p>
        <p className='mt-1 text-xs text-slate-300'>{detail}</p>
      </div>
    </div>
  )
}
