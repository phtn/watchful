import { FC, type ReactNode, useMemo } from 'react'
import { BLACK_NUMBERS, ORPHELINS_G, RED_NUMBERS, TIER_G, VOISINS_G } from '../../lib/roulette'
import { cn } from '../../lib/utils'
import { ClassName } from '../../types'

export const cardClassName: ClassName = `border-zinc-800  bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0)),linear-gradient(180deg,rgba(31,35,41,0.96),rgba(12,14,19,0.9))]`

type AnalyticsProps = {
  winningNumbers?: readonly number[]
  onReset?: () => void
}

export const Analytics: FC<AnalyticsProps> = ({ winningNumbers = [], onReset }) => {
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
        {/* Hot & Cold Numbers */}
        <div className='grid lg:grid-cols-2 gap-1'>
          <div className={cn('rounded-lg p-4', cardClassName)}>
            <div className='flex items-center gap-2 mb-6'>
              {/*<Flame size={20} className='text-orange-400' />*/}
              {/*<Icon name='re-up.ph' className='text-white size-4' />*/}
              <h2 className='font-clash font-semibold text-white uppercase'>Hot</h2>
              <span className='text-xs text-neutral-500 ml-auto'>Most frequent</span>
            </div>
            <div className='flex flex-wrap gap-3'>
              {stats.hotNumbers.length > 0 ? (
                stats.hotNumbers.map(([num, count]) => (
                  <NumberBadge key={num} number={num} count={count} isHot={true} />
                ))
              ) : (
                <p className='text-neutral-500 text-sm'>No data yet</p>
              )}
            </div>
          </div>

          <div className={cn('rounded-lg p-4', cardClassName)}>
            <div className='flex items-center gap-2 mb-6'>
              {/*<Snowflake size={20} className='text-cyan-400' />*/}
              {/*<Icon name='re-up.ph' className='text-white size-4' />*/}
              <h2 className='font-clash font-semibold text-white uppercase'>Cold</h2>
              <span className='text-xs text-neutral-500 ml-auto'>Least frequent</span>
            </div>
            <div className='flex flex-wrap gap-3'>
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

        {/* Stats Overview */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-1'>
          <StatCard title='Total Spins' value={winningNumbers.length} color='emerald' />
          <StatCard
            title='Zero %'
            value={`${stats.zero.pct.toFixed(1)}%`}
            subtitle={`${stats.zero.count} hits`}
            color='emerald'
          />
          <StatCard
            title='Red %'
            value={`${stats.colors.red.pct.toFixed(1)}%`}
            subtitle={`${stats.colors.red.count} hits`}
            color='rose'
          />
          <StatCard
            title='Black %'
            value={`${stats.colors.black.pct.toFixed(1)}%`}
            subtitle={`${stats.colors.black.count} hits`}
            color='neutral'
          />
        </div>

        {/* Main Stats Grid */}
        <div className='grid lg:grid-cols-2 gap-1'>
          {/* Dozens & Columns */}
          <div className={cn('rounded-lg p-2', cardClassName)}>
            <div className='flex items-center gap-2 mb-6'>
              {/*<Grid3X3 size={20} className='text-purple-400' />*/}
              {/*<Icon name='re-up.ph' className='text-white size-4' />*/}
              {/*<h2 className='text-lg font-semibold text-white'>Dozens</h2>*/}
              <h2 className='font-clash font-semibold text-white uppercase'>Dozens</h2>
            </div>
            <div className='space-y-4'>
              <PercentageBar
                label='1st Dozen (1-12)'
                percentage={stats.dozens[0].pct}
                color='bg-linear-to-r from-violet-500 to-purple-500'
                count={stats.dozens[0].count}
              />
              <PercentageBar
                label='2nd Dozen (13-24)'
                percentage={stats.dozens[1].pct}
                color='bg-linear-to-r from-purple-500 to-fuchsia-500'
                count={stats.dozens[1].count}
              />
              <PercentageBar
                label='3rd Dozen (25-36)'
                percentage={stats.dozens[2].pct}
                color='bg-linear-to-r from-fuchsia-500 to-pink-500'
                count={stats.dozens[2].count}
              />
            </div>
          </div>

          <div className={cn('rounded-lg p-2', cardClassName)}>
            <div className='flex items-center gap-2 mb-6'>
              {/*<Layers size={20} className='text-blue-400' />*/}
              {/*<Icon name='re-up.ph' className='text-white size-4' />*/}
              <h2 className='font-clash font-semibold text-white uppercase'>Columns</h2>
            </div>
            <div className='space-y-4'>
              <PercentageBar
                label='1st Column (1,4,7...)'
                percentage={stats.columns[0].pct}
                color='bg-linear-to-r from-blue-500 to-cyan-500'
                count={stats.columns[0].count}
              />
              <PercentageBar
                label='2nd Column (2,5,8...)'
                percentage={stats.columns[1].pct}
                color='bg-linear-to-r from-cyan-500 to-teal-500'
                count={stats.columns[1].count}
              />
              <PercentageBar
                label='3rd Column (3,6,9...)'
                percentage={stats.columns[2].pct}
                color='bg-linear-to-r from-teal-500 to-emerald-500'
                count={stats.columns[2].count}
              />
            </div>
          </div>

          <div className={cn('rounded-lg p-2', cardClassName)}>
            <div className='flex items-center gap-2 mb-6'>
              {/*<BarChart3 size={20} className='text-amber-400' />*/}
              {/*<Icon name='re-up.ph' className='text-white size-4' />*/}
              <h2 className='font-clash font-semibold text-white uppercase'>Halves</h2>
            </div>
            <div className='space-y-4'>
              <PercentageBar
                label='Low (1-18)'
                percentage={stats.halves[0].pct}
                color='bg-linear-to-r from-amber-500 to-orange-500'
                count={stats.halves[0].count}
              />
              <PercentageBar
                label='High (19-36)'
                percentage={stats.halves[1].pct}
                color='bg-linear-to-r from-orange-500 to-red-500'
                count={stats.halves[1].count}
              />
            </div>
            <div className='mt-6 pt-6 border-t border-neutral-700/50 space-y-4'>
              <PercentageBar
                label='Odd'
                percentage={stats.oddEven.odd.pct}
                color='bg-linear-to-r from-indigo-500 to-blue-500'
                count={stats.oddEven.odd.count}
              />
              <PercentageBar
                label='Even'
                percentage={stats.oddEven.even.pct}
                color='bg-linear-to-r from-blue-500 to-indigo-500'
                count={stats.oddEven.even.count}
              />
            </div>
          </div>

          <div className={cn('rounded-lg p-2', cardClassName)}>
            <div className='flex items-center gap-2 mb-6'>
              {/*<Target size={20} className='text-emerald-400' />*/}
              {/*<Icon name='re-up.ph' className='text-white size-4' />*/}
              <h2 className='font-clash font-semibold text-white uppercase'>Wheel</h2>
            </div>
            <div className='space-y-4'>
              <PercentageBar
                label='Voisins du Zéro'
                percentage={stats.sections.voisins.pct}
                color='bg-linear-to-r from-emerald-500 to-teal-500'
                count={stats.sections.voisins.count}
              />
              <PercentageBar
                label='Tiers du Cylindre'
                percentage={stats.sections.tier.pct}
                color='bg-linear-to-r from-rose-500 to-pink-500'
                count={stats.sections.tier.count}
              />
              <PercentageBar
                label='Orphelins'
                percentage={stats.sections.orphelins.pct}
                color='bg-linear-to-r from-amber-500 to-yellow-500'
                count={stats.sections.orphelins.count}
              />
            </div>
            <div className='mt-6 pt-4 border-t border-neutral-700/50'>
              <div className='grid grid-cols-3 gap-4 text-xs'>
                <div>
                  <p className='text-neutral-400 mb-1'>Voisins</p>
                  <p className='text-neutral-500 leading-relaxed'>0,2,3,4,7,12,15,18,19,21,22,25,26,28,29,32,35</p>
                </div>
                <div>
                  <p className='text-neutral-400 mb-1'>Tiers</p>
                  <p className='text-neutral-500 leading-relaxed'>5,8,10,11,13,16,23,24,27,30,33,36</p>
                </div>
                <div>
                  <p className='text-neutral-400 mb-1'>Orphelins</p>
                  <p className='text-neutral-500 leading-relaxed'>1,6,9,14,17,20,31,34</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={cn('rounded-lg p-4', cardClassName)}>
          <div className='flex items-center gap-2 mb-6'>
            {/*<Grid3X3 size={20} className='text-indigo-400' />*/}
            {/*<Icon name='re-up.ph' className='text-white size-4' />*/}
            <h2 className='font-clash font-semibold text-white uppercase'>Streets</h2>
          </div>
          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {stats.streets.map((street, idx) => {
              const start = idx * 3 + 1
              return (
                <div key={idx} className='bg-neutral-800/30 rounded-xl p-3'>
                  <div className='flex justify-between items-center mb-2'>
                    <span className='text-sm font-medium text-neutral-300'>
                      {start}-{start + 2}
                    </span>
                    <span className='text-sm font-semibold text-neutral-200'>{street.pct.toFixed(1)}%</span>
                  </div>
                  <div className='h-1.5 bg-neutral-700/50 rounded-full overflow-hidden'>
                    <div
                      className='h-full bg-linear-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500'
                      style={{ width: `${Math.min(street.pct * 3, 100)}%` }}
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
  <div className={cn('rounded-md p-2 transition-all duration-300', cardClassName)}>
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

interface NumberBadgeProps {
  number: number
  count: number
  isHot?: boolean
  showCount?: boolean
}

const NumberBadge: FC<NumberBadgeProps> = ({ number, count, isHot = true, showCount = true }) => {
  const getColor = (num: number) => {
    if (num === 0) return 'bg-linear-to-br from-emerald-500 to-emerald-600'
    if (RED_NUMBERS.includes(num)) return 'bg-linear-to-br from-rose-500 to-rose-600'
    return 'bg-linear-to-br from-neutral-600 to-neutral-700'
  }

  return (
    <div className='relative group'>
      <div
        className={`w-12 h-12 ${getColor(number)} rounded-xl flex items-center justify-center font-bold text-white shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl ${isHot ? 'hover:shadow-rose-500/20' : 'hover:shadow-cyan-500/20'}`}>
        {number}
      </div>
      {showCount && (
        <div
          className={`absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${isHot ? 'bg-orange-500' : 'bg-cyan-500'}`}>
          {count}
        </div>
      )}
    </div>
  )
}
