document.addEventListener('DOMContentLoaded', () => {
    const logPanel = document.getElementById('log-panel');
    const logToggle = document.querySelector('button[data-target="log-panel"]');

    if (logToggle) {
        logToggle.addEventListener('click', () => {
            // We need to check if the panel is about to be active, not if it already is
            setTimeout(() => {
                if (logPanel.classList.contains('active')) {
                    updateNotificationLog();
                }
            }, 0);
        });
    }

    function updateNotificationLog() {
        const logContainer = document.createElement('div');
        logContainer.className = 'notification-log';

        const title = document.createElement('h4');
        title.textContent = 'Notification History';
        logContainer.appendChild(title);

        if (window.notificationHistory && window.notificationHistory.length > 0) {
            const historyList = document.createElement('ul');
            historyList.className = 'notification-history-list';
            window.notificationHistory.slice().reverse().forEach(notif => {
                const item = document.createElement('li');
                item.className = `log-item ${notif.type}`;
                item.innerHTML = `
                    <span class="log-timestamp">${notif.timestamp}</span>
                    <strong class="log-title">${notif.title}</strong>
                    <p class="log-message">${notif.message}</p>
                `;
                historyList.appendChild(item);
            });
            logContainer.appendChild(historyList);
        } else {
            const noNotifications = document.createElement('p');
            noNotifications.textContent = 'No notifications yet.';
            logContainer.appendChild(noNotifications);
        }

        logPanel.innerHTML = '';
        logPanel.appendChild(logContainer);

        updateGameProgress();
    }

    function updateGameProgress() {
        const progressContainer = document.createElement('div');
        progressContainer.className = 'game-progress';

        const title = document.createElement('h4');
        title.textContent = 'Victory Progress';
        progressContainer.appendChild(title);

        const { ipi, solidarity, propaganda } = window.globalMetricsData;
        const { victoryConditions } = window.gameLogic;

        const ipiProgress = 100 - ((ipi - victoryConditions.ipi) / (100 - victoryConditions.ipi) * 100);
        const solidarityProgress = (solidarity / victoryConditions.solidarity) * 100;
        const propagandaProgress = 100 - ((propaganda - victoryConditions.propaganda) / (100 - victoryConditions.propaganda) * 100);

        progressContainer.innerHTML += `
            <div class="progress-item">
                <label>IPI Victory (IPI <= ${victoryConditions.ipi}%)</label>
                <div class="progress-bar"><div class="progress-fill" style="width: ${ipiProgress.toFixed(1)}%;"></div></div>
            </div>
            <div class="progress-item">
                <label>Solidarity Victory (Solidarity >= ${victoryConditions.solidarity}%)</label>
                <div class="progress-bar"><div class="progress-fill" style="width: ${solidarityProgress.toFixed(1)}%;"></div></div>
            </div>
            <div class="progress-item">
                <label>Truth Victory (Propaganda <= ${victoryConditions.propaganda}%)</label>
                <div class="progress-bar"><div class="progress-fill" style="width: ${propagandaProgress.toFixed(1)}%;"></div></div>
            </div>
        `;

        const logPanel = document.getElementById('log-panel');
        logPanel.appendChild(progressContainer);
    }
});