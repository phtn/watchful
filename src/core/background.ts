import { getSupportedSite } from './siteConfig'

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

chrome.runtime.onMessage.addListener((message) => {
  if (message.type !== 'REQUEST_URL_STATUS') {
    return
  }

  void syncActiveTabStatus()
})
