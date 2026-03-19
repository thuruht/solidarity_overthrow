import { addLogEntry } from "./log.js";

export function showToast(title, content, type = "info", duration = 7000) {
  const container = document.getElementById("notification-container");
  if (!container) {
    console.error("Notification container not found!");
    return;
  }

  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  
  const contentWrapper = document.createElement('div');
  
  const titleEl = document.createElement('h3');
  titleEl.textContent = title;
  contentWrapper.appendChild(titleEl);

  if (typeof content === 'string') {
    const p = document.createElement('p');
    p.innerHTML = content; // Use innerHTML for simple strings that might contain bold, etc.
    contentWrapper.appendChild(p);
  } else if (content instanceof HTMLElement) {
    content.classList.add('toast-content');
    contentWrapper.appendChild(content);
  }

  const closeBtn = document.createElement('span');
  closeBtn.className = 'notification-close';
  closeBtn.innerHTML = '&times;';

  notification.appendChild(contentWrapper);
  notification.appendChild(closeBtn);

  const removeNotif = () => {
    notification.classList.remove('visible');
    // Remove the element after the transition ends
    setTimeout(() => notification.remove(), 400); 
  };

  closeBtn.addEventListener("click", removeNotif);

  if (duration > 0) {
    setTimeout(removeNotif, duration);
  }

  container.appendChild(notification);

  // Trigger the animation
  // We need a short delay to allow the element to be added to the DOM first
  setTimeout(() => {
    notification.classList.add("visible");
  }, 50);

  // Also log the notification to the history
  if (addLogEntry) {
    const logMessage = typeof content === 'string' ? content : content.textContent.trim().substring(0, 50) + '...';
    addLogEntry(`${title}: ${logMessage}`, type);
  }
}
