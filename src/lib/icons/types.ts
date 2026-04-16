import { ClassName } from '@/src/types'
import type { SVGProps } from 'react'
import type { IconNameType } from './icons'
export type IconList = Record<IconNameType, { viewBox: string; symbol: string }>

export type IconName = IconNameType

export interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconNameType
  className?: ClassName
  size?: number
  color?: string
  solid?: boolean
}

export interface IconData {
  symbol: string
  set: string
  viewBox?: string
}
