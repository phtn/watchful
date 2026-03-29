import { ReactNode } from 'react'
import { ClassName } from '../../types'

export interface JunctionBoxProps {
  label: string
  value: string
  action: ReactNode
  className?: ClassName
}
export function JunctionBox({ label, value, action, className }: JunctionBoxProps) {
  return (
    <div className={`rounded-lg border-[0.5px] border-white/10 bg-white/8 px-2.5 pt-2 backdrop-blur-md ` + className}>
      <p className='text-[0.62rem] uppercase tracking-[0.26em] text-cyan-100/65'>{label}</p>
      <div className='mt-2 w-full flex items-end justify-between'>
        <p className='text-lg font-semibold text-white font-tri'>{value}</p>
        {action}
      </div>
    </div>
  )
}
