import { useMemo } from 'react'
import { ClassName } from '../../types'

export interface Metric {
  label: string
  value: string
  detail?: string
  className?: ClassName
}

export function HeroMetric({ label, value, detail, className }: Metric) {
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

interface CompactMetricProps {
  data: Array<Metric & { id: string }>
  className?: ClassName
}

export function CompactMetric({ data, className }: CompactMetricProps) {
  const cols = useMemo(() => {
    switch (data.length) {
      case 2:
        return 'grid-cols-2'
      case 3:
        return 'grid-cols-3'
      case 4:
        return 'grid-cols-4'
      default:
        return 'grid-cols-1'
    }
  }, [data])
  return (
    <div
      className={
        `rounded-xl border border-white/10 bg-zinc-800 p-2 backdrop-blur-md grid grid-cols-2 ${cols} gap-2 ` + className
      }>
      {data.map((metric) => (
        <div key={metric.id} className='not-last:border-r border-white'>
          <p className='text-[0.62rem] uppercase tracking-[0.26em] text-cyan-100/65'>{metric.label}</p>
          <div className='mt-1 w-full flex items-end justify-between'>
            <p className='text-xl font-semibold text-white font-tri'>{metric.value}</p>
            <p className='mt-1 text-xs text-slate-300'>{metric.detail}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
