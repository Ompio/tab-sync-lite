import { formatTimestamp } from './utils.js';

export function updateStatus(message, color = 'gray') {
    const el = document.getElementById('status');
    if (el) {
        el.textContent = message;
        el.style.color = color;
    }
}

export function renderMemoryUsage(container, usage) {
    // Use textContent for plain text, and only use innerHTML for trusted, static HTML
    container.textContent = `Sync memory usage: ${usage.percentage}% (${usage.bytes} bytes of ${usage.maxStorage} bytes).`;
    container.style.color = usage.percentage > 90 ? 'red' : usage.percentage > 70 ? 'orange' : 'gray';
}

export function renderTabList(container, tabs) {
    // Clear the container safely
    while (container.firstChild) container.removeChild(container.firstChild);
    if (tabs.length === 0) {
        const noData = document.createElement('li');
        noData.textContent = 'No saved tabs to display.';
        noData.style.color = '#888';
        container.appendChild(noData);
        return;
    }
    tabs.forEach(entry => {
        const li = document.createElement('li');
        li.style.marginBottom = '8px';
        li.style.paddingBottom = '5px';
        li.style.borderBottom = '1px dashed #eee';

        const url = document.createElement('span');
        url.textContent = entry.url;
        url.style.fontWeight = 'bold';
        url.style.wordBreak = 'break-all';

        const meta = document.createElement('span');
        meta.textContent = `Action: ${entry.action}, Time: ${formatTimestamp(entry.timestamp)}`;
        meta.style.display = 'block';
        meta.style.color = '#555';

        li.appendChild(url);
        li.appendChild(meta);
        container.appendChild(li);
    });
}