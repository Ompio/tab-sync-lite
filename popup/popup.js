const storageKey = 'syncedTabsLite'; // Klucz do zapisu/odczytu w storage


document.addEventListener('DOMContentLoaded', () => {
    const saveButton = document.getElementById('saveTabsButton');
    const statusElement = document.getElementById('status');

    // --- Wyświetl zapisane karty od razu po otwarciu popupu ---
    displaySavedTabs();

    // --- Dodaj nasłuchiwacz na przycisk zapisu ---
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
                statusElement.textContent = 'Nie znaleziono otwartych kart do zapisania.';
                statusElement.style.color = 'orange';
                return;
                }

            await browser.storage.sync.set({ [storageKey]: tabsToSave });

            statusElement.textContent = `Zapisano ${tabsToSave.length} kart!`;
            statusElement.style.color = 'green';
            console.log('Tabs saved:', tabsToSave);

            // --- Po udanym zapisie, odśwież listę wyświetlaną w popupie ---
            displaySavedTabs();

        } catch (error) {
            statusElement.textContent = 'Wystąpił błąd podczas zapisywania kart: ' + error.message;
            statusElement.style.color = 'red';
            console.error('Error saving tabs:', error);
        }
    });
});

// Funkcja pobierająca karty z pamięci i wyświetlająca je w popupie
async function displaySavedTabs() {
    const savedTabsListElement = document.getElementById('savedTabsList');
    savedTabsListElement.innerHTML = '<li class="no-tabs-message">Ładowanie...</li>'; // Wyświetl komunikat ładowania

    try {
        // Pobierz dane z browser.storage.sync pod kluczem 'syncedTabsLite'
        // get() zwraca obiekt, gdzie klucze są takie, jakich szukaliśmy
        const data = await browser.storage.sync.get(storageKey);
        const savedTabs = data[storageKey]; // Pobieramy tablicę kart z obiektu

        savedTabsListElement.innerHTML = '';

        // Sprawdź, czy są jakieś dane do wyświetlenia
        if (!savedTabs || savedTabs.length === 0) {
            const noDataElement = document.createElement('li'); // Możesz użyć li w UL lub p w DIV
            noDataElement.textContent = "Brak danych logu do wyświetlenia.";
            noDataElement.style.fontStyle = 'italic';
            noDataElement.style.color = '#888';
            savedTabsListElement.appendChild(noDataElement);
            return; // Zakończ funkcję, jeśli brak danych
        }


        // Przejdź przez każdy wpis logu i wyświetl go
        savedTabs.forEach(logEntry => { // Używamy 'logEntry' żeby podkreślić, że to wpis logu
            const listItem = document.createElement('li'); // Element listy dla każdego wpisu

            // Dodaj styl, żeby wpisy były czytelne, np. oddzielone linią
            listItem.style.marginBottom = '8px';
            listItem.style.paddingBottom = '5px';
            listItem.style.borderBottom = '1px dashed #eee';
            listItem.style.fontSize = '0.9em';

            // Sformatuj timestamp (jest to liczba milisekund) na czytelną datę/czas
            const formattedTime = new Date(logEntry.timestamp).toLocaleString();
            const urlSpan = document.createElement('span');
            urlSpan.style.fontWeight = 'bold'; // Pogrubienie URL
            urlSpan.style.wordBreak = 'break-all'; // Zapobiega przepełnieniu przy długich URLach
            urlSpan.textContent = logEntry.url; // Wyświetlamy sam URL (bez linku)
        
            // 2. Wyświetl akcję i timestamp w nowej linii
            const detailsSpan = document.createElement('span');
            detailsSpan.style.display = 'block'; // Wymuś nową linię
            detailsSpan.style.fontSize = '0.9em'; // Mniejsza czcionka
            detailsSpan.style.color = '#555'; // Ciemnoszary kolor
            
            // Ustaw tekst zawierający akcję i sformatowany czas
            detailsSpan.textContent = `Akcja: ${logEntry.action}, Czas: ${formattedTime}`; // Np. "Akcja: created, Czas: 13.05.2024, 14:30:00"

            // 3. Dodaj elementy span do elementu listy LI
            listItem.appendChild(urlSpan);
            listItem.appendChild(detailsSpan);

            // 4. Dodaj gotowy element listy LI do głównego elementu listy UL/DIV
            savedTabsListElement.appendChild(listItem);
        });

    } catch (error) {
        console.error('Błąd podczas ładowania zapisanych kart:', error);
        const savedTabsListElement = document.getElementById('savedTabsList'); // Ponownie pobierz element na wypadek błędu przy pierwszym pobraniu
        savedTabsListElement.innerHTML = `<li style="color: red;">Błąd ładowania: ${error.message}</li>`;
    }
}