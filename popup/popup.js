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
    statusElement.textContent = 'Odtwarzanie stanu kart...';
    statusElement.style.color = 'gray';

    try {
        // 1. Pobierz zapisane karty
        const data = await browser.storage.sync.get(storageKey);
        const savedTabs = data[storageKey];

        if (!savedTabs || savedTabs.length === 0) {
            statusElement.textContent = 'Brak zapisanych kart.';
            statusElement.style.color = 'orange';
            return;
        }

        // 2. Pobierz aktualnie otwarte karty
        const currentTabs = await browser.tabs.query({});

        // 3. Filtruj i zamknij tylko te http/https karty, które nie są np. chrome:// lub plikami
        const tabsToClose = currentTabs.filter(tab =>
            tab.url &&
            tab.url.startsWith('http') &&
            !tab.url.endsWith('.pdf') // nie chcemy zamykać pdfów (ani ich synchronizować)
        );

        for (const tab of tabsToClose) {
            try {
                await browser.tabs.remove(tab.id);
            } catch (e) {
                console.warn(`Nie udało się zamknąć karty: ${tab.url}`, e);
            }
        }

        // 4. Otwórz zapisane karty
        let openedCount = 0;
        for (const tab of savedTabs) {
            if (tab.url &&
                tab.url.startsWith('http') &&
                !tab.url.endsWith('.pdf')
            ) {
                try {
                    await browser.tabs.create({ url: tab.url });
                    openedCount++;
                } catch (e) {
                    console.warn(`Błąd przy otwieraniu ${tab.url}:`, e);
                }
            }
        }

        statusElement.textContent = `Odtworzono ${openedCount} kart.`;
        statusElement.style.color = 'green';

    } catch (error) {
        statusElement.textContent = 'Błąd podczas odtwarzania: ' + error.message;
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
