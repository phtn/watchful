// import { GeistPixelCircle } from 'geist/font/pixel'
import { startTransition, useCallback, useDeferredValue, useEffect, useState } from 'react'
import { SUPPORTED_SITES } from '../core/siteConfig'
import { deriveVirtualBankroll } from '../lib/virtual-bankroll'
import {
  EMPTY_STORED_DATA,
  EMPTY_VIRTUAL_BANKROLL,
  normalizeStoredData,
  normalizeVirtualBankroll,
  PanelStatus,
  type StoredData,
  type SupportedSiteKey,
  type VirtualBankrollState
} from '../types'
import { EMPTY_ROULETTE_STORED_DATA, normalizeRouletteStoredData, type RouletteStoredData } from '../types/roulette'
import { EMPTY_TENNIS_STORED_DATA, normalizeTennisStoredData, type TennisStoredData } from '../types/tennis'
import { GameClassSwitcher, type GameClassView } from './components/GameClassSwitcher'
import { GameEntry } from './components/GameEntry'
import { MainHeader } from './components/Header'
import { ProviderMetric } from './components/ProviderMetric'
import { Pulse } from './components/Pulse'
import { RouletteWorkspace } from './components/RouletteWorkspace'
import { TennisWorkspace } from './components/TennisWorkspace'
import { VirtualBankrollCard } from './components/VirtualBankrollCard'
import { getNetTone } from './lib/formatters'

const INITIAL_STATUS: PanelStatus = { connected: false, message: 'Checking the active tab...', site: null }

function sameStatus(left: PanelStatus, right: PanelStatus): boolean {
  return (
    left.connected === right.connected &&
    left.message === right.message &&
    left.site === right.site &&
    left.url === right.url
  )
}

function getStoredPort(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 3000
}

