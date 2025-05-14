const storageKey = 'syncedTabsLite'; // Klucz do zapisu/odczytu w storage.sync
const saveButton = document.getElementById('saveTabsButton');
const statusElement = document.getElementById('status');
const memoryUsageElement = document.getElementById('memoryUsage');
const savedTabsListElement = document.getElementById('savedTabsList');


document.addEventListener('DOMContentLoaded', () => {
    displaySavedTabs(); // Pokazuje zapisane karty przy otwarciu popupu
});

saveButton.addEventListener('click', async () => {
    statusElement.textContent = 'Zapisywanie kart...';
    statusElement.style.color = 'gray';

    try {
        const allTabs = await browser.tabs.query({});
        const actionTime = Date.now();

        const tabsToSave = allTabs.map(tab => ({
            url: tab.url,
            action: "created",
            timestamp: actionTime
        }));

        if (tabsToSave.length === 0) {
            statusElement.textContent = 'Brak kart do zapisania.';
            statusElement.style.color = 'orange';
            return;
        }

        await browser.storage.sync.set({ [storageKey]: tabsToSave });

        statusElement.textContent = `Zapisano ${tabsToSave.length} kart.`;
        statusElement.style.color = 'green';

        displaySavedTabs(); // Odśwież listę

    } catch (error) {
        statusElement.textContent = 'Błąd zapisu: ' + error.message;
        statusElement.style.color = 'red';
        console.error(error);
    }
});

const restoreButton = document.getElementById('restoreTabsButton');

restoreButton.addEventListener('click', async () => {
    statusElement.textContent = 'Otwieranie zapisanych kart...';
    statusElement.style.color = 'gray';

    try {
        const data = await browser.storage.sync.get(storageKey);
        const savedTabs = data[storageKey];

        if (!savedTabs || savedTabs.length === 0) {
            statusElement.textContent = 'Brak zapisanych kart do otwarcia.';
            statusElement.style.color = 'orange';
            return;
        }

        for (const tab of savedTabs) {
            if (tab.url && tab.url.startsWith('http')) {
                await browser.tabs.create({ url: tab.url });
            }
        }

        statusElement.textContent = `Otworzono ${savedTabs.length} kart.`;
        statusElement.style.color = 'green';

    } catch (error) {
        statusElement.textContent = 'Błąd otwierania: ' + error.message;
        statusElement.style.color = 'red';
        console.error(error);
    }
});

async function displaySavedTabs() {
    savedTabsListElement.innerHTML = '<li>Ładowanie danych...</li>';

    try {
        const data = await browser.storage.sync.get(storageKey);
        const savedTabs = data[storageKey];

        // Oblicz zużycie pamięci
        const usage = calculateStorageUsage(data);
        memoryUsageElement.innerHTML = `Zużycie storage: <strong>${usage.percentage}%</strong> (${usage.bytes} bajtów z ${usage.maxStorage} bajtów)`;
        memoryUsageElement.style.color = usage.percentage > 90 ? 'red' : usage.percentage > 70 ? 'orange' : 'gray';

        if (!savedTabs || savedTabs.length === 0) {
            savedTabsListElement.innerHTML = '<li style="color:#888">Brak zapisanych kart.</li>';
            return;
        }

        // Wyświetl zapisane karty
        savedTabsListElement.innerHTML = '';
        savedTabs.forEach(entry => {
            const li = document.createElement('li');
            li.style.borderBottom = '1px dashed #ccc';
            li.style.marginBottom = '6px';

            const url = document.createElement('div');
            url.textContent = entry.url;
            url.style.fontWeight = 'bold';
            url.style.wordBreak = 'break-word';

            const meta = document.createElement('div');
            const date = new Date(entry.timestamp).toLocaleString();
            meta.textContent = `Akcja: ${entry.action}, Czas: ${date}`;
            meta.style.color = '#555';
            meta.style.fontSize = '0.9em';

            li.appendChild(url);
            li.appendChild(meta);
            savedTabsListElement.appendChild(li);
        });

    } catch (error) {
        savedTabsListElement.innerHTML = `<li style="color:red;">Błąd wczytywania: ${error.message}</li>`;
    }
}

function calculateStorageUsage(data) {
    const maxStorage = 102400;
    const json = JSON.stringify(data);
    const bytes = new TextEncoder().encode(json).length;
    const percentage = ((bytes / maxStorage) * 100).toFixed(2);
    return { bytes, maxStorage, percentage };
}
