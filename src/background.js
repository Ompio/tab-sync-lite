// Standalone background.js for Firefox/Chrome Manifest V3 background.scripts
// No import/export! All helpers inlined.

let autoSyncInterval = null;

const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
const runtime = browserAPI.runtime;
const storage = browserAPI.storage;
const tabsAPI = browserAPI.tabs;

// Debug utility
function debugLog(...args) {
  const DEBUG = false;
  if (DEBUG) {
    console.log('[TabSyncer][background]', ...args);
  }
}

function isValidTabUrl(url) {
  return url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('file://'));
}

async function getSavedTabs() {
  try {
    const data = await storage.sync.get(['syncedTabs']);
    return data['syncedTabs'] || [];
  } catch (error) {
    debugLog('Error getting saved tabs:', error);
    return [];
  }
}

async function syncTabs(savedTabs) {
  if (!Array.isArray(savedTabs)) {
    debugLog('Invalid savedTabs parameter:', savedTabs);
    return { status: 'Invalid saved tabs data', type: 'error' };
  }
  if (savedTabs.length === 0) {
    return { status: 'No saved tabs found', type: 'warning' };
  }
  const savedUrls = savedTabs.map(tab => tab.url).filter(isValidTabUrl);
  const currentTabs = await tabsAPI.query({});
  const currentUrls = currentTabs.map(tab => tab.url).filter(isValidTabUrl);
  const tabsToClose = currentTabs.filter(tab => isValidTabUrl(tab.url) && !savedUrls.includes(tab.url));
  const closeErrors = [];
  for (const tab of tabsToClose) {
    try {
      await tabsAPI.remove(tab.id);
    } catch (e) {
      closeErrors.push(`Failed to close tab: ${tab.url}`);
      debugLog(`Failed to close tab: ${tab.url}`, e);
    }
  }
  const tabsToOpen = savedTabs.filter(tab => isValidTabUrl(tab.url) && !currentUrls.includes(tab.url));
  const openErrors = [];
  for (const tab of tabsToOpen) {
    try {
      await tabsAPI.create({ url: tab.url });
    } catch (e) {
      openErrors.push(`Failed to open ${tab.url}`);
      debugLog(`Failed to open ${tab.url}:`, e);
    }
  }
  return {
    status: 'Sync complete',
    type: 'success',
    stats: {
      closed: tabsToClose.length - closeErrors.length,
      opened: tabsToOpen.length - openErrors.length,
      errors: [...closeErrors, ...openErrors]
    }
  };
}

runtime.onMessage.addListener((message, sender, sendResponse) => {
  debugLog('Received message:', message);
  if (message.type === 'SET_AUTO_SYNC') {
    debugLog('SET_AUTO_SYNC:', message.enabled);
    if (message.enabled) {
      startAutoSync();
    } else {
      stopAutoSync();
    }
    sendResponse({ status: 'ok' });
  }
});

function startAutoSync() {
  if (autoSyncInterval) return;
  debugLog('Starting autoSync interval');
  autoSyncInterval = setInterval(async () => {
    try {
      debugLog('AutoSync triggered');
      const savedTabs = await getSavedTabs();
      await syncTabs(savedTabs);
      debugLog('AutoSync complete');
    } catch (e) {
      debugLog('AutoSync error:', e);
    }
  }, 30000);
}

function stopAutoSync() {
  if (autoSyncInterval) {
    debugLog('Stopping autoSync interval');
    clearInterval(autoSyncInterval);
    autoSyncInterval = null;
  }
}

storage.local.get(['autoSyncEnabled']).then((result) => {
  debugLog('Startup: autoSyncEnabled =', result.autoSyncEnabled);
  if (result.autoSyncEnabled) {
    startAutoSync();
  }
});
