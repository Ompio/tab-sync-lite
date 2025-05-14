// Define keys globally
const storageKey = 'syncedTabsLite'; // Key for the manual debug log
const syncedTabsKey = 'syncedTabs'; // Key used by background script for state (for memory calculation?)
const lastSyncKey = 'lastSync';     // Key used by background script for timestamp (for memory calculation?)


// Funkcja do obliczania rozmiaru danych przechowywanych w storage w bajtach
// Przyjmuje obiekt danych pobrany z browser.storage.sync.get()
function calculateStorageUsage(data) {
    const maxStorage = 102400; // 100KB limit

    // --- IMPORTANT ---
    // Calculate usage based *only* on the data we care about being in sync storage.
    // In this case, the debug log is under storageKey ('syncedTabsLite').
    // The background script might also save syncedTabsKey ('syncedTabs') and lastSyncKey ('lastSync').
    // The most accurate usage is the size of *all* data under *our* extension's keys.
    // browser.storage.sync.get() with *no arguments* gets all keys for the extension.
    // Let's calculate total usage based on ALL our keys.
    // We need to fetch ALL data for this, not just specific keys.
    // The showTabs function will need to be updated to get ALL data.

    // Redefine calculateStorageUsage to take the full data object from get()
    // and calculate size of relevant keys. Let's assume we want to calculate
    // the size of the debug log ('syncedTabsLite') PLUS the sync state ('syncedTabs', 'lastSync')
    // if the background script is also writing those. Or just the debug log?
    // Let's calculate the size of the data that was PASSED IN, assuming it's the relevant subset.
    // This function's implementation seems mostly correct *given* the data passed to it.
    // The issue is which data is passed.

    // Let's adjust the function slightly to be robust and calculate size of *all*
    // keys present in the `data` object passed to it, assuming `data` comes from
    // a `browser.storage.sync.get()` call that fetches relevant keys.

    let dataToCalculate = {};
     // Copy all properties from the input data object
    if (data && typeof data === 'object') {
       for (const key in data) {
           if (Object.prototype.hasOwnProperty.call(data, key)) {
               dataToCalculate[key] = data[key];
           }
       }
    } else {
       dataToCalculate = null; // Or {}
    }


    const serializedData = JSON.stringify(dataToCalculate);
    const dataSize = new TextEncoder().encode(serializedData).length;

    const percentage = (dataSize / maxStorage) * 100;

    return {
        bytes: dataSize,
        maxStorage: maxStorage,
        percentage: Math.min(percentage, 100).toFixed(2)
    };
}


// Funkcja pobierająca dane z pamięci i wyświetlająca log/info
async function showDataAndInfo() {
    // Fetch DOM elements *inside* DOMContentLoaded or functions called from it
    const savedTabsListElement = document.getElementById('savedTabsList');
    const statusElement = document.getElementById('status'); // General status
    const memoryUsageElement = document.getElementById('memoryUsage'); // Memory usage status

    // Set initial loading messages
    if (savedTabsListElement) savedTabsListElement.innerHTML = '<li class="no-tabs-message">Ładowanie logu...</li>';
    if (statusElement) statusElement.textContent = 'Ładowanie statusu...';
    if (memoryUsageElement) memoryUsageElement.textContent = 'Obliczanie zużycia pamięci...';


    try {
        // --- Krok 1: Pobierz DANE Z STORAGE ---
        // Pobieramy WSZYSTKIE klucze należące do naszego rozszerzenia w storage.sync,
        // żeby dokładnie obliczyć zużycie.
        // Pobieramy też konkretny klucz logu ('syncedTabsLite') do wyświetlenia.
        // Zakładamy, że background script (jeśli działa) też może zapisywać pod innymi kluczami.
        const allStorageData = await browser.storage.sync.get(null); // null gets all keys for this extension
        const debugLogEntries = allStorageData[storageKey]; // Get the log data using the debug key
        const lastSync = allStorageData[lastSyncKey]; // Get last sync time from background script save


        // --- Krok 2: Obliczanie i wyświetlanie informacji o storage ---
        const storageUsage = calculateStorageUsage(allStorageData); // Oblicz na podstawie *wszystkich* danych rozszerzenia

        if (memoryUsageElement) {
            memoryUsageElement.innerHTML = `Zużycie pamięci sync: <strong>${storageUsage.percentage}%</strong> (${storageUsage.bytes} bajtów z ${storageUsage.maxStorage} bajtów).`;
            // Opcjonalnie zmień kolor w zależności od zużycia
            if (storageUsage.percentage > 90) {
                 memoryUsageElement.style.color = 'red';
            } else if (storageUsage.percentage > 70) {
                 memoryUsageElement.style.color = 'orange';
            } else {
                 memoryUsageElement.style.color = 'gray';
            }
        }


        // --- Krok 3: Wyświetlanie czasu ostatniej synchronizacji (może z background script) ---
        if (statusElement) {
             if (lastSync) {
                 const lastSyncTime = new Date(lastSync).toLocaleString();
                 statusElement.innerHTML = `Ostatnia synchronizacja (z background?): <strong>${lastSyncTime}</strong>`;
             } else {
                 statusElement.textContent = 'Brak danych ostatniej synchronizacji.';
             }
              statusElement.style.color = 'gray'; // Reset color
        }


        // --- Krok 4: Wyświetlanie logu z kart (z klucza 'syncedTabsLite') ---
        if (savedTabsListElement) {
             savedTabsListElement.innerHTML = ''; // Wyczyść listę przed dodaniem nowych elementów

             if (!debugLogEntries || debugLogEntries.length === 0) {
                 const noDataElement = document.createElement('li');
                 noDataElement.textContent = "Brak danych logu do wyświetlenia.";
                 noDataElement.style.fontStyle = 'italic';
                 noDataElement.style.color = '#888';
                 savedTabsListElement.appendChild(noDataElement);
                 // console.log("Brak danych logu:", debugLogEntries); // Debug log
                 return; // Zakończ, jeśli brak danych logu
             }

             // Przejdź przez każdy wpis logu i wyświetl go (używając logEntry zamiast tab)
             debugLogEntries.forEach(logEntry => {
                 const listItem = document.createElement('li');
                 listItem.style.marginBottom = '8px';
                 listItem.style.paddingBottom = '5px';
                 listItem.style.borderBottom = '1px dashed #eee';
                 listItem.style.fontSize = '0.9em';

                 const urlSpan = document.createElement('span');
                 urlSpan.style.fontWeight = 'bold';
                 urlSpan.style.wordBreak = 'break-all';
                 urlSpan.textContent = logEntry.url;

                 const detailsSpan = document.createElement('span');
                 detailsSpan.style.display = 'block';
                 detailsSpan.style.fontSize = '0.9em';
                 detailsSpan.style.color = '#555';

                 // Upewnij się, że timestamp istnieje przed formatowaniem
                 const formattedTime = logEntry.timestamp ? new Date(logEntry.timestamp).toLocaleString() : 'Brak czasu';

                 detailsSpan.textContent = `Akcja: ${logEntry.action || 'Nieznana'}, Czas: ${formattedTime}`; // Dodaj fallback dla akcji

                 listItem.appendChild(urlSpan);
                 listItem.appendChild(detailsSpan);

                 savedTabsListElement.appendChild(listItem);
             });
              // console.log("Wyświetlono log:", debugLogEntries); // Debug log
        }


    } catch (error) {
        console.error('Błąd podczas ładowania danych lub wyświetlania:', error);
         if (statusElement) statusElement.textContent = `Błąd: ${error.message}`;
         if (memoryUsageElement) memoryUsageElement.textContent = 'Błąd obliczeń pamięci.';
         if (savedTabsListElement) savedTabsListElement.innerHTML = `<li style="color: red;">Błąd ładowania/wyświetlania logu: ${error.message}</li>`;
    }
}


