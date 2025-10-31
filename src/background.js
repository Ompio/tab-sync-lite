// background.js
import { getSavedTabs } from './storage.js';
import { syncTabs } from './tabs.js';

let autoSyncInterval = null;

// Use browser.* API for Firefox compatibility
const runtime = typeof browser !== 'undefined' ? browser.runtime : chrome.runtime;
const storage = typeof browser !== 'undefined' ? browser.storage : chrome.storage;

// Debug utility
function debugLog(...args) {
  // Toggle this flag to enable/disable debug output
  const DEBUG = false;
  if (DEBUG) {
    // Use console.log, but you could also send to a file or notification
    console.log('[TabSyncer][background]', ...args);
  }
}

// Listen for changes to autoSync state from popup
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

// On extension startup, check persisted state and start autoSync if needed
storage.local.get(['autoSyncEnabled']).then((result) => {
  debugLog('Startup: autoSyncEnabled =', result.autoSyncEnabled);
  if (result.autoSyncEnabled) {
    startAutoSync();
  }
});
