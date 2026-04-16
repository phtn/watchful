'use client'

import { icons, type IconNameType } from '@/src/lib/icons/icons'
import type { IconData, IconProps } from '@/src/lib/icons/types'
import { memo, type FC } from 'react'
import { cn } from '../utils'

export type IconName = IconNameType

export const Icon: FC<IconProps> = memo(
  ({ name, className, size = 24, color = 'currentColor', solid = true, ...props }) => {
    const icon = icons[name] as IconData | undefined

    // graceful fallback if icon not found
    const fallback = icons['re-up.ph'] as IconData | undefined
    const svgSymbol = (icon && icon.symbol) ?? fallback?.symbol ?? ''
    const viewBox = (icon && icon.viewBox) ?? fallback?.viewBox ?? '0 0 24 24'

    // accessibility: hide from assistive tech unless an aria-label/role is provided
    const ariaHidden = !('aria-label' in props) && !('ariaLabel' in props) && !('role' in props)

    const svgElement = (
      <svg
        xmlns='http://www.w3.org/2000/svg'
        viewBox={viewBox}
        width={size}
        height={size}
        className={cn('size-4 shrink-0 m-auto', className)}
        fill={solid ? color : 'none'}
        stroke={solid ? undefined : color}
        strokeWidth={solid ? 0 : 1}
        strokeLinecap='round'
        strokeLinejoin='round'
        aria-hidden={ariaHidden}
        // keep SVG props clean
        {...props}
        dangerouslySetInnerHTML={{ __html: svgSymbol }}
      />
    )

    return <div>{svgElement}</div>
  }
)

Icon.displayName = 'Icon'
