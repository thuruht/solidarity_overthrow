function initializeLog() {
    window.logHistory = [];
    window.addLogEntry = function(message, type = 'info') {
        const logEntry = {
            message: message,
            type: type,
            timestamp: new Date().toLocaleTimeString()
        };
        window.logHistory.unshift(logEntry); // Add to the beginning of the array
        if (window.logHistory.length > 50) {
            window.logHistory.pop(); // Keep the log at a reasonable size
        }
        renderLog();
    };
}

function renderLog() {
    const logContainer = document.getElementById('log-history');
    if (!logContainer) return;

    logContainer.innerHTML = window.logHistory.map(entry => {
        return `<div class="log-entry ${entry.type}">[${entry.timestamp}] ${entry.message}</div>`;
    }).join('');
}

// Example of how to add a log entry from another script:
// window.addLogEntry("A new event has started!");
