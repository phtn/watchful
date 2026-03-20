import { cn } from '../../lib/utils'
import type { PanelStatus } from '../../types'
import type { RouletteStoredData } from '../../types/roulette'

interface RouletteWorkspaceProps {
  status: PanelStatus
  stats: RouletteStoredData
}

const EUROPEAN_WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7,
  28, 12, 35, 3, 26
] as const

const BOARD_ROWS = [
  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34]
] as const

const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36])

const OUTSIDE_BETS = [
  { label: '1 to 18', tone: 'border-slate-200/80 bg-white text-slate-700' },
  { label: 'Even', tone: 'border-slate-200/80 bg-white text-slate-700' },
  { label: 'Red', tone: 'border-[#b51b13] bg-[#b51b13] text-white' },
  { label: 'Black', tone: 'border-slate-900/80 bg-slate-900 text-white' },
  { label: 'Odd', tone: 'border-slate-200/80 bg-white text-slate-700' },
  { label: '19 to 36', tone: 'border-slate-200/80 bg-white text-slate-700' }
] as const

const DOZENS = ['1st 12', '2nd 12', '3rd 12'] as const
const COLUMNS = ['2 to 1', '2 to 1', '2 to 1'] as const

const SECTOR_PRESETS = [
  {
    label: 'Voisins',
    description: '17-number arc around zero',
    numbers: [22, 18, 29, 7, 28, 12, 35, 3, 26, 0, 32, 15, 19, 4, 21, 2, 25]
  },
  {
    label: 'Tiers',
    description: '12-number opposite slice',
    numbers: [27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33]
  },
  {
    label: 'Orphelins',
    description: 'Isolated wheel pockets',
    numbers: [1, 20, 14, 31, 9, 17, 34, 6]
  }
] as const

const SAMPLE_SPIN_TAPE = [32, 15, 19, 4, 21, 2, 25, 17, 34, 6] as const

function getNumberTone(value: number): string {
  if (value === 0) {
    return 'border-[#166958] bg-[#166958] text-white'
  }

  return RED_NUMBERS.has(value)
    ? 'border-[#b51b13] bg-[#b51b13] text-white'
    : 'border-slate-200/15 bg-slate-950/78 text-slate-100'
}

function getSourceLabel(status: PanelStatus): string {
  if (!status.connected || !status.site) {
    return 'No live roulette source armed yet'
  }

  return `${status.site === 'stake' ? 'Stake' : 'bet88.ph'} connected`
}

