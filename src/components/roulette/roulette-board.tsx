// import { PropsWithChildren } from 'react'
// import {
//   BOARD_ROWS,
//   getKimQuadrantsContainingNumber,
//   resolveKimQuadrantPreference,
//   type KimQuadrantId
// } from '../../lib/roulette'
// import { getNumberTone } from '../../lib/roulette/utils'
// import { cn } from '../../lib/utils'
// import { PanelStatus } from '../../types'

// interface BoardProps {
//   nextBet: any
//   status: PanelStatus
//   roundMultiplier: number
//   placementMap: Map<number, number>
//   winningNumbers: number[]
//   latestWinningNumber: number | null
//   baseUnit: number
//   allowOverlaps: boolean
//   spreadSelectionMode: string
//   hotNumbers: number[]
//   startingQuadrant: KimQuadrantId
//   selectedStartingQuadrantNumbers: Set<number>
//   hoveredQuadrantNumbers: Set<number>
//   hotRankMap: Map<number, number>
//   handleQuadrantClick: (quadrant: KimQuadrantId) => void
//   handleQuadrantHover: (quadrant: KimQuadrantId | null) => void
// }

// export const Board = ({
//   nextBet,
//   roundMultiplier,
//   placementMap,
//   latestWinningNumber,
//   baseUnit,
//   allowOverlaps,
//   spreadSelectionMode,
//   hotNumbers,
//   startingQuadrant,
//   selectedStartingQuadrantNumbers,
//   hoveredQuadrantNumbers,
//   hotRankMap,
//   handleQuadrantClick,
//   handleQuadrantHover
// }: BoardProps) => {
//   return (
//     <div className='mt-4 grid grid-cols-[42px_1fr] gap-3'>
//       <div
//         className={cn(
//           'relative flex items-center justify-center rounded-2xl border text-lg font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]',
//           getNumberTone(0),
//           nextBet.zeroStake > 0 && 'ring-2 ring-emerald-300/75 ring-offset-2 ring-offset-slate-950',
//           latestWinningNumber === 0 && 'border-amber-300 shadow-[0_0_0_1px_rgba(252,211,77,0.55)]'
//         )}>
//         0
//         {nextBet.zeroStake > 0 ? (
//           <>
//             <span className='absolute bottom-1 rounded-full bg-emerald-300 px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-[0.14em] text-slate-950'>
//               Z
//             </span>
//             {roundMultiplier > 1 ? (
//               <span className='absolute -right-1.5 -top-1.5 rounded-full bg-amber-300 px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-[0.12em] text-slate-950'>
//                 {roundMultiplier}
//               </span>
//             ) : null}
//           </>
//         ) : null}
//       </div>

//       <div className='space-y-2'>
//         {BOARD_ROWS.map((row) => (
//           <div key={row.join('-')} className='grid grid-cols-12 gap-1 space-y-1'>
//             {row.map((value) => {
//               const placementCount = placementMap.get(value) ?? 0
//               const effectiveMultiplier = getEffectiveStakeMultiplier(nextBet.unitStake, baseUnit, placementCount)
//               const isActive = placementCount > 0
//               const isLatest = latestWinningNumber === value
//               const interactiveQuadrant = resolveKimQuadrantPreference(
//                 getKimQuadrantsContainingNumber(value),
//                 hotNumbers,
//                 startingQuadrant
//               )
//               const isStartingQuadrantTrigger = interactiveQuadrant !== null
//               const isSelectedStartingQuadrant = selectedStartingQuadrantNumbers.has(value)
//               const isHoveredQuadrantMember = hoveredQuadrantNumbers.has(value)

//               const hotRank = hotRankMap.get(value)

//               return (
//                 <button
//                   key={value}
//                   type='button'
//                   onClick={() => {
//                     if (interactiveQuadrant) {
//                       handleQuadrantClick(interactiveQuadrant)
//                     }
//                   }}
//                   onMouseEnter={() => {
//                     if (interactiveQuadrant) {
//                       handleQuadrantHover(interactiveQuadrant)
//                     }
//                   }}
//                   onMouseLeave={() => handleQuadrantHover(null)}
//                   onFocus={() => {
//                     if (interactiveQuadrant) {
//                       handleQuadrantHover(interactiveQuadrant)
//                     }
//                   }}
//                   onBlur={() => handleQuadrantHover(null)}
//                   disabled={!interactiveQuadrant}
//                   title={
//                     interactiveQuadrant ? `${formatQuadrantLabel(interactiveQuadrant)} · set start quadrant` : undefined
//                   }
//                   className={cn(
//                     'relative flex h-10 w-auto aspect-square items-center justify-center rounded-xl border text-sm font-semibold _shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-all disabled:cursor-default',
//                     getNumberTone(value),
//                     isActive && 'ring-2 ring-emerald-300/75 ring-offset-1 ring-offset-slate-950',
//                     isActive && hotRank && nextBet.round >= 4 && 'animate-pulse',
//                     isLatest && 'border-amber-300 shadow-[0_0_0_1px_rgba(252,211,77,0.55)]',
//                     isHoveredQuadrantMember && 'ring-2 ring-white/70 ring-offset-1 ring-offset-slate-950',
//                     isStartingQuadrantTrigger && 'cursor-pointer hover:border-white',
//                     isSelectedStartingQuadrant && 'border-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.22)]'
//                   )}>
//                   <span className='text-base font-semibold drop-shadow-xs'>{value}</span>
//                   {isActive && effectiveMultiplier > 1 ? (
//                     <span
//                       className={cn(
//                         'absolute -right-1.5 -top-1.5 rounded-full bg-amber-300 px-1 py-0.5 text-[8px] font-bold uppercase -tracking-widest text-slate-950',
//                         {
//                           'bg-indigo-400 text-white': effectiveMultiplier === 4,
//                           'bg-fuchsia-300': effectiveMultiplier === 8
//                         }
//                       )}>
//                       <span className='scale-75'>{effectiveMultiplier}</span>
//                     </span>
//                   ) : null}
//                   {hotRank ? (
//                     <span
//                       className={cn(
//                         'absolute -bottom-px -left-px flex h-3 w-3 items-center justify-center rounded-xs rounded-bl-lg text-[7px] font-bold shadow-sm',
//                         hotRank === 1 && 'bg-amber-400 text-amber-900',
//                         hotRank === 2 && 'bg-zinc-300 text-zinc-700',
//                         hotRank === 3 && 'bg-orange-600 text-orange-100',
//                         hotRank === 4 && 'bg-violet-500 text-white'
//                       )}>
//                       {hotRank}
//                     </span>
//                   ) : null}
//                 </button>
//               )
//             })}
//           </div>
//         ))}
//       </div>
//     </div>
//   )
// }

// export const Stat = ({ children }: PropsWithChildren) => {
//   return <div className='rounded-sm border border-white/15 bg-white/8 backdrop-blur-md p-1.25'>{children}</div>
// }

// // Helper functions
// function formatQuadrantLabel(quadrant: KimQuadrantId): string {
//   return quadrant.toUpperCase()
// }

// function getEffectiveStakeMultiplier(unitStake: number, baseUnit: number, placementCount: number): number {
//   const roundMultiplier = baseUnit > 0 ? Math.max(1, Math.round(unitStake / baseUnit)) : 1
//   return roundMultiplier * placementCount
// }
