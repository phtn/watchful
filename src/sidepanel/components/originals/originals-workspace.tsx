import { SUPPORTED_SITES } from '@/src/core/siteConfig'
import { VirtualBankrollSnapshot } from '@/src/lib/virtual-bankroll'
import { GameResult, PanelStatus, StoredData, VirtualBankrollState } from '@/src/types'
import { Dispatch, SetStateAction } from 'react'
import { ProviderMetric } from '../shared/provider-metric'
import { Pulse } from '../shared/pulse'
import { GameEntry } from './game-entry'
import { VirtualBankrollCard } from './virtual-bankroll-card'

interface OriginalsWorkspaceProps {
  pulseProps: {
    requestUrlStatus: VoidFunction
    clearData: VoidFunction
    totalStaked: number
    netProfit: number
    latestGame: GameResult
    getNetTone: (v: number) => string
    simulated: boolean
    toggleSimulated: VoidFunction
  }
  vrBankProps: {
    bankroll: VirtualBankrollState
    snapshot: VirtualBankrollSnapshot
    onEnable: (seedBalance: number, baseBetAmount: number) => void
    onDisable: VoidFunction
    onUpdateBaseBetAmount: (amount: number) => void
    onReplenish: (amount: number) => void
    onReset: VoidFunction
  }
  toggleShowSettings: VoidFunction
  settingsVisible: boolean
  recentResults: GameResult[]
  onReset: VoidFunction
  simulated: boolean
  toggleSimulated: VoidFunction
  status: PanelStatus
  stats: StoredData
  setDevServerPort: Dispatch<SetStateAction<number>>
  devServerPort: number
  saveDevServerPort: (port: number) => void
}

export function OriginalsWorkspace({
  pulseProps,
  vrBankProps,
  simulated,
  recentResults,
  onReset,
  status,
  stats,
  settingsVisible,
  toggleSimulated,
  toggleShowSettings,
  setDevServerPort,
  saveDevServerPort,
  devServerPort
}: OriginalsWorkspaceProps) {
  return (
    <>
      <div className='pt-2 px-0'>
        <Pulse {...pulseProps} />
      </div>
      {simulated && <VirtualBankrollCard {...vrBankProps} />}
      {/*<KenoRecommendation results={stats.results} />*/}
      <section className='rounded-none border border-[#232830] bg-[#15191e] p-4'>
        <div className='flex items-center justify-between gap-3'>
          <div>
            <p className='text-[0.64rem] uppercase tracking-[0.28em] text-slate-500'>Most Recent</p>
            <h2 className='font-circ mt-2 text-lg leading-none text-slate-900'>Captured Games</h2>
          </div>
          <div className='rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1 text-xs font-mono uppercase tracking-[0.18em] text-slate-600'>
            {recentResults.length} shown
          </div>
        </div>

        {recentResults.length > 0 ? (
          <div className='mt-4 max-h-[520.01px] space-y-3 overflow-y-auto pr-1'>
            {recentResults.map((game) => (
              <GameEntry key={game.id ?? `${game.timestamp}-${game.roundId ?? ''}`} game={game} />
            ))}
          </div>
        ) : (
          <div className='mt-4 rounded-md border border-dashed border-[#232830] bg-[#2C313B] px-5 py-10 text-center'>
            <p className='font-display text-[1.3rem] text-neutral-100'>No rounds captured yet</p>
            <p className='mt-2 text-sm text-neutral-400'>
              Open bet88.ph or Stake, place a round, and the feed will populate here.
            </p>
          </div>
        )}
      </section>
      <section className='relative rounded-none border border-[#232830] bg-[#232830] p-4 h-[60lvh]'>
        <img
          src={'https://d1835mas0gwu6p.cloudfront.net/assets/shared/games/limbo/game-background.webp'}
          alt='diamond-city'
          className='absolute inset-0 object-cover size-full opacity-50 bottom-0'
        />
        <div className='flex items-center justify-between gap-3'>
          <div>
            <p className='text-[0.64rem] uppercase tracking-[0.28em] text-slate-400'>Network Surface</p>
            <h2 className='font-display mt-2 text-[1.55rem] leading-none text-white'>Capture Routes</h2>
          </div>
          <button
            onClick={toggleShowSettings}
            className='rounded-full border border-slate-200/80 bg-white px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-700 transition hover:border-slate-300 hover:text-slate-950'>
            {settingsVisible ? 'Hide Port' : 'Dev Port'}
          </button>
        </div>

        <div className='mt-4 flex flex-wrap gap-2'>
          {SUPPORTED_SITES.map((site) => (
            <div
              key={site.key}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] ${
                status.site === site.key
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200/80 bg-slate-50 text-slate-600'
              }`}>
              {site.label}
            </div>
          ))}
        </div>

        <div className='mt-4 grid grid-cols-2 gap-3'>
          <ProviderMetric label='bet88.ph' summary={stats.providers.bet88} tone='bg-black/40 text-[#46D266]' />
          <ProviderMetric label='Stake' summary={stats.providers.stake} tone='bg-black/50 text-[#46D266]' />
        </div>

        <div className='mt-4 rounded-md bg-black/30 text-[#46D266] p-4'>
          <p className='text-[0.64rem] uppercase tracking-[0.26em] text-slate-500'>Dev server relay</p>
          <p className='mt-2 text-sm text-slate-600'>
            Mirroring tracked rounds to{' '}
            <code className='rounded text-[]'>http://localhost:{devServerPort}/api/results</code>
          </p>

          {settingsVisible ? (
            <div className='mt-4 flex gap-2'>
              <input
                type='number'
                min='1'
                max='65535'
                value={devServerPort}
                onChange={(event) => setDevServerPort(parseInt(event.target.value, 10) || 3000)}
                className='flex-1 rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900'
                placeholder='3000'
              />
              <button
                onClick={() => saveDevServerPort(devServerPort)}
                className='rounded-[18px] bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800'>
                Save
              </button>
            </div>
          ) : (
            <p className='mt-4 text-sm font-semibold text-slate-900'>Port {devServerPort}</p>
          )}
        </div>
      </section>
    </>
  )
}
