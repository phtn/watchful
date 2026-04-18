import { getSupportedSite } from './siteConfig'

// ──────────────────────────────────────────────────────────────────────────
// CDP-based trusted click (bypasses isTrusted checks in Evolution's framework)
// ──────────────────────────────────────────────────────────────────────────

interface TrustedClickResult {
  ok: boolean
  error?: string
  x?: number
  y?: number
}

const attachedTabs = new Set<number>()

async function ensureDebuggerAttached(tabId: number): Promise<void> {
  if (attachedTabs.has(tabId)) return
  await chrome.debugger.attach({ tabId }, '1.3')
  attachedTabs.add(tabId)
  await chrome.debugger.sendCommand({ tabId }, 'DOM.enable', {})
  await chrome.debugger.sendCommand({ tabId }, 'Page.enable', {})
}

chrome.debugger.onDetach.addListener(({ tabId }) => {
  if (tabId !== undefined) attachedTabs.delete(tabId)
})

// Pending coord lookups: any frame's content script may resolve these by sending
// { type: 'EVO_COORDS_FOUND', requestId, x, y } after walking the frame chain up
// to the top viewport.
interface PendingCoordRequest {
  resolve: (coords: { x: number; y: number; frame: string } | null) => void
  timer: ReturnType<typeof setTimeout>
}
const pendingCoordRequests = new Map<string, PendingCoordRequest>()