const App = () => {
  const [stats, setStats] = useState<StoredData>(EMPTY_STORED_DATA)
  const [status, setStatus] = useState<PanelStatus>(INITIAL_STATUS)
  const [simulated, setSimulated] = useState<boolean>(false)
  const [devServerPort, setDevServerPort] = useState<number>(3000)
  const [virtualBankroll, setVirtualBankroll] = useState<VirtualBankrollState>(EMPTY_VIRTUAL_BANKROLL)
  const [rouletteStats, setRouletteStats] = useState<RouletteStoredData>(EMPTY_ROULETTE_STORED_DATA)
  const [tennisStats, setTennisStats] = useState<TennisStoredData>(EMPTY_TENNIS_STORED_DATA)
  const [activeGameClass, setActiveGameClass] = useState<GameClassView>('originals')
  const [showSettings, setShowSettings] = useState(false)
  const deferredResults = useDeferredValue(stats.results)

  const loadStats = () => {
    chrome.storage.local.get(['casinoResults', 'virtualBankroll'], (data) => {
      startTransition(() => {
        setStats(normalizeStoredData(data.casinoResults, normalizeVirtualBankroll(data.virtualBankroll)))
      })
    })
  }

  const loadDevServerPort = () => {
    chrome.storage.local.get(['devServerPort'], (data) => {
      startTransition(() => {
        const nextPort = getStoredPort(data.devServerPort)
        setDevServerPort((currentPort) => (currentPort === nextPort ? currentPort : nextPort))
      })
    })
  }

  const loadVirtualBankroll = () => {
    chrome.storage.local.get(['virtualBankroll'], (data) => {
      startTransition(() => {
        setVirtualBankroll(normalizeVirtualBankroll(data.virtualBankroll))
      })
    })
  }

  const loadRouletteResults = () => {
    chrome.storage.local.get(['rouletteResults'], (data) => {
      startTransition(() => {
        setRouletteStats(normalizeRouletteStoredData(data.rouletteResults))
      })
    })
  }

  const loadTennisResults = () => {
    chrome.storage.local.get(['tennisResults'], (data) => {
      startTransition(() => {
        setTennisStats(normalizeTennisStoredData(data.tennisResults))
      })
    })
  }

  const persistVirtualBankroll = (nextState: VirtualBankrollState) => {
    chrome.storage.local.set({ virtualBankroll: nextState }, () => {
      startTransition(() => {
        setVirtualBankroll(nextState)
      })
    })
  }

  const requestUrlStatus = () => {
    chrome.runtime.sendMessage({ type: 'REQUEST_URL_STATUS' }, () => {
      if (chrome.runtime.lastError) {
        const nextStatus: PanelStatus = {
          connected: false,
          message: 'Background worker is unavailable.',
          site: null
        }

        startTransition(() => {
          setStatus((currentStatus) => (sameStatus(currentStatus, nextStatus) ? currentStatus : nextStatus))
        })
      }
    })
  }

  useEffect(() => {
    loadStats()
    loadDevServerPort()
    loadVirtualBankroll()
    loadRouletteResults()
    loadTennisResults()

    const storageListener = (changes: { [key: string]: chrome.storage.StorageChange }, namespace: string) => {
      if (namespace === 'local' && changes.casinoResults) {
        loadStats()
      }

      if (namespace === 'local' && changes.devServerPort) {
        loadDevServerPort()
      }

      if (namespace === 'local' && changes.virtualBankroll) {
        loadVirtualBankroll()
      }

      if (namespace === 'local' && changes.rouletteResults) {
        loadRouletteResults()
      }

      if (namespace === 'local' && changes.tennisResults) {
        loadTennisResults()
      }
    }

    const messageListener = (message: {
      type?: string
      isTargetSite?: boolean
      site?: SupportedSiteKey | null
      siteLabel?: string | null
      url?: string | null
    }) => {
      if (message.type !== 'URL_STATUS') {
        return
      }

      const nextStatus: PanelStatus = message.isTargetSite
        ? {
            connected: true,
            message: `Connected to ${message.siteLabel || 'a supported site'}.`,
            site: message.site ?? null,
            url: message.url || undefined
          }
        : {
            connected: false,
            message: 'Open bet88.ph or Stake to arm the listener.',
            site: null,
            url: message.url || undefined
          }

      startTransition(() => {
        setStatus((currentStatus) => (sameStatus(currentStatus, nextStatus) ? currentStatus : nextStatus))
      })
    }

    chrome.storage.onChanged.addListener(storageListener)
    chrome.runtime.onMessage.addListener(messageListener)
    requestUrlStatus()

    const interval = window.setInterval(() => {
      loadStats()
      loadRouletteResults()
      loadTennisResults()
    }, 4000)

    return () => {
      window.clearInterval(interval)
      chrome.storage.onChanged.removeListener(storageListener)
      chrome.runtime.onMessage.removeListener(messageListener)
    }
  }, [])

  const clearData = () => {
    if (!window.confirm('Clear all tracked game history?')) {
      return
    }

    chrome.storage.local.remove(['casinoResults', 'rouletteResults', 'tennisResults'], () => {
      startTransition(() => {
        setStats(EMPTY_STORED_DATA)
        setRouletteStats(EMPTY_ROULETTE_STORED_DATA)
        setTennisStats(EMPTY_TENNIS_STORED_DATA)
      })
    })
  }

  const clearRouletteResults = () => {
    if (!window.confirm('Clear captured roulette spins?')) {
      return
    }

    chrome.storage.local.remove(['rouletteResults'], () => {
      startTransition(() => {
        setRouletteStats(EMPTY_ROULETTE_STORED_DATA)
      })
    })
  }

  const clearTennisResults = () => {
    if (!window.confirm('Clear captured tennis board data?')) {
      return
    }

    chrome.storage.local.remove(['tennisResults'], () => {
      startTransition(() => {
        setTennisStats(EMPTY_TENNIS_STORED_DATA)
      })
    })
  }

  const saveDevServerPort = (port: number) => {
    const portNum = Math.max(1, Math.min(65535, port))
    chrome.storage.local.set({ devServerPort: portNum }, () => {
      startTransition(() => {
        setDevServerPort(portNum)
        setShowSettings(false)
      })
    })
  }

  const enableVirtualBankroll = (seedBalance: number, baseBetAmount: number) => {
    persistVirtualBankroll({
      enabled: true,
      seedBalance,
      baseBetAmount,
      replenishedTotal: 0,
      trackingStartedAt: Date.now()
    })
  }

  const disableVirtualBankroll = () => {
    persistVirtualBankroll({
      ...virtualBankroll,
      enabled: false
    })
  }

  const replenishVirtualBankroll = (amount: number) => {
    persistVirtualBankroll({
      ...virtualBankroll,
      replenishedTotal: virtualBankroll.replenishedTotal + amount
    })
  }

  const updateVirtualBankrollBetAmount = (amount: number) => {
    persistVirtualBankroll({
      ...virtualBankroll,
      baseBetAmount: amount
    })
  }

  const resetVirtualBankroll = () => {
    if (!window.confirm('Reset the virtual bankroll to its starting balance and restart profit/loss tracking?')) {
      return
    }

    persistVirtualBankroll({
      ...virtualBankroll,
      enabled: true,
      replenishedTotal: 0,
      trackingStartedAt: Date.now()
    })
  }

  const recentResults = deferredResults.slice(-18).reverse()
  const latestGame = recentResults[0]
  const totalStaked = stats.results.reduce((sum, game) => sum + (game.amount ?? 0), 0)
  const netProfit = stats.results.reduce((sum, game) => {
    const profit =
      game.profit ?? (game.payout !== undefined && game.amount !== undefined ? game.payout - game.amount : 0)
    return sum + profit
  }, 0)
  const bankrollSnapshot = deriveVirtualBankroll(virtualBankroll, deferredResults)
  const onGameClassChange = useCallback(() => {
    const order: GameClassView[] = ['originals', 'roulette', 'tennis']

    setActiveGameClass((currentValue) => {
      const currentIndex = order.indexOf(currentValue)
      return order[(currentIndex + 1) % order.length]
    })
  }, [])

  const toggleSimulated = useCallback(() => {
    setSimulated((prev) => !prev)
  }, [])

  return (
    <div className={`min-h-screen text-slate-950 bg-[#282828] antialiased`}>
      <div className='mx-auto flex max-w-4xl flex-col'>
        <MainHeader
          status={status}
          stats={stats}
          latestGame={latestGame}
          onGameClassChange={onGameClassChange}
          gameClass={activeGameClass}
        />
        <div className='hidden px-6 pt-3'>
          <GameClassSwitcher value={activeGameClass} onChange={setActiveGameClass} />
        </div>

        {activeGameClass === 'originals' ? (
          <>
            <div className='pt-2 px-6'>
              <Pulse
                requestUrlStatus={requestUrlStatus}
                clearData={clearData}
                totalStaked={totalStaked}
                netProfit={netProfit}
                latestGame={latestGame}
                getNetTone={getNetTone}
                simulated={simulated}
                toggleSimulated={toggleSimulated}
              />
            </div>
            {simulated && (
              <VirtualBankrollCard
                bankroll={virtualBankroll}
                snapshot={bankrollSnapshot}
                onEnable={enableVirtualBankroll}
                onDisable={disableVirtualBankroll}
                onUpdateBaseBetAmount={updateVirtualBankrollBetAmount}
                onReplenish={replenishVirtualBankroll}
                onReset={resetVirtualBankroll}
              />
            )}
            {/*<KenoRecommendation results={stats.results} />*/}
            <section className='rounded-none border border-white/60 bg-white/60 p-4 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.35)] backdrop-blur-xl'>
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
                <div className='mt-4 rounded-[24.01px] border border-dashed border-slate-200 bg-slate-50/80 px-5 py-10 text-center'>
                  <p className='font-display text-[1.3rem] text-slate-900'>No rounds captured yet</p>
                  <p className='mt-2 text-sm text-slate-500'>
                    Open bet88.ph or Stake, place a round, and the feed will populate here.
                  </p>
                </div>
              )}
            </section>
            <section className='rounded-none border border-white/60 bg-white/76 p-4 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.35)] backdrop-blur-xl'>
              <div className='flex items-center justify-between gap-3'>
                <div>
                  <p className='text-[0.64rem] uppercase tracking-[0.28em] text-slate-500'>Network Surface</p>
                  <h2 className='font-display mt-2 text-[1.55rem] leading-none text-slate-900'>Capture Routes</h2>
                </div>
                <button
                  onClick={() => setShowSettings((value) => !value)}
                  className='rounded-full border border-slate-200/80 bg-white px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-700 transition hover:border-slate-300 hover:text-slate-950'>
                  {showSettings ? 'Hide Port' : 'Dev Port'}
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
                <ProviderMetric
                  label='bet88.ph'
                  summary={stats.providers.bet88}
                  tone='border-sky-200/80 bg-sky-50 text-sky-800'
                />
                <ProviderMetric
                  label='Stake'
                  summary={stats.providers.stake}
                  tone='border-emerald-200/80 bg-emerald-50 text-emerald-800'
                />
              </div>

              <div className='mt-4 rounded-[24.01px] border border-white/70 bg-[linear-gradient(180deg,rgba(240,244,255,0.94),rgba(255,255,255,0.92))] p-4'>
                <p className='text-[0.64rem] uppercase tracking-[0.26em] text-slate-500'>Dev server relay</p>
                <p className='mt-2 text-sm text-slate-600'>
                  Mirroring tracked rounds to{' '}
                  <code className='rounded bg-white px-1.5 py-1 text-slate-800'>
                    http://localhost:{devServerPort}/api/results
                  </code>
                </p>

                {showSettings ? (
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
        ) : activeGameClass === 'roulette' ? (
          <div className='px-2 pt-2'>
            <RouletteWorkspace status={status} stats={rouletteStats} onReset={clearRouletteResults} />
          </div>
        ) : (
          <div className='px-2 pt-2'>
            <TennisWorkspace status={status} stats={tennisStats} onReset={clearTennisResults} />
          </div>
        )}
      </div>
    </div>
  )
}

export default App
