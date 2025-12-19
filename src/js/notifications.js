import { addLogEntry } from "./log.js";

export function showToast(title, message, type = "info", duration = 5000) {
  const container = document.getElementById("notification-container");
  if (!container) {
    console.error("Notification container not found!");
    return;
  }

  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  
  notification.innerHTML = `
        <div>
            <h3>${title}</h3>
            <p>${message}</p>
        </div>
        <span class="notification-close">&times;</span>
    `;

  // Close button functionality
  const closeBtn = notification.querySelector(".notification-close");
  closeBtn.addEventListener("click", () => {
    notification.remove();
  });

  // Add to the top of the container (so newest is top)
  // container.prepend(notification); 
  // Wait, if it pushes the map down, maybe we want it at the bottom of the container?
  // If we prepend, the "stack" grows downwards.
  container.appendChild(notification);
  
  // Auto-scroll to bottom of notification container to see newest?
  // container.scrollTop = container.scrollHeight;

  // Also log the notification to the history
  if (addLogEntry) {
    addLogEntry(`${title}: ${message}`, type);
  }
}
