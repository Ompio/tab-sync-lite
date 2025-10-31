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

    if (saveButton) {
        saveButton.addEventListener('click', async () => {
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
                updateStatus('Error saving tabs.', 'red');
                console.error(e);
            }
        });
    }

    if (syncButton) {
        syncButton.addEventListener('click', async () => {
            updateStatus('Syncing tabs...');
            try {
                const savedTabs = await getSavedTabs();
                renderTabList(tabListContainer, savedTabs || []);
                await syncTabs(savedTabs);
                updateStatus('Sync complete.', 'green');
            } catch (e) {
                updateStatus('Sync error.', 'red');
                console.error(e);
            }
        });
    }

    if (downloadButton) {
        downloadButton.addEventListener('click', async () => {
            updateStatus('Downloading tabs...');
            try {
                const savedTabs = await getSavedTabs();
                renderTabList(tabListContainer, savedTabs || []);
                updateStatus('Download complete.', 'green');
            } catch (e) {
                updateStatus('Download error.', 'red');
                console.error(e);
            }
        });
    }

    try {
        const allData = await getAllSyncData();
        const usage = calculateStorageUsage(allData);
        renderMemoryUsage(memoryContainer, usage);
        renderTabList(tabListContainer, allData.syncedTabs || []);
        updateStatus('Data loaded.', 'gray');
    } catch (e) {
        updateStatus('Error loading data.', 'red');
        console.error(e);
    }
});

let autoSyncInterval = null;

function startAutoSync() {
  if (autoSyncInterval) return;
  autoSyncInterval = setInterval(async () => {
    try {
      updateStatus('Auto syncing tabs...');
      const savedTabs = await getSavedTabs();
      renderTabList(document.getElementById('savedTabsList'), savedTabs || []);
      await syncTabs(savedTabs);
      updateStatus('Auto sync complete.', 'green');
    } catch (e) {
      updateStatus('Auto sync error.', 'red');
      console.error(e);
    }
  }, 30000); // 30 seconds
}

function stopAutoSync() {
  if (autoSyncInterval) {
    clearInterval(autoSyncInterval);
    autoSyncInterval = null;
  }
}

const autoSyncToggle = document.getElementById('autoSyncToggle');
const status = document.getElementById('status');
const body = document.body;

autoSyncToggle.addEventListener('change', function () {
  if (this.checked) {
    status.textContent = "Auto sync enabled";
    body.classList.add('sync-active');
    startAutoSync();
  } else {
    status.textContent = "Auto sync disabled";
    body.classList.remove('sync-active');
    stopAutoSync();
  }
});

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