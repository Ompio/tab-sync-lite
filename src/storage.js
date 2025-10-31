// Use browser.* API for Firefox compatibility
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
const storageKey = 'syncedTabs';
const lastSyncKey = 'lastSync';

export async function saveTabsToStorage(tabs) {
    try {
        const timestamp = Date.now();
        const payload = tabs.map(tab => ({ url: tab.url, action: 'created', timestamp }));
        await browserAPI.storage.sync.set({ [storageKey]: payload, [lastSyncKey]: timestamp });
    } catch (error) {
        if (error.message.includes('QUOTA_BYTES_PER_ITEM') || error.message.includes('QUOTA_BYTES')) {
            throw new Error('Storage quota exceeded. Try removing some saved tabs.');
        }
        throw error;
    }
}

export async function getSavedTabs() {
    try {
        const data = await browserAPI.storage.sync.get([storageKey]);
        return data[storageKey] || [];
    } catch (error) {
        console.error('Error getting saved tabs:', error);
        return [];
    }
}

export async function getAllSyncData() {
    try {
        return await browserAPI.storage.sync.get([storageKey, lastSyncKey]);
    } catch (error) {
        console.error('Error getting sync data:', error);
        return { [storageKey]: [], [lastSyncKey]: null };
    }
}