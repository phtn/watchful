import { startTransition, useDeferredValue, useEffect, useState } from 'react'
import { getSiteLabel, SUPPORTED_SITES } from '../core/siteConfig'
import {
  EMPTY_STORED_DATA,
  normalizeStoredData,
  type GameResult,
  type StoredData,
  type SupportedSiteKey
} from '../types'

interface PanelStatus {
  connected: boolean
  message: string
  site: SupportedSiteKey | null
  url?: string
}

const INITIAL_STATUS: PanelStatus = {
  connected: false,
  message: 'Checking the active tab...',
  site: null
}

function sameStatus(left: PanelStatus, right: PanelStatus): boolean {
  return (
    left.connected === right.connected &&
    left.message === right.message &&
    left.site === right.site &&
    left.url === right.url
  )
}

function formatGameLabel(value?: string): string {
  if (!value) {
    return 'Unknown Game'
  }

  return value.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatAmount(value?: number, currency?: string): string {
  if (value === undefined) {
    return '—'
  }

  const maximumFractionDigits = Number.isInteger(value) ? 0 : 4
  const formatted = value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits
  })

  return currency ? `${formatted} ${currency.toUpperCase()}` : formatted
}

function formatSignedAmount(value?: number, currency?: string): string {
  if (value === undefined) {
    return '—'
  }

  const sign = value > 0 ? '+' : value < 0 ? '-' : ''
  return `${sign}${formatAmount(Math.abs(value), currency)}`
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getSiteBadgeClass(site?: SupportedSiteKey): string {
  switch (site) {
    case 'stake':
      return 'border-emerald-200/90 bg-emerald-50 text-emerald-700'
    case 'bet88':
      return 'border-sky-200/90 bg-sky-50 text-sky-700'
    default:
      return 'border-slate-200/90 bg-slate-100 text-slate-600'
  }
}

function getResultClass(result: GameResult['result']): string {
  return result === 'win'
    ? 'border-emerald-300/80 bg-emerald-50 text-emerald-700'
    : 'border-rose-300/80 bg-rose-50 text-rose-700'
}

function getNetTone(value: number): string {
  if (value > 0) {
    return 'text-emerald-600'
  }

  if (value < 0) {
    return 'text-rose-600'
  }

  return 'text-slate-600'
}

function formatScalar(value: number | string): string {
  if (typeof value === 'number') {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4
    })
  }

  return value
}

function getGameInsights(game: GameResult): {
  chips: string[]
  tracks: { label: string; values: number[]; tone: 'selected' | 'drawn' }[]
  risk?: string
} {
  const chips: string[] = []
  const tracks: { label: string; values: number[]; tone: 'selected' | 'drawn' }[] = []

  if (game.providerData.provider === 'stake') {
    if (game.providerData.game === 'keno') {
      chips.push(`Payout x${formatScalar(game.providerData.response.payoutMultiplier)}`)
      tracks.push({
        label: 'Selected',
        values: game.providerData.response.state.selectedNumbers,
        tone: 'selected'
      })
      tracks.push({
        label: 'Drawn',
        values: game.providerData.response.state.drawnNumbers,
        tone: 'drawn'
      })

      return {
        chips,
        tracks,
        risk: game.providerData.response.state.risk
      }
    }

    if (game.providerData.game === 'limbo') {
      chips.push(`Target x${formatScalar(game.providerData.response.state.multiplierTarget)}`)
      chips.push(`Result x${formatScalar(game.providerData.response.state.result)}`)
      return { chips, tracks }
    }

    if (game.providerData.game === 'dice') {
      chips.push(`Roll ${formatScalar(game.providerData.response.state.result)}`)
      chips.push(
        `${formatGameLabel(game.providerData.response.state.condition)} ${formatScalar(game.providerData.response.state.target)}`
      )
      return { chips, tracks }
    }

    chips.push(`Mines ${game.providerData.response.state.minesCount}`)
    tracks.push({
      label: 'Opened',
      values: game.providerData.response.state.rounds.map((round) => round.field),
      tone: 'selected'
    })
    tracks.push({
      label: 'Mines',
      values: game.providerData.response.state.mines,
      tone: 'drawn'
    })

    return { chips, tracks }
  }

  if (game.providerData.game === 'keno') {
    chips.push(`Matches ${formatScalar(game.providerData.response.custom.numberOfMatches)}`)
    tracks.push({
      label: 'Drawn',
      values: game.providerData.response.custom.drawNumbers,
      tone: 'drawn'
    })
    return { chips, tracks }
  }

  if (game.providerData.game === 'limbo') {
    chips.push(`Result x${formatScalar(game.providerData.response.custom.multiplier)}`)
    chips.push(`Chance ${formatScalar(game.providerData.response.custom.winningChance)}`)
    return { chips, tracks }
  }

  if (game.providerData.game === 'dice') {
    chips.push(`Result ${game.providerData.response.custom.result}`)
    chips.push(`Chance ${game.providerData.response.custom.winningChance}`)
    return { chips, tracks }
  }

  tracks.push({
    label: 'Selected',
    values: game.providerData.response.custom.selected,
    tone: 'selected'
  })
  tracks.push({
    label: 'Mines',
    values: game.providerData.response.custom.mines,
    tone: 'drawn'
  })
  chips.push(`Mines ${formatScalar(game.providerData.response.custom.mineCount)}`)

  return { chips, tracks }
}