export function RouletteWorkspace({ status, stats }: RouletteWorkspaceProps) {
  const recentSpins = stats.results.slice(-10).reverse()
  const previewSpins = recentSpins.length > 0 ? recentSpins.map((result) => result.winningNumber) : SAMPLE_SPIN_TAPE
  const latestSpin = recentSpins[0] ?? null

  return (
    <div className='space-y-4 pb-6'>
      <section className='relative overflow-hidden rounded-[18px] border border-white/12 bg-[#09111f] p-5 text-white shadow-[0_32px_90px_-38px_rgba(15,23,42,0.78)]'>
        <div className='absolute inset-x-[-15%] top-[-28%] h-48 rounded-full bg-[radial-gradient(circle,rgba(34,197,94,0.35),transparent_64%)] blur-2xl' />
        <div className='absolute bottom-[-35%] right-[-16%] h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(239,68,68,0.28),transparent_68%)] blur-2xl' />
        <div className='relative'>
          <div className='flex items-start justify-between gap-4'>
            <div>
              <p className='font-line text-[0.62rem] uppercase tracking-[0.32em] text-emerald-100/70'>Table Games</p>
              <h2 className='font-circ mt-3 text-[1.65rem] leading-none text-white'>Roulette Atelier</h2>
              <div className='mt-4 rounded-[20px] p-3 w-full'>
                <div className='flex items-end justify-between gap-3'>
                  <p className='text-[0.62rem] uppercase tracking-[0.22em] text-slate-500'>Recent spins</p>
                  <p className='text-xs text-slate-500'>
                    {latestSpin ? latestSpin.description : 'Waiting for roulette.winSpots frames'}
                  </p>
                </div>
                <div className='mt-3 flex flex-wrap gap-2 w-full'>
                  {previewSpins.map((value, index) => (
                    <div
                      key={`preview-spin-${value}-${index}`}
                      className={`inline-flex h-9 min-w-9 items-center justify-center rounded-full border px-2 text-sm font-semibold ${getNumberTone(value)}`}>
                      {value}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div
              className={cn(
                `flex items-center justify-center rounded-full border border-emerald-300/25 bg-emerald-300/10 h-16 w-auto aspect-square text-2xl font-bold uppercase text-emerald-100 ${getNumberTone(latestSpin?.winningNumber)}  border-3! border-white/15 shadow-inner`
              )}>
              {stats.totalSpins > 0 ? latestSpin?.winningNumber : 'Awaiting Spins'}
            </div>
          </div>

          <div className='mt-5 grid grid-cols-3 gap-2'>
            <MetricTile label='Table' value='European' detail='37 pockets' />
            <MetricTile
              label='Spins'
              value={stats.totalSpins.toString()}
              detail={latestSpin ? `Last ${latestSpin.description}` : 'Waiting for first hit'}
            />
            <MetricTile label='Source' value={status.connected ? 'Armed' : 'Idle'} detail={getSourceLabel(status)} />
          </div>
        </div>
      </section>

      <section className='rounded-[18px] border border-white/60 bg-white/78 p-4 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.35)] backdrop-blur-xl'>
        <div className='flex items-end justify-between gap-3'>
          <div>
            <p className='text-[0.64rem] uppercase tracking-[0.28em] text-slate-500'>Table Surface</p>
            <h3 className='font-circ mt-2 text-lg leading-none text-slate-900'>European Board</h3>
          </div>
          <p className='text-xs text-slate-500'>Ready for number hits, sectors, and street grouping</p>
        </div>

        <div className='mt-4 rounded-3xl border border-slate-200/80 bg-[linear-gradient(180deg,rgba(12,18,32,0.97),rgba(20,31,53,0.98))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'>
          <div className='grid grid-cols-[30px_1fr] gap-0'>
            <div className='flex items-center justify-center rounded-s-xl border border-emerald-400/50 bg-emerald-400/15 px-0 py-3 text-center text-xl font-semibold text-emerald-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'>
              0
            </div>
            <div className='space-y-0.5'>
              {BOARD_ROWS.map((row) => (
                <div key={row.join('-')} className='grid grid-cols-12 gap-0.5'>
                  {row.map((value) => (
                    <div
                      key={value}
                      className={`flex h-9 w-auto aspect-square items-center justify-center text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ${getNumberTone(value)}`}>
                      {value}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className='mt-2 grid grid-cols-3 gap-1.5'>
            {DOZENS.map((label) => (
              <div
                key={label}
                className='rounded-[8px] border border-slate-200/15 bg-white/4 px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-200'>
                {label}
              </div>
            ))}
          </div>

          <div className='mt-2 grid grid-cols-3 gap-1.5'>
            {COLUMNS.map((label, index) => (
              <div
                key={`${label}-${index}`}
                className='rounded-[8px] border border-slate-200/15 bg-white/4 px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-200'>
                {label}
              </div>
            ))}
          </div>

          <div className='mt-3 grid grid-cols-2 gap-2'>
            {OUTSIDE_BETS.map((bet) => (
              <div
                key={bet.label}
                className={`rounded-[14px] border px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.16em] ${bet.tone}`}>
                {bet.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className='rounded-[18px] border border-white/60 bg-white/78 p-4 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.35)] backdrop-blur-xl'>
        <div className='flex items-end justify-between gap-3'>
          <div>
            <p className='text-[0.64rem] uppercase tracking-[0.28em] text-slate-500'>Wheel Memory</p>
            <h3 className='font-circ mt-2 text-lg leading-none text-slate-900'>Pocket Tape</h3>
          </div>
          <p className='text-xs text-slate-500'>European wheel order + latest captured spins</p>
        </div>

        <div className='mt-4 overflow-x-auto pb-1'>
          <div className='flex min-w-max gap-1.5'>
            {EUROPEAN_WHEEL_ORDER.map((value) => (
              <div
                key={`wheel-${value}`}
                className={`flex h-10 min-w-10 items-center justify-center rounded-full border text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ${
                  latestSpin?.winningNumber === value
                    ? `${getNumberTone(value)} ring-2 ring-emerald-300/80 ring-offset-2 ring-offset-slate-950`
                    : getNumberTone(value)
                }`}>
                {value}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className='grid gap-4'>
        <div className='rounded-[18px] border border-white/60 bg-white/78 p-4 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.35)] backdrop-blur-xl'>
          <div className='flex items-end justify-between gap-3'>
            <div>
              <p className='text-[0.64rem] uppercase tracking-[0.28em] text-slate-500'>Announced Bets</p>
              <h3 className='font-circ mt-2 text-lg leading-none text-slate-900'>Sector Presets</h3>
            </div>
            <p className='text-xs text-slate-500'>Ready for neighbors, tiers, and orphan groupings</p>
          </div>

          <div className='mt-4 space-y-3'>
            {SECTOR_PRESETS.map((sector) => (
              <div
                key={sector.label}
                className='rounded-[20px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.96),rgba(241,245,249,0.92))] p-3'>
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <p className='text-sm font-semibold text-slate-900'>{sector.label}</p>
                    <p className='mt-1 text-xs text-slate-500'>{sector.description}</p>
                  </div>
                  <div className='rounded-full border border-slate-200/80 bg-white px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-slate-600'>
                    {sector.numbers.length} pockets
                  </div>
                </div>

                <div className='mt-3 flex flex-wrap gap-1.5'>
                  {sector.numbers.map((value) => (
                    <div
                      key={`${sector.label}-${value}`}
                      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full border px-2 text-xs font-semibold ${getNumberTone(value)}`}>
                      {value}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className='rounded-[18px] border border-dashed border-slate-300 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(248,250,252,0.95))] p-4'>
          <p className='text-[0.64rem] uppercase tracking-[0.28em] text-slate-500'>Next Wiring</p>
          <h3 className='font-circ mt-2 text-lg leading-none text-slate-900'>Capture Layer To Add</h3>
          <div className='mt-4 grid grid-cols-2 gap-2 text-sm text-slate-600'>
            <RoadmapPill label='Bet selection parser' />
            <RoadmapPill label='Wheel streak memory' />
            <RoadmapPill label='Sector hit tracker' />
            <RoadmapPill label='Table selection replay' />
          </div>
        </div>
      </section>
    </div>
  )
}

function MetricTile({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className='rounded-[16px] border border-white/10 bg-white/6 p-3 backdrop-blur-md'>
      <p className='text-[0.58rem] uppercase tracking-[0.24em] text-slate-300'>{label}</p>
      <p className='mt-2 text-base font-semibold text-white'>{value}</p>
      <p className='mt-1 text-[0.7rem] leading-relaxed text-slate-400'>{detail}</p>
    </div>
  )
}

function RoadmapPill({ label }: { label: string }) {
  return (
    <div className='rounded-[14px] border border-slate-200/80 bg-white px-3 py-2 font-semibold text-slate-700'>
      {label}
    </div>
  )
}
