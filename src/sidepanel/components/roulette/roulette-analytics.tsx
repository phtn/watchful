import { FC, type ReactNode, useMemo } from 'react'
import { BLACK_NUMBERS, ORPHELINS_G, RED_NUMBERS, TIER_G, VOISINS_G } from '../../../lib/roulette'
import { cn } from '../../../lib/utils'
import { ClassName } from '../../../types'
import { tmap } from './tables'

export const cardClassName: ClassName = `border-zinc-800 bg-[linear-gradient(180deg,rgba(255,255,255,0.01),rgba(255,255,255,0)),linear-gradient(180deg,rgba(31,35,41,0.96),rgba(12,14,19,0.9))]`

type LobbyTableHistory = { tableId: string; numbers: number[] }

type AnalyticsProps = {
  winningNumbers?: readonly number[]
  lobbyHistories?: LobbyTableHistory[]
  onReset?: () => void
}

export const Analytics: FC<AnalyticsProps> = ({ winningNumbers = [], lobbyHistories = [], onReset }) => {
  const stats = useMemo(() => {
    const total = winningNumbers.length
    if (total === 0) {
      return {
        zero: { count: 0, pct: 0 },
        dozens: [
          { count: 0, pct: 0 },
          { count: 0, pct: 0 },
          { count: 0, pct: 0 }
        ],
        columns: [
          { count: 0, pct: 0 },
          { count: 0, pct: 0 },
          { count: 0, pct: 0 }
        ],
        halves: [
          { count: 0, pct: 0 },
          { count: 0, pct: 0 }
        ],
        colors: { red: { count: 0, pct: 0 }, black: { count: 0, pct: 0 } },
        oddEven: { odd: { count: 0, pct: 0 }, even: { count: 0, pct: 0 } },
        streets: Array(12).fill({ count: 0, pct: 0 }),
        sections: { tier: { count: 0, pct: 0 }, orphelins: { count: 0, pct: 0 }, voisins: { count: 0, pct: 0 } },
        hotNumbers: [],
        coldNumbers: [],
        numberCounts: new Map<number, number>()
      }
    }

    // Count occurrences
    const numberCounts = new Map<number, number>()
    for (let i = 0; i <= 36; i++) numberCounts.set(i, 0)
    winningNumbers.forEach((n) => numberCounts.set(n, (numberCounts.get(n) || 0) + 1))

    // Zero percentage
    const zeroCount = numberCounts.get(0) || 0

    // Dozens
    const dozens = [
      winningNumbers.filter((n) => n >= 1 && n <= 12),
      winningNumbers.filter((n) => n >= 13 && n <= 24),
      winningNumbers.filter((n) => n >= 25 && n <= 36)
    ].map((arr) => ({ count: arr.length, pct: (arr.length / total) * 100 }))

    // Columns
    const columns = [
      winningNumbers.filter((n) => n > 0 && n % 3 === 1),
      winningNumbers.filter((n) => n > 0 && n % 3 === 2),
      winningNumbers.filter((n) => n > 0 && n % 3 === 0)
    ].map((arr) => ({ count: arr.length, pct: (arr.length / total) * 100 }))

    // Halves
    const halves = [
      winningNumbers.filter((n) => n >= 1 && n <= 18),
      winningNumbers.filter((n) => n >= 19 && n <= 36)
    ].map((arr) => ({ count: arr.length, pct: (arr.length / total) * 100 }))

    // Colors
    const redCount = winningNumbers.filter((n) => RED_NUMBERS.includes(n)).length
    const blackCount = winningNumbers.filter((n) => BLACK_NUMBERS.includes(n)).length

    // Odd/Even
    const oddCount = winningNumbers.filter((n) => n > 0 && n % 2 === 1).length
    const evenCount = winningNumbers.filter((n) => n > 0 && n % 2 === 0).length

    // Streets (1-3, 4-6, 7-9, etc.)
    const streets = Array.from({ length: 12 }, (_, i) => {
      const start = i * 3 + 1
      const end = start + 2
      const count = winningNumbers.filter((n) => n >= start && n <= end).length
      return { count, pct: (count / total) * 100 }
    })

    // Wheel sections
    const tierCount = winningNumbers.filter((n) => TIER_G.includes(n)).length
    const orphelinsCount = winningNumbers.filter((n) => ORPHELINS_G.includes(n)).length
    const voisinsCount = winningNumbers.filter((n) => VOISINS_G.includes(n)).length

    // Hot and Cold numbers
    const sortedNumbers = Array.from(numberCounts.entries()).sort((a, b) => b[1] - a[1])

    const hotNumbers = sortedNumbers.slice(0, 5).filter(([, count]) => count > 0)
    const coldNumbers = sortedNumbers
      .slice(-5)
      .reverse()
      .filter(([, count]) => count >= 0)

    return {
      zero: { count: zeroCount, pct: (zeroCount / total) * 100 },
      dozens,
      columns,
      halves,
      colors: {
        red: { count: redCount, pct: (redCount / total) * 100 },
        black: { count: blackCount, pct: (blackCount / total) * 100 }
      },
      oddEven: {
        odd: { count: oddCount, pct: (oddCount / total) * 100 },
        even: { count: evenCount, pct: (evenCount / total) * 100 }
      },
      streets,
      sections: {
        tier: { count: tierCount, pct: (tierCount / total) * 100 },
        orphelins: { count: orphelinsCount, pct: (orphelinsCount / total) * 100 },
        voisins: { count: voisinsCount, pct: (voisinsCount / total) * 100 }
      },
      hotNumbers,
      coldNumbers,
      numberCounts
    }
  }, [winningNumbers])

  return (
    <div className='space-y-2 text-white p-1'>
      <div className='mx-auto space-y-2'>
        {/* Lobby History — one row per table */}
        {lobbyHistories.length > 0 && (
          <div className={cn('rounded-lg p-3 space-y-1', cardClassName)}>
            {lobbyHistories.map(({ tableId, numbers }) => (
              <div key={tableId} className='flex items-center gap-3'>
                <span className='text-xs uppercase text-neutral-200 min-w-48 shrink-0 truncate' title={tableId}>
                  {
                    tmap[
                      `${tableId
                        .replace(/0+$/, '')
                        .replace(/^[A-Z][a-z]+/, '')
                        .toLowerCase()}` as keyof typeof tmap
                    ]
                  }
                </span>
                <div className='flex gap-0.5 bg-white/40 p-1 rounded-xs'>
                  {numbers.slice(0, 10).map((n, i) => (
                    <LobbyNumber key={i} number={n} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Hot & Cold Numbers */}
        <div className={cn('grid grid-cols-2 gap-1', cardClassName)}>
          <div className={cn('rounded-lg p-2')}>
            <div className='flex flex-wrap gap-1.5'>
              <div className='-rotate-90 p-0.5 rounded-sm text-orange-300 text-xs h-4'>
                <span className='font-bold uppercase'>hot</span>
              </div>
              {stats.hotNumbers.length > 0 ? (
                stats.hotNumbers.map(([num, count]) => (
                  <NumberBadge key={num} number={num} count={count} isHot={true} />
                ))
              ) : (
                <p className='text-neutral-500 text-sm'>Awaiting data...</p>
              )}
            </div>
          </div>

          <div className={cn('rounded-lg p-2')}>
            <div className='flex flex-wrap gap-1.5'>
              <div className='-rotate-90 p-0.5 rounded-sm text-cyan-400 text-xs h-4'>
                <span className='font-bold uppercase'>cold</span>
              </div>
              {stats.coldNumbers.length > 0 ? (
                stats.coldNumbers.map(([num, count]) => (
                  <NumberBadge key={num} number={num} count={count} isHot={false} />
                ))
              ) : (
                <p className='text-neutral-500 text-sm'>No data yet</p>
              )}
            </div>
          </div>
        </div>
        {/* Recent Numbers Strip */}
        <div className='grid grid-cols-10 gap-1'>
          <VPctBar
            label='ZERO'
            percentage={stats.zero.pct}
            color='bg-linear-to-b from-emerald-500 to-emerald-600'
            count={stats.zero.count}
          />
          <VPctBar
            label='1 - 12'
            percentage={stats.dozens[0].pct}
            color='bg-linear-to-b from-cyan-300/50 to-cyan-500'
            count={stats.dozens[0].count}
            cols='col-span-3'
          />
          <VPctBar
            label='13 - 24'
            percentage={stats.dozens[1].pct}
            color='bg-linear-to-b from-sky-300/50 to-sky-500'
            count={stats.dozens[1].count}
            cols='col-span-3'
          />
          <VPctBar
            label='25 - 36'
            percentage={stats.dozens[2].pct}
            color='bg-linear-to-b from-blue-300/50 to-blue-500'
            count={stats.dozens[2].count}
            cols='col-span-3'
          />
        </div>

        {/* Stats Overview */}
        <div className='grid grid-cols-4 gap-1 bg-neutral-700/50'>
          <StatCard
            title='EVEN'
            value={`${stats.oddEven.even.pct.toFixed(1)}%`}
            subtitle={`${stats.oddEven.even.count}`}
            color='neutral'
          />
          <StatCard
            title='RED'
            value={`${stats.colors.red.pct.toFixed(1)}%`}
            subtitle={`${stats.colors.red.count}`}
            color='rose'
          />
          <StatCard
            title='BLACK'
            value={`${stats.colors.black.pct.toFixed(1)}%`}
            subtitle={`${stats.colors.black.count}`}
            color='neutral'
          />
          <StatCard
            title='ODD'
            value={`${stats.oddEven.odd.pct.toFixed(1)}%`}
            subtitle={`${stats.oddEven.odd.count}`}
            color='neutral'
          />
        </div>

        <div className={cn('rounded-lg p-4 bg-neutral-700')}>
          <div className='flex items-center gap-2 mb-6'>
            {/*<Grid3X3 size={20} className='text-indigo-400' />*/}
            {/*<Icon name='re-up.ph' className='text-white size-4' />*/}
            <h2 className='font-clash font-semibold text-white uppercase'>Streets</h2>
          </div>
          <div className='grid grid-cols-12 gap-0.5'>
            {stats.streets.map((street, idx) => {
              const start = idx * 3 + 1
              return (
                <div key={idx} className='bg-neutral-800/30 rounded-xl p-3'>
                  <div className='font-medium text-neutral-300 text-sm'>
                    <p className='text-center'>{start + 2}</p>
                    <p className='text-center'>{start + 1}</p>
                    <p className='text-center'>{start}</p>
                    <p className='text-cyan-200 text-xs text-center'>{street.pct.toFixed(1)}%</p>
                  </div>
                  <div className='w-1.5 h-auto bg-neutral-700/50 rounded-full overflow-hidden'>
                    <div
                      className='bg-linear-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500'
                      style={{ height: `${Math.min(street.pct * 3, 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Number Frequency Heatmap */}
        {winningNumbers.length > 0 && (
          <div className={cn('rounded-lg p-4', cardClassName)}>
            <div className='flex items-center gap-2 mb-6'>
              {/*<BarChart3 size={20} className='text-emerald-400' />*/}
              {/*<Icon name='re-up.ph' className='text-white size-4' />*/}
              <h2 className='font-clash font-semibold text-white uppercase'>Frequency</h2>
            </div>
            <div className='grid grid-cols-10 sm:grid-cols-13 md:grid-cols-19 gap-2'>
              {Array.from({ length: 37 }, (_, i) => i).map((num) => {
                const count = stats.numberCounts.get(num) || 0
                const maxCount = Math.max(...Array.from(stats.numberCounts.values()))
                const intensity = maxCount > 0 ? count / maxCount : 0

                return (
                  <div
                    key={num}
                    className={`relative aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-bold transition-all duration-300 hover:scale-110 ${
                      num === 0 ? 'bg-emerald-600' : RED_NUMBERS.includes(num) ? 'bg-rose-600' : 'bg-neutral-600'
                    }`}
                    style={{
                      opacity: 0.3 + intensity * 0.7,
                      boxShadow:
                        intensity > 0.5
                          ? `0 0 ${intensity * 20}px ${num === 0 ? 'rgba(16, 185, 129, 0.5)' : RED_NUMBERS.includes(num) ? 'rgba(244, 63, 94, 0.5)' : 'rgba(100, 116, 139, 0.5)'}`
                          : 'none'
                    }}>
                    <span>{num}</span>
                    {count > 0 && <span className='text-[10px] opacity-75'>{count}</span>}
                  </div>
                )
              })}
            </div>
            <div className='flex items-center justify-center gap-2 mt-4'>
              <span className='text-xs text-neutral-500'>Cold</span>
              <div className='flex gap-0.5'>
                {[0.3, 0.5, 0.7, 0.9, 1].map((opacity, idx) => (
                  <div key={idx} className='w-6 h-3 bg-emerald-500 rounded' style={{ opacity }} />
                ))}
              </div>
              <span className='text-xs text-neutral-500'>Hot</span>
            </div>
          </div>
        )}
        {/* RESET */}
        <div className={cn('rounded-lg border border-white/8 p-4', cardClassName)}>
          <div className='flex items-start justify-between gap-4'>
            <div className='space-y-1'>
              <p className='text-[11px] font-ios uppercase tracking-[0.28em] text-neutral-500'>Roulette Analytics</p>
              <h1 className='font-clash text-lg font-semibold uppercase text-white'>Spinner Results</h1>
            </div>
            <button
              type='button'
              onClick={onReset}
              disabled={winningNumbers.length === 0}
              className='rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.24em] text-neutral-200 transition hover:border-white/25 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40'>
              Reset
            </button>
          </div>
          {winningNumbers.length > 0 && (
            <div className='mt-4 flex items-center justify-between gap-3 border-t border-white/8 pt-3 text-xs text-neutral-400'>
              <span>{winningNumbers.length} tracked spins</span>
              <span>Latest result: {winningNumbers[0]}</span>
            </div>
          )}
        </div>
        {/* Footer */}
        <div className='text-center py-4'>
          <p className='text-neutral-500 text-xs'>European Roulette Analytics • Single Zero Wheel</p>
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
  trend?: 'up' | 'down' | 'neutral'
  color?: 'emerald' | 'neutral' | 'rose'
}

const STAT_VALUE_CLASS_NAME: Record<NonNullable<StatCardProps['color']>, string> = {
  emerald: 'bg-linear-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent',
  neutral: 'bg-linear-to-r from-neutral-200 to-neutral-400 bg-clip-text text-transparent',
  rose: 'bg-linear-to-r from-rose-400 to-rose-300 bg-clip-text text-transparent'
}

const StatCard: FC<StatCardProps> = ({ title, value, trend, color = 'emerald' }) => (
  <div className={cn('rounded-sm p-2 bg-neutral-900/20')}>
    <div className='flex items-center justify-between'>
      <span className='text-xs font-ios text-neutral-400 uppercase tracking-wider'>{title}</span>
      {/*{icon && <span className={`text-${color}-400`}>{icon}</span>}*/}
    </div>
    <div className='flex items-end gap-0'>
      <span className={cn('text-xl font-medium', STAT_VALUE_CLASS_NAME[color])}>{value}</span>
      {trend && (
        <span
          className={` ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-neutral-400'}`}>
          {trend === 'up' ? (
            <span className='size-4'>up</span>
          ) : trend === 'down' ? (
            <span className='size-4'>down</span>
          ) : // <TrendingDown size={16} />
          null}
        </span>
      )}
    </div>
  </div>
)

interface PercentageBarProps {
  label: string
  percentage: number
  color: string
  count: number
}

const PercentageBar: FC<PercentageBarProps> = ({ label, percentage, color, count }) => (
  <div className='group'>
    <div className='flex justify-between items-center mb-1.5'>
      <span className='text-xs text-neutral-300'>{label}</span>
      <div className='flex items-center gap-2'>
        <span className='text-xs text-neutral-500'>({count})</span>
        <span className='text-sm font-semibold text-neutral-200'>{percentage.toFixed(1)}%</span>
      </div>
    </div>
    <div className='h-2 bg-neutral-700/50 rounded-full overflow-hidden'>
      <div
        className={`h-full ${color} rounded-full transition-all duration-700 ease-out group-hover:shadow-lg`}
        style={{ width: `${Math.min(percentage, 100)}%` }}
      />
    </div>
  </div>
)
const VPctBar: FC<PercentageBarProps & { cols?: string }> = ({ label, percentage, color, count, cols }) => (
  <div className={cn('group', cols)}>
    <div className={cn('relative h-16 bg-neutral-700/50 rounded-sm overflow-hidden flex items-end')}>
      <div
        className={`w-full ${color} rounded-sm transition-all duration-700 ease-out group-hover:shadow-lg`}
        style={{ height: `${Math.min(percentage, 100) + 0.33}%` }}
      />

      <span className='absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 text-sm font-semibold text-neutral-200'>
        {percentage.toFixed(1)}%
      </span>
    </div>
    <div className='flex items-center justify-center space-x-2 mt-1.5'>
      <span className='text-xs text-neutral-300'>{label}</span>
      <span className='text-xs text-neutral-500'>{count}</span>
    </div>
  </div>
)

interface NumberBadgeProps {
  number: number
  count: number
  isHot?: boolean
  showCount?: boolean
}

const NumberBadge: FC<NumberBadgeProps> = ({ number, count, isHot = true, showCount = true }) => {
  const getColor = (num: number) => {
    if (num === 0) return 'bg-linear-to-br from-emerald-500 to-emerald-600'
    if (RED_NUMBERS.includes(num)) return 'bg-linear-to-br from-[#B51B13] to-rose-600'
    return 'bg-linear-to-br from-neutral-600 to-neutral-700'
  }

  return (
    <div className='relative group'>
      <div
        className={`w-7 h-6 ${getColor(number)} rounded-sm flex items-center justify-center font-semibold text-white hover:scale-110 hover:shadow-lg ${isHot ? 'hover:shadow-rose-500/20' : 'hover:shadow-cyan-500/20'}`}>
        <span className='font-semibold text-base'>{number}</span>
      </div>
      {showCount && (
        <div
          className={`absolute -top-1.5 -right-0.5 w-3.5 h-3 rounded-xs flex items-center justify-center text-[8px] font-medium text-white ${isHot ? 'bg-orange-200/20' : 'bg-cyan-100/20'} backdrop-blur-3xl`}>
          {count}
        </div>
      )}
    </div>
  )
}

const LobbyNumber: FC<{ number: number }> = ({ number }) => {
  const color = number === 0 ? 'bg-emerald-700' : RED_NUMBERS.includes(number) ? 'bg-[#B51B13]' : 'bg-neutral-700'
  return (
    <span
      className={`${color} w-6 h-4.5 rounded-xs flex items-center justify-center text-[10px] font-medium text-white`}>
      {number}
    </span>
  )
}
