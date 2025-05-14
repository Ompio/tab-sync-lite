import { formatTimestamp } from './utils.js';

export function updateStatus(message, color = 'gray') {
    const el = document.getElementById('status');
    if (el) {
        el.textContent = message;
        el.style.color = color;
    }
}

export function renderMemoryUsage(container, usage) {
    container.innerHTML = `Zużycie pamięci sync: <strong>${usage.percentage}%</strong> (${usage.bytes} bajtów z ${usage.maxStorage} bajtów).`;
    container.style.color = usage.percentage > 90 ? 'red' : usage.percentage > 70 ? 'orange' : 'gray';
}

export function renderTabList(container, tabs) {
    container.innerHTML = '';
    if (tabs.length === 0) {
        const noData = document.createElement('li');
        noData.textContent = 'Brak danych logu do wyświetlenia.';
        noData.style.color = '#888';
        container.appendChild(noData);
        return;
    }

    for (const entry of tabs) {
        const li = document.createElement('li');
        li.style.marginBottom = '8px';
        li.style.paddingBottom = '5px';
        li.style.borderBottom = '1px dashed #eee';

        const url = document.createElement('span');
        url.textContent = entry.url;
        url.style.fontWeight = 'bold';
        url.style.wordBreak = 'break-all';

        const meta = document.createElement('span');
        meta.textContent = `Akcja: ${entry.action}, Czas: ${formatTimestamp(entry.timestamp)}`;
        meta.style.display = 'block';
        meta.style.color = '#555';

        li.appendChild(url);
        li.appendChild(meta);
        container.appendChild(li);
    }
}