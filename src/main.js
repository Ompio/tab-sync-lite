import { saveTabsToStorage, getSavedTabs, getAllSyncData } from './storage.js';
import { getAllOpenTabs, syncTabs} from './tabs.js';
import { calculateStorageUsage } from './utils.js';
import { updateStatus, renderMemoryUsage, renderTabList } from './ui.js';

document.addEventListener('DOMContentLoaded', async () => {
    const saveButton = document.getElementById('saveTabsButton');
    const syncButton = document.getElementById('syncTabsButton');
    const downloadButton = document.getElementById('downloadTabsButton');
    const memoryContainer = document.getElementById('memoryUsage');
    const tabListContainer = document.getElementById('savedTabsList');
    const autoSyncToggle = document.getElementById('autoSyncToggle');
    const status = document.getElementById('status');
    const body = document.body;

    // Restore autoSync state from storage
    try {
        const result = await storage.local.get(['autoSyncEnabled']);
        if (result.autoSyncEnabled) {
            autoSyncToggle.checked = true;
            status.textContent = "Auto sync enabled";
            body.classList.add('sync-active');
        } else {
            autoSyncToggle.checked = false;
            status.textContent = "Auto sync disabled";
            body.classList.remove('sync-active');
        }
    } catch (error) {
        console.warn('Failed to restore auto sync state:', error);
    }

    const cleanup = new Set();

    if (saveButton) {
        const saveHandler = async () => {
            updateStatus('Saving tabs...');
            try {
                const openTabs = await getAllOpenTabs();
                await saveTabsToStorage(openTabs);
                const allData = await getAllSyncData();
                renderTabList(tabListContainer, allData.syncedTabs || []);
                updateStatus('Tabs saved successfully.', 'green');
                const usage = calculateStorageUsage(allData);
                renderMemoryUsage(memoryContainer, usage);
            } catch (e) {
                updateStatus(e.message || 'Error saving tabs.', 'red');
                console.error(e);
            }
        };
        saveButton.addEventListener('click', saveHandler);
        cleanup.add(() => saveButton.removeEventListener('click', saveHandler));
    }

    if (syncButton) {
        const syncHandler = async () => {
            updateStatus('Syncing tabs...');
            try {
                const savedTabs = await getSavedTabs();
                const result = await syncTabs(savedTabs);
                renderTabList(tabListContainer, savedTabs || []);
                updateStatus(result.status, result.type === 'warning' ? 'orange' : 'green');
                if (result.stats?.errors?.length > 0) {
                    console.warn('Sync errors:', result.stats.errors);
                }
            } catch (e) {
                updateStatus(e.message || 'Sync error.', 'red');
                console.error(e);
            }
        };
        syncButton.addEventListener('click', syncHandler);
        cleanup.add(() => syncButton.removeEventListener('click', syncHandler));
    }

    if (downloadButton) {
        const downloadHandler = async () => {
            updateStatus('Downloading tabs...');
            try {
                const savedTabs = await getSavedTabs();
                renderTabList(tabListContainer, savedTabs || []);
                updateStatus('Download complete.', 'green');
            } catch (e) {
                updateStatus(e.message || 'Download error.', 'red');
                console.error(e);
            }
        };
        downloadButton.addEventListener('click', downloadHandler);
        cleanup.add(() => downloadButton.removeEventListener('click', downloadHandler));
    }

    const autoSyncHandler = function () {
        const enabled = this.checked;
        status.textContent = enabled ? "Auto sync enabled" : "Auto sync disabled";
        body.classList.toggle('sync-active', enabled);
        storage.local.set({ autoSyncEnabled: enabled });
        runtime.sendMessage({ type: 'SET_AUTO_SYNC', enabled }).catch((err) => {
            console.warn('Background script not available:', err);
            updateStatus('Auto sync may not work: background script not ready', 'orange');
        });
    };

    autoSyncToggle.addEventListener('change', autoSyncHandler);
    cleanup.add(() => autoSyncToggle.removeEventListener('change', autoSyncHandler));

    // Initial data load
    try {
        const allData = await getAllSyncData();
        const usage = calculateStorageUsage(allData);
        renderMemoryUsage(memoryContainer, usage);
        renderTabList(tabListContainer, allData.syncedTabs || []);
        updateStatus('Data loaded.', 'gray');
    } catch (e) {
        updateStatus(e.message || 'Error loading data.', 'red');
        console.error(e);
    }

    // Cleanup on popup close
    window.addEventListener('unload', () => {
        for (const cleanupFn of cleanup) {
            cleanupFn();
        }
    });
});

// Use browser.* API for Firefox compatibility
const runtime = typeof browser !== 'undefined' ? browser.runtime : chrome.runtime;
const storage = typeof browser !== 'undefined' ? browser.storage : chrome.storage;

const toggleButtonsBtn = document.createElement('button');
toggleButtonsBtn.textContent = "Hide manual sync buttons";
toggleButtonsBtn.style.marginBottom = "12px";
toggleButtonsBtn.style.backgroundColor = "#6c757d";
toggleButtonsBtn.style.color = "white";
toggleButtonsBtn.style.border = "none";
toggleButtonsBtn.style.borderRadius = "var(--radius)";
toggleButtonsBtn.style.padding = "10px";
toggleButtonsBtn.style.cursor = "pointer";

const buttonGroup = document.querySelector('.button-group');
buttonGroup.parentNode.insertBefore(toggleButtonsBtn, buttonGroup);

let buttonsVisible = true;

toggleButtonsBtn.addEventListener('click', () => {
  buttonsVisible = !buttonsVisible;
  buttonGroup.style.display = buttonsVisible ? 'grid' : 'none';
  toggleButtonsBtn.textContent = buttonsVisible
    ? "Hide manual sync buttons"
    : "Show manual sync buttons";
});