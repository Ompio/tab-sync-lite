import { isValidTabUrl } from './utils.js';

export async function getAllOpenTabs() {
    const tabs = await browser.tabs.query({});
    return tabs.filter(tab => isValidTabUrl(tab.url));
}

export async function syncTabs(savedTabs){
    if (savedTabs.length === 0) {
        statusElement.textContent = 'Brak zapisanych kart.';
        statusElement.style.color = 'orange';
        return;
    }

    const savedUrls = savedTabs.map(tab => tab.url).filter(Boolean);
    const currentTabs = await browser.tabs.query({});
    const currentUrls = currentTabs.map(tab => tab.url).filter(Boolean);

    const tabsToClose = currentTabs.filter(tab =>
        tab.url &&
        tab.url.startsWith('http') && // nadal nie zamykamy chrome:// itd.
        !savedUrls.includes(tab.url) // tylko jeśli nie ma jej w zapisanych
    );

    for (const tab of tabsToClose) {
        try {
            await browser.tabs.remove(tab.id);
        } catch (e) {
            console.warn(`Nie udało się zamknąć karty: ${tab.url}`, e);
        }
    }

    // Otwórz zakładki, które są zapisane, ale nie są aktualnie otwarte
    const tabsToOpen = savedTabs.filter(tab =>
        tab.url &&
        !currentUrls.includes(tab.url)
    );

    for (const tab of tabsToOpen) {
        try {
            await browser.tabs.create({ url: tab.url });
        } catch (e) {
            console.warn(`Nie udało się otworzyć ${tab.url}:`, e);
        }
    }
}