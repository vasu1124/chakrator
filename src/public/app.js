require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs' } });

require(['vs/editor/editor.main'], function () {
    const editor = monaco.editor.create(document.getElementById('editor-container'), {
        value: '// Loading...',
        language: 'typescript',
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: false }
    });

    // Load initial code
    fetch('/api/code')
        .then(res => res.json())
        .then(data => {
            if (data.code) {
                editor.setValue(data.code);
            }
        })
        .catch(err => console.error('Failed to load code:', err));

    // Save code
    const saveBtn = document.getElementById('save-btn');
    const statusSpan = document.getElementById('status');

    saveBtn.addEventListener('click', () => {
        const code = editor.getValue();
        statusSpan.textContent = 'Saving...';

        fetch('/api/code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    statusSpan.textContent = 'Saved';
                    setTimeout(() => statusSpan.textContent = 'Ready', 2000);
                } else {
                    statusSpan.textContent = 'Error saving';
                }
            })
            .catch(err => {
                console.error(err);
                statusSpan.textContent = 'Error saving';
            });
    });

    // Logs
    const socket = io();
    const logsContent = document.getElementById('logs-content');
    const clearLogsBtn = document.getElementById('clear-logs');
    const logCountSpan = document.getElementById('log-count');
    const autoScrollToggle = document.getElementById('auto-scroll-toggle');
    const filterBtns = document.querySelectorAll('.filter-btn');

    let logCount = 0;
    let autoScroll = true;
    let currentFilter = 'all';

    // Auto-scroll toggle
    autoScrollToggle.addEventListener('click', () => {
        autoScroll = !autoScroll;
        autoScrollToggle.classList.toggle('active', autoScroll);
    });

    // Filter buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            applyFilter();
        });
    });

    function applyFilter() {
        const entries = logsContent.querySelectorAll('.log-entry');
        entries.forEach(entry => {
            if (currentFilter === 'all') {
                entry.classList.remove('hidden');
            } else {
                entry.classList.toggle('hidden', !entry.classList.contains(currentFilter));
            }
        });
    }

    function detectLogLevel(msg) {
        const msgLower = msg.toLowerCase();
        if (msgLower.includes('error') || msgLower.includes('❌') || msgLower.includes('failed')) {
            return 'error';
        }
        if (msgLower.includes('success') || msgLower.includes('✅') || msgLower.includes('complete')) {
            return 'success';
        }
        if (msgLower.includes('warn') || msgLower.includes('⚠️')) {
            return 'warn';
        }
        if (msgLower.includes('debug')) {
            return 'debug';
        }
        if (msg.startsWith('━━━')) {
            return 'separator';
        }
        return 'info';
    }

    function formatLogMessage(msg) {
        // Remove timestamp prefix if present (we'll add our own)
        msg = msg.replace(/^\[\d{1,2}:\d{2}:\d{2}[^\]]*\]\s*/, '');
        return msg;
    }

    socket.on('log', (msg) => {
        // Remove empty state on first log
        const emptyState = logsContent.querySelector('.logs-empty');
        if (emptyState) {
            emptyState.remove();
        }

        const level = detectLogLevel(msg);
        const formattedMsg = formatLogMessage(msg);

        const div = document.createElement('div');
        div.className = `log-entry ${level}`;

        const timestamp = document.createElement('span');
        timestamp.className = 'log-timestamp';
        timestamp.textContent = new Date().toLocaleTimeString('en-US', { hour12: false });

        const message = document.createElement('span');
        message.className = 'log-message';
        message.textContent = formattedMsg;

        if (level !== 'separator') {
            const levelBadge = document.createElement('span');
            levelBadge.className = 'log-level';
            levelBadge.textContent = level;

            div.appendChild(timestamp);
            div.appendChild(levelBadge);
            div.appendChild(message);
        } else {
            div.appendChild(message);
        }

        logsContent.appendChild(div);
        logCount++;
        logCountSpan.textContent = logCount;

        // Apply current filter to new entry
        if (currentFilter !== 'all' && !div.classList.contains(currentFilter)) {
            div.classList.add('hidden');
        }

        // Auto-scroll
        if (autoScroll) {
            logsContent.scrollTop = logsContent.scrollHeight;
        }
    });

    clearLogsBtn.addEventListener('click', () => {
        logsContent.innerHTML = `
            <div class="logs-empty">
                <div class="logs-empty-icon">📋</div>
                <div class="logs-empty-text">Waiting for logs...</div>
            </div>
        `;
        logCount = 0;
        logCountSpan.textContent = '0';
    });
});