function newRequestId(): string {
  return `evo-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

async function locateElementInTopViewport(
  tabId: number,
  selector: string,
  timeoutMs = 1500
): Promise<{ x: number; y: number; frame: string } | null> {
  const requestId = newRequestId()

  const coordsPromise = new Promise<{ x: number; y: number; frame: string } | null>((resolve) => {
    const timer = setTimeout(() => {
      if (pendingCoordRequests.has(requestId)) {
        pendingCoordRequests.delete(requestId)
        resolve(null)
      }
    }, timeoutMs)
    pendingCoordRequests.set(requestId, { resolve, timer })
  })

  let frames: chrome.webNavigation.GetAllFrameResultDetails[] | null = null
  try {
    frames = await chrome.webNavigation.getAllFrames({ tabId })
  } catch {
    frames = null
  }

  if (!frames || frames.length === 0) {
    // Fall back to top frame only
    try {
      await chrome.tabs.sendMessage(tabId, { type: 'EVO_FIND_AND_REPORT', selector, requestId })
    } catch {
      // ignore
    }
  } else {
    for (const frame of frames) {
      try {
        await chrome.tabs.sendMessage(
          tabId,
          { type: 'EVO_FIND_AND_REPORT', selector, requestId },
          { frameId: frame.frameId }
        )
      } catch {
        // Some frames (chrome://, devtools) won't have our content script — ignore.
      }
    }
  }

  return coordsPromise
}

async function dispatchTrustedClickAt(tabId: number, x: number, y: number): Promise<void> {
  const base = { x, y, button: 'left' as const, clickCount: 1, buttons: 1 }
  await chrome.debugger.sendCommand({ tabId }, 'Input.dispatchMouseEvent', { ...base, type: 'mouseMoved' })
  await chrome.debugger.sendCommand({ tabId }, 'Input.dispatchMouseEvent', { ...base, type: 'mousePressed' })
  await chrome.debugger.sendCommand({ tabId }, 'Input.dispatchMouseEvent', { ...base, type: 'mouseReleased' })
}

/**
 * Asks every content-script frame which chip is currently active in Evolution.
 * Returns the data-value of the first frame that reports a match, or null when
 * no frame can determine the selection state (graceful no-op).
 */
async function getEvolutionSelectedChip(tabId: number): Promise<number | null> {
  let frames: chrome.webNavigation.GetAllFrameResultDetails[] | null = null
  try {
    frames = await chrome.webNavigation.getAllFrames({ tabId })
  } catch {
    frames = null
  }

  const framesToCheck = frames ?? ([] as chrome.webNavigation.GetAllFrameResultDetails[])

  for (const frame of framesToCheck) {
    try {
      const response = await new Promise<{ value: number | null } | null>((resolve) => {
        chrome.tabs.sendMessage(
          tabId,
          { type: 'EVO_GET_SELECTED_CHIP' },
          { frameId: frame.frameId },
          (resp) => {
            if (chrome.runtime.lastError) {
              resolve(null)
            } else {
              resolve(resp as { value: number | null } | null)
            }
          }
        )
      })
      if (response?.value != null) return response.value
    } catch {
      // Frame has no content script — skip
    }
  }
  return null
}

async function trustedClickBySelector(tabId: number, selector: string): Promise<TrustedClickResult> {
  try {
    await ensureDebuggerAttached(tabId)

    const coords = await locateElementInTopViewport(tabId, selector)
    if (!coords) {
      return { ok: false, error: `Element not found in any frame: ${selector}` }
    }

    await dispatchTrustedClickAt(tabId, coords.x, coords.y)

    console.log('[watchful-wind] trusted click', {
      selector,
      x: coords.x,
      y: coords.y,
      frame: coords.frame
    })

    return { ok: true, x: coords.x, y: coords.y }
  } catch (error) {
    return { ok: false, error: String(error) }
  }
}

async function getTabWithUrl(tabId: number, fallback?: chrome.tabs.Tab): Promise<chrome.tabs.Tab | null> {
  if (fallback?.url) {
    return fallback
  }

  try {
    return await chrome.tabs.get(tabId)
  } catch (error) {
    console.error('Failed to read tab details:', error)
    return null
  }
}

async function updateSidePanel(tabId: number, url?: string | null): Promise<void> {
  const site = getSupportedSite(url)

  await chrome.sidePanel.setOptions({
    tabId,
    path: 'sidepanel.html',
    enabled: Boolean(site)
  })
}

function broadcastUrlStatus(tab?: chrome.tabs.Tab): void {
  const site = getSupportedSite(tab?.url)

  chrome.runtime.sendMessage(
    {
      type: 'URL_STATUS',
      isTargetSite: Boolean(site),
      site: site?.key ?? null,
      siteLabel: site?.label ?? null,
      url: tab?.url ?? null
    },
    () => {
      const message = chrome.runtime.lastError?.message

      if (message && !message.includes('Could not establish connection')) {
        console.warn('Failed to broadcast URL status:', message)
      }
    }
  )
}

async function syncTabStatus(tabId: number, fallback?: chrome.tabs.Tab): Promise<void> {
  const tab = await getTabWithUrl(tabId, fallback)
  if (!tab) {
    return
  }

  try {
    await updateSidePanel(tabId, tab.url)
    broadcastUrlStatus(tab)
  } catch (error) {
    console.error('Failed to sync tab status:', error)
  }
}

async function syncActiveTabStatus(): Promise<void> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
  const activeTab = tabs[0]

  if (!activeTab?.id) {
    return
  }

  await syncTabStatus(activeTab.id, activeTab)
}

chrome.action.onClicked.addListener(async (clickedTab) => {
  if (!clickedTab.id) {
    return
  }

  const tab = await getTabWithUrl(clickedTab.id, clickedTab)
  if (!tab) {
    return
  }

  try {
    await updateSidePanel(tab.id!, tab.url)
    broadcastUrlStatus(tab)

    if (!getSupportedSite(tab.url)) {
      return
    }

    await chrome.sidePanel.open({ tabId: tab.id! })
  } catch (error) {
    console.error('Failed to open side panel:', error)
  }
})

chrome.runtime.onInstalled.addListener(() => {
  void syncActiveTabStatus()
})

chrome.runtime.onStartup.addListener(() => {
  void syncActiveTabStatus()
})

chrome.tabs.onUpdated.addListener(async (tabId: number, info: chrome.tabs.OnUpdatedInfo, tab: chrome.tabs.Tab) => {
  if (!tab.url) {
    return
  }

  await updateSidePanel(tabId, tab.url)

  if (info.status === 'complete') {
    broadcastUrlStatus(tab)
  }
})

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  await syncTabStatus(tabId)
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'REQUEST_URL_STATUS') {
    void syncActiveTabStatus()
    return
  }

  if (message.type === 'EVO_COORDS_FOUND') {
    const { requestId, x, y, frame } = message as {
      requestId: string
      x: number
      y: number
      frame: string
    }
    const pending = pendingCoordRequests.get(requestId)
    if (pending) {
      clearTimeout(pending.timer)
      pendingCoordRequests.delete(requestId)
      pending.resolve({ x, y, frame })
    }
    return
  }

  if (message.type === 'CLICK_EVOLUTION_ELEMENT') {
    void (async () => {
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
        const activeTab = tabs[0]
        if (!activeTab?.id) {
          sendResponse({ ok: false, error: 'No active tab' })
          return
        }
        const result = await trustedClickBySelector(activeTab.id, message.selector)
        sendResponse(result)
      } catch (error) {
        sendResponse({ ok: false, error: String(error) })
      }
    })()
    return true
  }

  if (message.type === 'PLACE_EVOLUTION_BETS') {
    void (async () => {
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
        const activeTab = tabs[0]
        if (!activeTab?.id) {
          sendResponse({ ok: false, error: 'No active tab' })
          return
        }

        const { chipValue, numbers } = message as { chipValue: number; numbers: number[] }

        // Click the chip to select it in Evolution before placing any bets.
        const chipResult = await trustedClickBySelector(
          activeTab.id,
          `div[data-role="chip"][data-value="${chipValue}"]`
        )
        if (!chipResult.ok) {
          sendResponse({ ok: false, error: `Chip selection failed: ${chipResult.error}`, placed: [], missed: numbers })
          return
        }

        // Give Evolution's chip-select animation time to settle.
        await new Promise((r) => setTimeout(r, 200))

        // Verify the chip actually switched in Evolution's DOM before placing bets.
        // If we can read the active chip and it doesn't match, retry the click once.
        const activeChip = await getEvolutionSelectedChip(activeTab.id)
        if (activeChip !== null && Math.abs(activeChip - chipValue) > 0.001) {
          console.warn(
            `[watchful-wind] Chip mismatch — expected ${chipValue}, Evolution shows ${activeChip}. Retrying click.`
          )
          await trustedClickBySelector(activeTab.id, `div[data-role="chip"][data-value="${chipValue}"]`)
          await new Promise((r) => setTimeout(r, 200))
        }

        const placed: number[] = []
        const missed: number[] = []

        for (const num of numbers) {
          const result = await trustedClickBySelector(activeTab.id, `[data-bet-spot-id="${num}"]`)
          if (result.ok) {
            placed.push(num)
          } else {
            missed.push(num)
          }
          // 220 ms lets the chip-placement animation complete before the next click.
          await new Promise((r) => setTimeout(r, 140))
        }

        sendResponse({ ok: placed.length > 0, placed, missed })
      } catch (error) {
        sendResponse({ ok: false, error: String(error) })
      }
    })()
    return true
  }
})