// --- DOMContentLoaded Listener (Poprawiony) ---
document.addEventListener('DOMContentLoaded', () => {
    // Fetch DOM elements *here* after the document is loaded
    const saveButton = document.getElementById('saveTabsButton');
    const downloadButton = document.getElementById('downloadTabsButton'); // Get the second button too
    // statusElement i memoryUsageElement też są teraz pobierane w showDataAndInfo,
    // ale można je też pobrać tutaj, jeśli są potrzebne globalnie w tym listenerze.
    // Na razie wystarczy, że pobiera je showDataAndInfo.

    // --- Wyświetl dane i info od razu po otwarciu popupu ---
    showDataAndInfo(); // Zmieniona nazwa funkcji wyświetlającej

    // --- Dodaj nasłuchiwacz na przycisk zapisu (logowania manualnego) ---
    if (saveButton) { // Upewnij się, że przycisk istnieje
        saveButton.addEventListener('click', async () => {
            const currentStatusElement = document.getElementById('status'); // Pobierz status lokalnie dla listenera
            if (currentStatusElement) {
                currentStatusElement.textContent = 'Zapisywanie logu...';
                currentStatusElement.style.color = 'gray';
            }


            try {
                const allTabs = await browser.tabs.query({});
                const actionTime = Date.now();
                // Tworzymy wpis logu dla każdej aktualnie otwartej karty
                const newLogEntries = allTabs.map(tab => ({
                    url: tab.url,
                    // Używamy akcji "manual_save" lub "created", żeby odróżnić od eventów background
                    action: "manual_save",
                    timestamp: actionTime
                }));

                // --- W tym podejściu manualnego logu: NADPISUJEMY poprzedni log ---
                // Jeśli chcesz DOKLEJAĆ do logu, musisz najpierw pobrać stary log:
                // const existingLogData = await browser.storage.sync.get(storageKey);
                // const existingLog = existingLogData[storageKey] || [];
                // const updatedLog = [...existingLog, ...newLogEntries];
                // await browser.storage.sync.set({ [storageKey]: updatedLog });
                // Ale uwaga na limit 100KB przy doklejaniu!

                // Wracając do NADPISYWANIA jak w Twoim kodzie:
                await browser.storage.sync.set({ [storageKey]: newLogEntries });

                if (currentStatusElement) {
                    currentStatusElement.textContent = `Zapisano ${newLogEntries.length} wpisów logu!`;
                    currentStatusElement.style.color = 'green';
                }
                console.log('Log manualnego zapisu:', newLogEntries);

                // --- Po udanym zapisie, odśwież wyświetlanie ---
                showDataAndInfo(); // Odśwież wszystkie wyświetlane dane

            } catch (error) {
                 const currentStatusElement = document.getElementById('status');
                 if (currentStatusElement) {
                    currentStatusElement.textContent = 'Wystąpił błąd podczas zapisywania logu: ' + error.message;
                    currentStatusElement.style.color = 'red';
                 }
                console.error('Error saving log:', error);
            }
        });
    } else {
        console.error('[Popup] Nie znaleziono przycisku #saveTabsButton');
    }

    // --- Dodaj nasłuchiwacz dla drugiego przycisku (na razie pusty) ---
    if (downloadButton) {
        downloadButton.addEventListener('click', () => {
            console.log('Przycisk "Pobierz karty" kliknięty. Dodaj funkcjonalność!');
            // Tutaj dodasz logikę dla drugiego przycisku
            // np. pobieranie logu i zapisywanie do pliku,
            // albo wywołanie funkcji synchronizacji z background script
        });
    } else {
        console.error('[Popup] Nie znaleziono przycisku #downloadTabsButton');
    }
});