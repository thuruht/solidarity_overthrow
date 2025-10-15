let logHistory = [];

export function initializeLog() {
  logHistory = [];
  renderLog();
}

export function addLogEntry(message, type = "info") {
  const logEntry = {
    message: message,
    type: type,
    timestamp: new Date().toLocaleTimeString(),
  };
  logHistory.unshift(logEntry); // Add to the beginning of the array
  if (logHistory.length > 50) {
    logHistory.pop(); // Keep the log at a reasonable size
  }
  renderLog();
}

function renderLog() {
  const logContainer = document.getElementById("log-history");
  if (!logContainer) return;

  logContainer.innerHTML = logHistory
    .map((entry) => {
      return `<div class="log-entry ${entry.type}">[${entry.timestamp}] ${entry.message}</div>`;
    })
    .join("");
}
