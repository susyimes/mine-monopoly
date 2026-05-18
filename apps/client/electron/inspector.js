// inspector.js - GameProcess Inspector
const { ipcRenderer } = require('electron');
let currentState = null;
let autoRefresh = false;
let autoTimer = null;
let activeTab = 'overview';
const content = document.getElementById('content');
const status = document.getElementById('status');
const refreshBtn = document.getElementById('refreshBtn');
const autoBtn = document.getElementById('autoBtn');
const searchBar = document.getElementById('searchBar');
const searchInput = document.getElementById('searchInput');
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeTab = tab.dataset.tab;
        searchBar.classList.toggle('visible', activeTab === 'raw');
        render();
    });
});
refreshBtn.addEventListener('click', fetchState);
autoBtn.addEventListener('click', () => {
    autoRefresh = !autoRefresh;
    autoBtn.textContent = autoRefresh ? 'Auto: ON' : 'Auto: OFF';
    autoBtn.classList.toggle('active', autoRefresh);
    if (autoRefresh) { autoTimer = setInterval(fetchState, 2000); }
    else { clearInterval(autoTimer); autoTimer = null; }
});
searchInput.addEventListener('input', () => render());
async function fetchState() {
    status.textContent = 'Fetching...';
    status.className = 'status';
    try {
        const result = await ipcRenderer.invoke('inspector:get-state');
        if (result && result.__error) {
            status.textContent = result.__error;
            status.className = 'status err';
            currentState = null;
            render();
            return;
        }
        currentState = result;
        status.textContent = 'Round ' + (result ? result.currentRound : '?');
        status.className = 'status ok';
        render();
    } catch (e) {
        status.textContent = 'Error: ' + e.message;
        status.className = 'status err';
    }
}
function render() {
    if (!currentState) { content.textContent = 'No data. Start a game and click Refresh.'; return; }
    switch (activeTab) {
        case 'overview': renderOverview(); break;
        case 'players': renderCards(currentState.players, 'player'); break;
        case 'properties': renderCards(currentState.properties, 'property'); break;
        case 'events': renderEvents(); break;
        case 'logs': renderLogs(); break;
        case 'raw': renderRaw(); break;
    }
}
function esc(s) { const d = document.createElement('div'); d.textContent = String(s); return d.innerHTML; }
function renderOverview() {
    const s = currentState;
    const cards = [
        ['Current Round', s.currentRound],
        ['Multiplier', s.currentMultiplier],
        ['Current Player', s.currentRoundPlayer || '-'],
        ['Current Phase', s.currentGamePhase || '-'],
        ['Current Event', s.currentEventName || '-'],
        ['Game Over', String(s.isGameOver)],
        ['Runtime Stack', s.gameRuntimeStack.stackSize + ' events' + (s.gameRuntimeStack.isRunning ? ' (running)' : '')],
        ['Players', String(s.players.length)],
        ['Properties', String(s.properties.length)],
        ['Map Events', String(s.mapEvents.length)],
        ['Log Entries', String(s.gameLogList.length)],
        ['Ranked', s.rankedPlayerIds.length > 0 ? s.rankedPlayerIds.join(', ') : '-'],
    ];
    let html = '';
    for (const [label, value] of cards) {
        html += '<div class="overview-card"><div class="label">' + esc(label) + '</div><div class="value">' + esc(String(value)) + '</div></div>';
    }
    html += '<h3>Game Setting</h3><table><thead><tr><th>Key</th><th>Label</th><th>Value</th><th>Display</th></tr></thead><tbody>';
    for (const [key, val] of Object.entries(s.gameSetting || {})) {
        html += '<tr><td>' + esc(key) + '</td><td>' + esc(String(val.label)) + '</td><td>' + esc(String(val.value)) + '</td><td>' + esc(String(val.displayValue)) + '</td></tr>';
    }
    html += '</tbody></table>';
    html += '<h3>Custom Data</h3><pre>' + esc(JSON.stringify(s.customData, null, 2)) + '</pre>';
    html += '<h3>Export Data</h3><pre>' + esc(JSON.stringify(s.exportData, null, 2)) + '</pre>';
    content.innerHTML = html;
}
function renderTable(items) {
    if (!items || items.length === 0) { content.textContent = 'No data'; return; }
    const keys = [...new Set(items.flatMap(o => Object.keys(o)))];
    let html = '<table><thead><tr>';
    for (const k of keys) html += '<th>' + esc(k) + '</th>';
    html += '</tr></thead><tbody>';
    for (const p of items) {
        html += '<tr>';
        for (const k of keys) {
            const v = p[k]; const txt = v === null || v === undefined ? '-' : typeof v === 'object' ? JSON.stringify(v) : String(v);
            html += '<td>' + esc(txt) + '</td>';
        }
        html += '</tr>';
    }
    html += '</tbody></table>';
    content.innerHTML = html;
}
// Render items as cards with nested object support
function renderCards(items, type) {
    if (!items || items.length === 0) { content.textContent = 'No ' + type + 's'; return; }
    let html = '<div class="cards-container">';
    for (const item of items) {
        // Get primary identifier (try id, name, or first key)
        const idKey = Object.keys(item).find(k => k === 'id' || k === 'name' || k === 'playerId');
        const title = idKey ? (item[idKey] || 'Unknown') : ('Item ' + items.indexOf(item));
        const titleKey = idKey || 'item';

        html += '<div class="data-card">';
        html += '<div class="card-header"><span class="card-title">' + esc(String(title)) + '</span></div>';
        html += '<div class="card-body">';

        // Display all fields
        for (const [key, val] of Object.entries(item)) {
            if (key === idKey) continue; // Skip title field
            html += renderField(key, val, 0);
        }

        html += '</div></div>';
    }
    html += '</div>';
    content.innerHTML = html;

    // Attach toggle listeners after rendering (only to new triggers)
    attachToggleListeners();
}
// Render a single field (handles nested objects)
function renderField(key, val, depth) {
    const showKey = key !== '';
    const keyHtml = showKey ? '<span class="field-key">' + esc(key) + ':</span> ' : '';

    if (val === null || val === undefined) {
        return '<div class="field" style="padding-left:' + (depth * 12) + 'px">' + keyHtml + '<span class="null">null</span></div>';
    }
    if (typeof val === 'boolean') {
        return '<div class="field" style="padding-left:' + (depth * 12) + 'px">' + keyHtml + '<span class="bool-' + val + '">' + val + '</span></div>';
    }
    if (typeof val === 'number') {
        return '<div class="field" style="padding-left:' + (depth * 12) + 'px">' + keyHtml + '<span class="num">' + val + '</span></div>';
    }
    if (typeof val === 'string') {
        return '<div class="field" style="padding-left:' + (depth * 12) + 'px">' + keyHtml + '<span class="val">"' + esc(val) + '"</span></div>';
    }
    if (Array.isArray(val)) {
        if (val.length === 0) {
            return '<div class="field" style="padding-left:' + (depth * 12) + 'px">' + keyHtml + '<span class="text-dim">[]</span></div>';
        }
        const childId = 'child-' + Math.random().toString(36).substr(2, 9);
        // Store JSON data as base64 to avoid encoding issues
        const jsonB64 = btoa(unescape(encodeURIComponent(JSON.stringify(val))));
        let html = '<div class="field-group collapsible" style="padding-left:' + (depth * 12) + 'px">';
        html += '<div class="toggle-trigger" data-target="' + childId + '">';
        html += '<span class="arrow">▶</span>';
        if (showKey) html += '<span class="field-key">' + esc(key) + ':</span> ';
        html += '<span class="text-dim">Array(' + val.length + ')</span>';
        html += '</div>';
        html += '<div class="nested hidden" id="' + childId + '" data-json="' + esc(jsonB64) + '"></div>';
        html += '</div>';
        return html;
    }
    if (typeof val === 'object') {
        const keys = Object.keys(val);
        if (keys.length === 0) {
            return '<div class="field" style="padding-left:' + (depth * 12) + 'px">' + keyHtml + '<span class="text-dim">{}</span></div>';
        }
        const childId = 'child-' + Math.random().toString(36).substr(2, 9);
        // Store JSON data as base64 to avoid encoding issues
        const jsonB64 = btoa(unescape(encodeURIComponent(JSON.stringify(val))));
        let html = '<div class="field-group collapsible" style="padding-left:' + (depth * 12) + 'px">';
        html += '<div class="toggle-trigger" data-target="' + childId + '">';
        html += '<span class="arrow">▶</span>';
        if (showKey) html += '<span class="field-key">' + esc(key) + ':</span> ';
        html += '<span class="text-dim">Object {' + keys.length + '}</span>';
        html += '</div>';
        html += '<div class="nested hidden" id="' + childId + '" data-json="' + esc(jsonB64) + '"></div>';
        html += '</div>';
        return html;
    }
    return '<div class="field" style="padding-left:' + (depth * 12) + 'px">' + keyHtml + esc(String(val)) + '</div>';
}
// Attach click listeners to toggle triggers (only to unbound triggers)
function attachToggleListeners() {
    document.querySelectorAll('.toggle-trigger:not([data-bound])').forEach(trigger => {
        trigger.setAttribute('data-bound', 'true');
        trigger.addEventListener('click', function(e) {
            e.stopPropagation();
            const targetId = this.getAttribute('data-target');
            const target = document.getElementById(targetId);
            const arrow = this.querySelector('.arrow');

            if (!target) return;

            if (target.classList.contains('hidden')) {
                // Expand - render children
                target.classList.remove('hidden');
                arrow.textContent = '▼';

                // Only render if not already rendered
                if (!target.hasAttribute('data-rendered')) {
                    try {
                        const jsonB64 = target.getAttribute('data-json');
                        const jsonStr = decodeURIComponent(escape(atob(jsonB64)));
                        const val = JSON.parse(jsonStr);
                        let html = '';
                        if (Array.isArray(val)) {
                            for (const item of val) {
                                html += '<div class="nested-item">' + renderField('', item, 1) + '</div>';
                            }
                        } else {
                            for (const [k, v] of Object.entries(val)) {
                                html += '<div class="nested-item">' + renderField(k, v, 1) + '</div>';
                            }
                        }
                        target.innerHTML = html;
                        target.setAttribute('data-rendered', 'true');

                        // Attach listeners to newly created triggers
                        attachToggleListeners();
                    } catch (err) {
                        target.innerHTML = '<div class="null">Error: ' + esc(err.message) + '</div>';
                        console.error('Toggle error:', err);
                    }
                }
            } else {
                // Collapse
                target.classList.add('hidden');
                arrow.textContent = '▶';
            }
        });
    });
}
function renderEvents() {
    const s = currentState; let html = '';
    html += '<h3>Runtime Stack</h3><p>Size: ' + s.gameRuntimeStack.stackSize + ' | Running: ' + s.gameRuntimeStack.isRunning + '</p>';
    const events = s.mapEvents || [];
    html += '<h3>Map Events (' + events.length + ')</h3>';
    if (events.length) {
        html += '<table><thead><tr><th>ID</th><th>Name</th><th>Type</th></tr></thead><tbody>';
        for (const [id, evt] of events) html += '<tr><td>' + esc(id) + '</td><td>' + esc(String(evt.name || '-')) + '</td><td>' + esc(String(evt.type || '-')) + '</td></tr>';
        html += '</tbody></table>';
    }
    const items = s.mapItems || [];
    html += '<h3>Map Items (' + items.length + ')</h3>';
    if (items.length) {
        html += '<table><thead><tr><th>ID</th><th>Name</th><th>Index</th></tr></thead><tbody>';
        for (const [id, item] of items) html += '<tr><td>' + esc(id) + '</td><td>' + esc(String(item.name || '-')) + '</td><td>' + esc(String(item.index ?? '-')) + '</td></tr>';
        html += '</tbody></table>';
    }
    content.innerHTML = html;
}
function renderLogs() {
    const logs = currentState.gameLogList || [];
    if (logs.length === 0) { content.textContent = 'No logs yet'; return; }
    let html = '<table><thead><tr><th>Time</th><th>Content</th></tr></thead><tbody>';
    for (const log of logs) {
        const t = log.time != null ? (log.time / 1000).toFixed(1) + 's' : '-';
        html += '<tr><td>' + esc(t) + '</td><td>' + esc(log.content || '-') + '</td></tr>';
    }
    html += '</tbody></table>';
    content.innerHTML = html;
    content.scrollTop = content.scrollHeight;
}
function renderRaw() {
    const filter = searchInput.value.toLowerCase();
    let json = JSON.stringify(currentState, null, 2);
    if (filter) { json = json.split('\n').filter(l => l.toLowerCase().includes(filter)).join('\n'); }
    content.innerHTML = '<pre>' + esc(json) + '</pre>';
}
// Close button - use IPC instead of getFocusedWindow()
document.getElementById('closeBtn').addEventListener('click', () => {
    ipcRenderer.send('close-inspector');
});

// Make toolbar draggable
document.querySelector('.toolbar').style['-webkit-app-region'] = 'drag';
document.querySelectorAll('.toolbar button').forEach(b => b.style['-webkit-app-region'] = 'no-drag');

fetchState();