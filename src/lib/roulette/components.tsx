function MetricTile({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className='rounded-2xl border border-white/10 bg-white/6 p-3 backdrop-blur-md'>
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

/*
<div className='hidden _grid grid-cols-3 mt-5 gap-2'>
            <MetricTile label='Table' value='European' detail='37 pockets' />
            <MetricTile
              label='Spins'
              value={stats.totalSpins.toString()}
              detail={latestSpin ? `Last ${latestSpin.description}` : 'Waiting for first hit'}
            />
            <MetricTile label='Source' value={status.connected ? 'Armed' : 'Idle'} detail={getSourceLabel(status)} />
          </div>
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
                          className='rounded-lg border border-slate-200/15 bg-white/4 px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-200'>
                          {label}
                        </div>
                      ))}
                    </div>

                    <div className='mt-2 grid grid-cols-3 gap-1.5'>
                      {COLUMNS.map((label, index) => (
                        <div
                          key={`${label}-${index}`}
                          className='rounded-lg border border-slate-200/15 bg-white/4 px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-200'>
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


                                <section className='grid gap-4'>
                                        <div className='rounded-[18px] border border-white/60 bg-white/78 p-4 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.35)] backdrop-blur-xl'>
                                          <div className='flex items-end justify-between gap-3'>
                                            <div>
                                              <p className='text-[0.64rem] uppercase tracking-[0.28em] text-slate-500'>Announced Bets</p>
                                              <h3 className='font-circ mt-2 text-lg leading-none text-slate-900'>Sector Presets</h3>
                                            </div>
                                            <p className='text-xs text-slate-500'>Ready for neighbors, tiers, and orphan groupings</p>
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
*/

/*
{winningNumbers.length > 0 && (
          <div className='bg-linear-to-br from-neutral-800/50 to-neutral-900/50 backdrop-blur-xl p-2 border border-neutral-700/50'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='font-clash font-semibold text-white uppercase'>Spins</h2>
              <span className='text-sm text-neutral-400'>Total: {winningNumbers.length} spins</span>
            </div>
            <div className='flex flex-wrap gap-2'>
              {winningNumbers.slice(0, 10).map((num, index) => (
                <NumberBadge
                  key={`recent-${index}-${num}`}
                  number={num}
                  count={stats.numberCounts.get(num) || 0}
                  isHot={stats.hotNumbers.some(([hotNumber]) => hotNumber === num)}
                  showCount={false}
                />
              ))}
            </div>
          </div>
        )}
*/
