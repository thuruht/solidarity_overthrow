import { addLogEntry } from "./log.js";

export function showToast(title, message, type = "info", duration = 5000) {
  const container = document.getElementById("notification-container");
  if (!container) {
    console.error("Notification container not found!");
    return;
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
        <h3>${title}</h3>
        <p>${message}</p>
    `;

  // Set animation duration via JS
  toast.style.animationDuration = `${duration / 1000}s, ${duration / 1000}s`;
  toast.style.animation = `slideIn 0.5s ease forwards, fadeOut 0.5s ease ${
    duration / 1000 - 0.5
  }s forwards`;

  container.appendChild(toast);

  // Also log the notification to the history
  if (addLogEntry) {
    addLogEntry(`${title}: ${message}`, type);
  }

  // Remove the element after the animation finishes
  toast.addEventListener("animationend", (e) => {
    if (e.animationName === "fadeOut") {
      toast.remove();
    }
  });
}
