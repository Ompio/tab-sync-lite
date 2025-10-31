import { isValidTabUrl } from './utils.js';

// Use browser.* API for Firefox compatibility
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

export async function getAllOpenTabs() {
    const tabs = await browserAPI.tabs.query({});
    return tabs.filter(tab => isValidTabUrl(tab.url));
}

export async function syncTabs(savedTabs) {
    if (!Array.isArray(savedTabs)) {
        console.error('Invalid savedTabs parameter:', savedTabs);
        throw new Error('Invalid saved tabs data');
    }

    if (savedTabs.length === 0) {
        return { status: 'No saved tabs found', type: 'warning' };
    }

    const savedUrls = savedTabs
        .map(tab => tab.url)
        .filter(url => url && isValidTabUrl(url));

    const currentTabs = await browserAPI.tabs.query({});
    const currentUrls = currentTabs
        .map(tab => tab.url)
        .filter(url => url && isValidTabUrl(url));

    const tabsToClose = currentTabs.filter(tab =>
        tab.url &&
        isValidTabUrl(tab.url) &&
        !savedUrls.includes(tab.url)
    );

    const closeErrors = [];
    for (const tab of tabsToClose) {
        try {
            await browserAPI.tabs.remove(tab.id);
        } catch (e) {
            closeErrors.push(`Failed to close tab: ${tab.url}`);
            console.warn(`Failed to close tab: ${tab.url}`, e);
        }
    }

    // Open tabs that are saved but not currently open
    const tabsToOpen = savedTabs.filter(tab =>
        tab.url &&
        isValidTabUrl(tab.url) &&
        !currentUrls.includes(tab.url)
    );

    const openErrors = [];
    for (const tab of tabsToOpen) {
        try {
            await browserAPI.tabs.create({ url: tab.url });
        } catch (e) {
            openErrors.push(`Failed to open ${tab.url}`);
            console.warn(`Failed to open ${tab.url}:`, e);
        }
    }

    return {
        status: 'Sync complete',
        type: 'success',
        stats: {
            closed: tabsToClose.length - closeErrors.length,
            opened: tabsToOpen.length - openErrors.length,
            errors: [...closeErrors, ...openErrors]
        }
    };
}