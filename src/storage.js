const storageKey = 'syncedTabs';
const lastSyncKey = 'lastSync';

export async function saveTabsToStorage(tabs) {
    const timestamp = Date.now();
    const payload = tabs.map(tab => ({ url: tab.url, action: 'created', timestamp }));
    await browser.storage.sync.set({ [storageKey]: payload, [lastSyncKey]: timestamp });
}

export async function getSavedTabs() {
    const data = await browser.storage.sync.get([storageKey]);
    return data[storageKey] || [];
}

export async function getAllSyncData() {
    return await browser.storage.sync.get([storageKey, lastSyncKey]);
}