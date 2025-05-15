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
            updateStatus('Zapisuję karty...');
            try {
                const openTabs = await getAllOpenTabs();
                await saveTabsToStorage(openTabs);
                const allData = await getAllSyncData();
                renderTabList(tabListContainer, allData.syncedTabs || []);
                updateStatus('Karty zapisane pomyślnie.', 'green');
                const usage = calculateStorageUsage(allData);
                renderMemoryUsage(memoryContainer, usage);
            } catch (e) {
                updateStatus('Błąd zapisu kart.', 'red');
                console.error(e);
            }
        });
    }

    if (syncButton) {
        syncButton.addEventListener('click', async () => {
            updateStatus('Synchronizuję karty...');
            try {
                const savedTabs = await getSavedTabs();
                renderTabList(tabListContainer, savedTabs || []);
                await syncTabs(savedTabs);
                updateStatus('Synchronizacja zakończona.', 'green');
            } catch (e) {
                updateStatus('Błąd synchronizacji.', 'red');
                console.error(e);
            }
        });
    }

    if (downloadButton) {
        downloadButton.addEventListener('click', async () => {
            updateStatus('Pobieram karty...');
            try {
                const savedTabs = await getSavedTabs();
                renderTabList(tabListContainer, savedTabs || []);
                updateStatus('Pobieranie zakończone.', 'green');
            } catch (e) {
                updateStatus('Błąd pobierania.', 'red');
                console.error(e);
            }
        });
    }

    try {
        const allData = await getAllSyncData();
        const usage = calculateStorageUsage(allData);
        renderMemoryUsage(memoryContainer, usage);
        renderTabList(tabListContainer, allData.syncedTabs || []);
        updateStatus('Dane załadowane.', 'gray');
    } catch (e) {
        updateStatus('Błąd ładowania danych.', 'red');
        console.error(e);
    }
});
