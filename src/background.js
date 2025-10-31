// I know this violates the don't repeat yourself principle, but don't want to learn more than i need to fix it.

let autoSyncInterval = null;
let hasAutoSynced = false;

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
  hasAutoSynced = false;
  // Initial sync after 5 seconds
  setTimeout(async () => {
    try {
      debugLog('AutoSync initial sync triggered');
      if (!hasAutoSynced) {
        const savedTabs = await getSavedTabs();
        await syncTabs(savedTabs);
        debugLog('AutoSync: performed initial sync');
        hasAutoSynced = true;
      }
    } catch (e) {
      debugLog('AutoSync error (initial):', e);
    }
  }, 5000);
  // Then every 30 seconds, save open tabs
  autoSyncInterval = setInterval(async () => {
    try {
      debugLog('AutoSync triggered');
      // Save currently open tabs to storage
      const tabs = await browserAPI.tabs.query({});
      const openTabs = tabs.filter(tab => isValidTabUrl(tab.url)).map(tab => ({ url: tab.url }));
      const timestamp = Date.now();
      const payload = openTabs.map(tab => ({ url: tab.url, action: 'created', timestamp }));
      await browserAPI.storage.sync.set({ ['syncedTabs']: payload, ['lastSync']: timestamp });
      debugLog('AutoSync: saved open tabs to storage');
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

// Save open tabs to storage on browser shutdown (if possible)
if (runtime && runtime.onSuspend) {
  runtime.onSuspend.addListener(async () => {
    debugLog('Browser is suspending, saving open tabs');
    try {
      const tabs = await browserAPI.tabs.query({});
      const openTabs = tabs.filter(tab => isValidTabUrl(tab.url)).map(tab => ({ url: tab.url }));
      const timestamp = Date.now();
      const payload = openTabs.map(tab => ({ url: tab.url, action: 'created', timestamp }));
      await browserAPI.storage.sync.set({ ['syncedTabs']: payload, ['lastSync']: timestamp });
      debugLog('Saved open tabs to storage on suspend');
    } catch (e) {
      debugLog('Error saving tabs on suspend:', e);
    }
  });
}

storage.local.get(['autoSyncEnabled']).then((result) => {
  debugLog('Startup: autoSyncEnabled =', result.autoSyncEnabled);
  if (result.autoSyncEnabled) {
    startAutoSync();
  }
});
