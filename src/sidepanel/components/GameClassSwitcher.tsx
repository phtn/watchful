export type GameClassView = 'originals' | 'roulette'

interface GameClassSwitcherProps {
  value: GameClassView
  onChange: (value: GameClassView) => void
}

const GAME_CLASS_OPTIONS: Array<{
  value: GameClassView
  label: string
  detail: string
  badge: string
}> = [
  {
    value: 'originals',
    label: 'Originals',
    detail: 'Keno, Limbo, Dice, Mines',
    badge: 'Live Feed'
  },
  {
    value: 'roulette',
    label: 'Roulette',
    detail: 'Board, sectors, wheel memory',
    badge: 'Preview'
  }
]

export function GameClassSwitcher({ value, onChange }: GameClassSwitcherProps) {
  return (
    <section className='rounded-[16.01px] border border-white/60 bg-white/76 p-2 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.35)] backdrop-blur-xl'>
      <div className='grid grid-cols-2 gap-2'>
        {GAME_CLASS_OPTIONS.map((option) => {
          const isActive = option.value === value

          return (
            <button
              key={option.value}
              type='button'
              onClick={() => onChange(option.value)}
              className={`rounded-[14px] border px-4 py-3 text-left transition ${
                isActive
                  ? 'border-slate-900 bg-slate-900 text-white shadow-[0_16px_34px_-24px_rgba(15,23,42,0.88)]'
                  : 'border-slate-200/80 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-950'
              }`}>
              <div className='flex items-start justify-between gap-3'>
                <div>
                  <p
                    className={`text-[0.62rem] uppercase tracking-[0.24em] ${
                      isActive ? 'text-cyan-100/70' : 'text-slate-500'
                    }`}>
                    {option.badge}
                  </p>
                  <h2 className='font-circ mt-2 text-sm leading-none'>{option.label}</h2>
                  <p className={`mt-2 text-xs ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>{option.detail}</p>
                </div>
                <span
                  className={`mt-1 h-2.5 w-2.5 rounded-full ${
                    isActive ? 'bg-emerald-300 shadow-[0_0_0_4px_rgba(110,231,183,0.16)]' : 'bg-slate-300'
                  }`}
                />
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
