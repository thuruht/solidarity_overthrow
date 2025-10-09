// Notification System
const notificationQueue = [];
let isNotificationVisible = false;

function showNotification(title, message, type = 'info', duration = 8000) {
    // Add notification to the queue
    notificationQueue.push({ title, message, type, duration });

    // If a notification is not already visible, show the next one
    if (!isNotificationVisible) {
        displayNextNotification();
    }
}

function displayNextNotification() {
    // If the queue is empty, do nothing
    if (notificationQueue.length === 0) {
        isNotificationVisible = false;
        return;
    }

    // Get the next notification from the queue
    const { title, message, type, duration } = notificationQueue.shift();
    isNotificationVisible = true;

    // Create the notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <h3>${title}</h3>
        <p>${message}</p>
    `;

    document.body.appendChild(notification);

    // Animate the notification in
    setTimeout(() => {
        notification.classList.add('visible');
    }, 10);

    // Set a timer to hide and remove the notification
    setTimeout(() => {
        notification.classList.remove('visible');

        // Remove the element from the DOM after the transition ends
        notification.addEventListener('transitionend', () => {
            notification.remove();

            // Show the next notification in the queue
            displayNextNotification();
        });
    }, duration);
}

// Expose the showNotification function globally
window.showNotification = showNotification;