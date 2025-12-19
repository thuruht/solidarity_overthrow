import { showToast } from "./notifications.js";

export function initializeAdminPanel() {
  const adminToggle = document.querySelector('[data-target="admin-panel"]');
  if (!adminToggle) return;

  adminToggle.addEventListener("click", async () => {
    const container = document.getElementById("admin-chat-users");
    container.innerHTML = '<div class="loading-spinner"></div>';
    try {
      const response = await fetch("/api/admin/chat-status");
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      const status = await response.json();

      let html = "<ul>";
      status.sessions.forEach((session) => {
        const isMuted = status.muted.includes(session.userId);
        html += `
          <li>
            <div>
              <strong>${session.username}</strong>
              ${session.isAdmin ? '<span class="admin-badge">ADMIN</span>' : ""}
              ${isMuted ? '<span class="muted-badge">MUTED</span>' : ""}
            </div>
            ${
              isMuted
                ? `<button class="unmute-btn" data-userid="${session.userId}">Unmute</button>`
                : ""
            }
          </li>
        `;
      });
      html += "</ul>";
      container.innerHTML = html;

      // Add event listeners to the new unmute buttons
      container.querySelectorAll(".unmute-btn").forEach((btn) => {
        btn.addEventListener("click", handleUnmuteClick);
      });
    } catch (error) {
      container.innerHTML = `<p style="color: red;">${error.message}</p>`;
      console.error("Failed to fetch admin chat status:", error);
    }
  });
}

async function handleUnmuteClick(event) {
  const userIdToUnmute = event.target.dataset.userid;
  try {
    const response = await fetch("/api/admin/unmute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIdToUnmute }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    showToast(
      "User Unmuted",
      "The user can now send messages again.",
      "success"
    );
    // Refresh the panel to show the updated status
    document.querySelector('[data-target="admin-panel"]').click(); // Close
    document.querySelector('[data-target="admin-panel"]').click(); // and re-open
  } catch (error) {
    showToast("Error", `Failed to unmute user: ${error.message}`, "error");
  }
}
