import { initializeChat } from "./chat-client.js";
import { showToast } from "./notifications.js";
import { initializeAdminPanel } from "./adminPanel.js";
import { initializeLeaderboard } from "./uiControls.js";

// Handles user authentication and session, and initializes social features
export async function checkUserSession() {
  try {
    const response = await fetch("/api/me");
    const { user } = await response.json();

    const loginBtn = document.getElementById("login-btn");
    const userInfo = document.getElementById("user-info");

    if (user) {
      // User is logged in
      loginBtn.style.display = "none";
      userInfo.style.display = "flex";
      document.getElementById("user-name").textContent = user.username;
      document.getElementById("user-avatar").src = user.avatar;
      // Pass the authenticated user to the social features
      initializeSocialFeatures(user);

      // Show admin controls if user is an admin
      if (user.isAdmin) {
        document.getElementById("admin-controls").style.display = "block";
        initializeAdminPanel();
      }
    } else {
      // User is not logged in
      loginBtn.style.display = "flex";
      userInfo.style.display = "none";
    }
  } catch (error) {
    console.error("Error checking user session:", error);
  }
}

function initializeSocialFeatures(user) {
  // If no user is logged in, we don't initialize these features.
  if (!user) {
    console.log("No user logged in, skipping social features.");
    return;
  }

  localStorage.setItem("revolutionaryUsername", user.username); // Save for score submission
  initializeChat(user.username);
  initializeLeaderboard();
}