function getStoredPort(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 3000
}

const App = () => {
  const [stats, setStats] = useState<StoredData>(EMPTY_STORED_DATA)
  const [status, setStatus] = useState<PanelStatus>(INITIAL_STATUS)
  const [devServerPort, setDevServerPort] = useState<number>(3000)
  const [showSettings, setShowSettings] = useState(false)
  const deferredResults = useDeferredValue(stats.results)

  const loadStats = () => {
    chrome.storage.local.get(['casinoResults'], (data) => {
      startTransition(() => {
        setStats(normalizeStoredData(data.casinoResults))
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

    const storageListener = (changes: { [key: string]: chrome.storage.StorageChange }, namespace: string) => {
      if (namespace === 'local' && changes.casinoResults) {
        loadStats()
      }

      if (namespace === 'local' && changes.devServerPort) {
        loadDevServerPort()
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

    chrome.storage.local.remove(['casinoResults'], () => {
      startTransition(() => {
        setStats(EMPTY_STORED_DATA)
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

  const recentResults = deferredResults.slice(-18).reverse()
  const latestGame = recentResults[0]
  const totalStaked = stats.results.reduce((sum, game) => sum + (game.amount ?? 0), 0)
  const netProfit = stats.results.reduce((sum, game) => {
    const profit =
      game.profit ?? (game.payout !== undefined && game.amount !== undefined ? game.payout - game.amount : 0)
    return sum + profit
  }, 0)

  return (
    <div className='min-h-screen text-slate-950'>
      <div className='mx-auto flex max-w-[440px] flex-col gap-4'>
        <header className='relative overflow-hidden rounded-t-[10px] rounded-b-[32.01px] border border-white/20 bg-[#09111f] text-white shadow-[0_32px_90px_-38px_rgba(15,23,42,0.78)]'>
          <div className='absolute inset-x-[-15%] top-[-24%] h-48 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.44),transparent_66%)] blur-2xl' />
          <div className='absolute bottom-[-28%] right-[-16%] h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.28),transparent_70%)] blur-2xl' />
          <div className='relative space-y-5 p-5'>
            <div className='flex items-start justify-between gap-4'>
              <div className='flex items-center gap-3'>
                <div className='p-2'>
                  <img src='icons/icon-128.png' alt='Watchful Wind' className='h-12 w-12 p-1' />
                </div>
                <div>
                  <p className='text-[0.64rem] uppercase tracking-[0.34em] text-cyan-100/70'>Session Observatory</p>
                  <h1 className='font-display mt-2 text-[2rem] leading-none'>Watchful Wind</h1>
                </div>
              </div>
              <div
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.22em] ${
                  status.connected
                    ? 'border-emerald-300/35 bg-emerald-300/10 text-emerald-100'
                    : 'border-white/10 bg-white/6 text-slate-300'
                }`}>
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    status.connected ? 'animate-[pulse_2.4s_ease-in-out_infinite] bg-emerald-300' : 'bg-slate-500'
                  }`}
                />
                {status.connected ? 'Live' : 'Idle'}
              </div>
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <HeroMetric
                label='Win Rate'
                value={`${stats.winRate.toFixed(1)}%`}
                detail={`${stats.wins} wins / ${stats.losses} losses`}
              />
              <HeroMetric
                label='Tracked Bets'
                value={stats.totalGames.toString()}
                detail={latestGame ? `Last ${formatTime(latestGame.timestamp)}` : 'No rounds yet'}
              />
            </div>

            <div className='rounded-[24.01px] border border-white/10 bg-white/8 p-4 backdrop-blur-md'>
              <div className='flex items-start justify-between gap-3'>
                <div>
                  <p className='text-[0.64rem] uppercase tracking-[0.28em] text-cyan-100/65'>Listening Now</p>
                  <h2 className='mt-1 text-lg font-semibold text-white'>
                    {status.connected ? getSiteLabel(status.site) : 'Awaiting a supported tab'}
                  </h2>
                  <p className='mt-1 text-sm text-slate-300'>{status.message}</p>
                </div>
                <div className='rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.24em] text-slate-200'>
                  {status.site ? status.site : 'standby'}
                </div>
              </div>
              {status.url ? (
                <p className='mt-3 truncate text-xs text-slate-400'>{status.url.replace(/^https?:\/\//, '')}</p>
              ) : null}
            </div>
          </div>
        </header>

        <section className='rounded-[30px] border border-white/60 bg-white/76 p-4 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.35)] backdrop-blur-xl'>
          <div className='flex items-center justify-between gap-3'>
            <div>
              <p className='text-[0.64rem] uppercase tracking-[0.28em] text-slate-500'>Signal Deck</p>
              <h2 className='font-display mt-2 text-[1.55rem] leading-none text-slate-900'>Performance Pulse</h2>
            </div>
            <button
              onClick={requestUrlStatus}
              className='rounded-full border border-slate-200/80 bg-white px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-700 transition hover:border-slate-300 hover:text-slate-950'>
              Refresh
            </button>
          </div>

          <div className='mt-4 grid grid-cols-3 gap-3'>
            <PanelMetric label='Staked' value={formatAmount(totalStaked)} tone='text-slate-900' />
            <PanelMetric label='Net' value={formatSignedAmount(netProfit)} tone={getNetTone(netProfit)} />
            <PanelMetric
              label='Latest'
              value={latestGame ? formatGameLabel(latestGame.game) : 'None'}
              tone='text-slate-900'
            />
          </div>

          <div className='mt-4 grid grid-cols-2 gap-3'>
            <button
              onClick={requestUrlStatus}
              className='rounded-[20px] border border-sky-200/70 bg-sky-50 px-4 py-3 text-left text-sm font-semibold text-sky-800 transition hover:border-sky-300 hover:bg-sky-100'>
              Rescan current tab
            </button>
            <button
              onClick={clearData}
              className='rounded-[20px] border border-rose-200/70 bg-rose-50 px-4 py-3 text-left text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100'>
              Clear stored rounds
            </button>
          </div>
        </section>

        <section className='rounded-[30px] border border-white/60 bg-white/76 p-4 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.35)] backdrop-blur-xl'>
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

        <section className='rounded-[32.01px] border border-white/60 bg-white/76 p-4 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.35)] backdrop-blur-xl'>
          <div className='flex items-center justify-between gap-3'>
            <div>
              <p className='text-[0.64rem] uppercase tracking-[0.28em] text-slate-500'>Recent Traffic</p>
              <h2 className='font-display mt-2 text-[1.55rem] leading-none text-slate-900'>Captured Games</h2>
            </div>
            <div className='rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600'>
              {recentResults.length} shown
            </div>
          </div>

          {recentResults.length > 0 ? (
            <div className='mt-4 max-h-[520px] space-y-3 overflow-y-auto pr-1'>
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
      </div>
    </div>
  )
}

function HeroMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className='rounded-[24.01px] border border-white/10 bg-white/8 p-4 backdrop-blur-md'>
      <p className='text-[0.62rem] uppercase tracking-[0.26em] text-cyan-100/65'>{label}</p>
      <p className='mt-2 text-3xl font-semibold text-white'>{value}</p>
      <p className='mt-1 text-xs text-slate-300'>{detail}</p>
    </div>
  )
}

function PanelMetric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className='rounded-[22px] border border-slate-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,247,250,0.88))] p-4'>
      <p className='text-[0.62rem] uppercase tracking-[0.24em] text-slate-500'>{label}</p>
      <p className={`mt-2 text-lg font-semibold ${tone}`}>{value}</p>
    </div>
  )
}

function ProviderMetric({
  label,
  summary,
  tone
}: {
  label: string
  summary: StoredData['providers'][SupportedSiteKey]
  tone: string
}) {
  return (
    <div className={`rounded-[22px] border p-4 ${tone}`}>
      <p className='text-[0.62rem] uppercase tracking-[0.22em]'>{label}</p>
      <p className='mt-2 text-lg font-semibold'>{summary.totalGames} rounds</p>
      <p className='mt-1 text-xs opacity-80'>{summary.winRate.toFixed(1)}% win rate</p>
    </div>
  )
}

function GameEntry({ game }: { game: GameResult }) {
  const profit =
    game.profit ?? (game.payout !== undefined && game.amount !== undefined ? game.payout - game.amount : undefined)
  const { chips, tracks, risk } = getGameInsights(game)
  const roundLabel = game.roundId !== undefined ? `#${String(game.roundId).slice(0, 8)}` : null

  return (
    <article className='rounded-[26px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,248,251,0.92))] p-4 shadow-[0_18px_48px_-34px_rgba(15,23,42,0.36)] [content-visibility:auto]'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <div className='flex flex-wrap items-center gap-2'>
            <span
              className={`rounded-full border px-2.5 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.18em] ${getSiteBadgeClass(game.provider)}`}>
              {getSiteLabel(game.provider)}
            </span>
            <span className='rounded-full border border-slate-200/90 bg-slate-50 px-2.5 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-slate-600'>
              {formatGameLabel(game.game)}
            </span>
            {game.action !== 'bet' ? (
              <span className='rounded-full border border-violet-200/90 bg-violet-50 px-2.5 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-violet-700'>
                {formatGameLabel(game.action)}
              </span>
            ) : null}
            {risk ? (
              <span className='rounded-full border border-amber-200/90 bg-amber-50 px-2.5 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-amber-700'>
                {risk} risk
              </span>
            ) : null}
          </div>

          <h3 className='mt-3 text-lg font-semibold text-slate-900'>{formatAmount(game.amount, game.currency)}</h3>

          <div className='mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500'>
            <span>Payout {formatAmount(game.payout, game.currency)}</span>
            <span className={profit !== undefined ? getNetTone(profit) : 'text-slate-500'}>
              Net {formatSignedAmount(profit, game.currency)}
            </span>
            {game.userName ? <span>@{game.userName}</span> : null}
            {roundLabel ? <span>{roundLabel}</span> : null}
          </div>

          {chips.length > 0 ? (
            <div className='mt-3 flex flex-wrap gap-2'>
              {chips.map((chip) => (
                <span
                  key={chip}
                  className='rounded-full border border-slate-200/90 bg-white px-2.5 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-slate-600'>
                  {chip}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className='text-right'>
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.18em] ${getResultClass(game.result)}`}>
            {game.result}
          </span>
          <p className='mt-3 text-sm font-semibold text-slate-700'>{formatTime(game.timestamp)}</p>
          <p className='mt-1 text-xs text-slate-400'>{formatDateTime(game.timestamp)}</p>
        </div>
      </div>

      {tracks.length > 0 && (
        <div className='mt-4 rounded-[20px] border border-slate-100 bg-slate-50/90 p-3'>
          {tracks.map((track, index) => (
            <div key={`${track.label}-${index}`} className={index > 0 ? 'mt-3' : ''}>
              <NumberTrack label={track.label} values={track.values} tone={track.tone} />
            </div>
          ))}
        </div>
      )}
    </article>
  )
}

function NumberTrack({ label, values, tone }: { label: string; values: number[]; tone: 'selected' | 'drawn' }) {
  const numberClass =
    tone === 'selected' ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-slate-200 bg-white text-slate-700'

  return (
    <div>
      <p className='text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-slate-500'>{label}</p>
      <div className='mt-2 flex flex-wrap gap-1.5'>
        {values.map((value) => (
          <span
            key={`${label}-${value}`}
            className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full border px-2 text-xs font-semibold ${numberClass}`}>
            {value}
          </span>
        ))}
      </div>
    </div>
  )
}

export default App
