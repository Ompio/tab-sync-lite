// background.js
import { getSavedTabs } from './storage.js';
import { syncTabs } from './tabs.js';

let autoSyncInterval = null;

// Use browser.* API for Firefox compatibility
const runtime = typeof browser !== 'undefined' ? browser.runtime : chrome.runtime;
const storage = typeof browser !== 'undefined' ? browser.storage : chrome.storage;

// Listen for changes to autoSync state from popup
runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SET_AUTO_SYNC') {
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
  autoSyncInterval = setInterval(async () => {
    try {
      const savedTabs = await getSavedTabs();
      await syncTabs(savedTabs);
      // Optionally: send notification or update badge
    } catch (e) {
      // Optionally: handle error
    }
  }, 30000);
}

function stopAutoSync() {
  if (autoSyncInterval) {
    clearInterval(autoSyncInterval);
    autoSyncInterval = null;
  }
}

// On extension startup, check persisted state and start autoSync if needed
storage.local.get(['autoSyncEnabled']).then((result) => {
  if (result.autoSyncEnabled) {
    startAutoSync();
  }
});
