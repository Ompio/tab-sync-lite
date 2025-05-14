export function calculateStorageUsage(data) {
    const maxStorage = 102400;
    const json = JSON.stringify(data);
    const bytes = new TextEncoder().encode(json).length;
    const percentage = ((bytes / maxStorage) * 100).toFixed(2);
    return { bytes, maxStorage, percentage };
}

export function formatTimestamp(ms) {
    return new Date(ms).toLocaleString();
}

export function isValidTabUrl(url) {
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('file://');
}