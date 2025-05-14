import { saveTabsToStorage, getSavedTabs, getAllSyncData } from './storage.js';
import { getAllOpenTabs, openTabs, closeTabsExcept } from './tabs.js';
import { calculateStorageUsage } from './utils.js';
import { updateStatus, renderMemoryUsage, renderTabList } from './ui.js';

document.addEventListener('DOMContentLoaded', async () => {
    const saveButton = document.getElementById('save');
    const syncButton = document.getElementById('sync');
    const memoryContainer = document.getElementById('memory');
    const tabListContainer = document.getElementById('log');

    if (saveButton) {
        saveButton.addEventListener('click', async () => {
            updateStatus('Zapisuję karty...');
            try {
                const openTabs = await getAllOpenTabs();
                await saveTabsToStorage(openTabs);
                updateStatus('Karty zapisane pomyślnie.', 'green');
                const allData = await getAllSyncData();
                const usage = calculateStorageUsage(allData);
                renderMemoryUsage(memoryContainer, usage);
                renderTabList(tabListContainer, allData.syncedTabs || []);
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
                const savedUrls = savedTabs.map(tab => tab.url);
                const currentlyOpenTabs = await getAllOpenTabs();
                const openUrls = currentlyOpenTabs.map(tab => tab.url);
    
                const urlsToOpen = savedUrls.filter(url => !openUrls.includes(url));
    
                await closeTabsExcept(savedUrls);
                await openTabs(urlsToOpen);
    
                updateStatus('Synchronizacja zakończona.', 'green');
            } catch (e) {
                updateStatus('Błąd synchronizacji.', 'red');
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
