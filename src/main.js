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


const autoSyncToggle = document.getElementById('autoSyncToggle');
  const status = document.getElementById('status');
  const body = document.body;

  autoSyncToggle.addEventListener('change', function () {
    if (this.checked) {
      status.textContent = "Automatyczna synchronizacja włączona";
      body.classList.add('sync-active');
    } else {
      status.textContent = "Automatyczna synchronizacja wyłączona";
      body.classList.remove('sync-active');
    }
  });

  // Dodaj przycisk do ukrywania/pokazywania ręcznych przycisków
  const toggleButtonsBtn = document.createElement('button');
  toggleButtonsBtn.textContent = "Ukryj przyciski ręcznej synchronizacji";
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
      ? "Ukryj przyciski ręcznej synchronizacji"
      : "Pokaż przyciski ręcznej synchronizacji";
  });