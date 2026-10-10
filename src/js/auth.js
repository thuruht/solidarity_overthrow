import { initializeChat } from "./chat-client.js";
import { showToast } from "./notifications.js";
import { initializeAdminPanel } from "./adminPanel.js";
import { initializeLeaderboard } from "./uiControls.js";

// Handles user authentication and session, and initializes social features
export async function checkUserSession() {
  try {
    const response = await fetch("/api/me");
    const { user } = await response.json();

    const loggedOutView = document.getElementById("auth-logged-out");
    const loggedInView = document.getElementById("auth-logged-in");

    if (user) {
      // User is logged in
      if (loggedOutView) loggedOutView.style.display = "none";
      if (loggedInView) loggedInView.style.display = "flex";
      const nameEl = document.getElementById("user-name");
      if (nameEl) nameEl.textContent = user.username;

      // Pass the authenticated user to the social features
      initializeSocialFeatures(user);

      // Show admin controls if user is an admin
      const adminControls = document.getElementById("admin-controls");
      if (user.isAdmin && adminControls) {
        adminControls.style.display = "block";
        initializeAdminPanel();
      } else if (adminControls) {
        adminControls.style.display = "none";
      }
    } else {
      // User is not logged in
      if (loggedOutView) loggedOutView.style.display = "flex";
      if (loggedInView) loggedInView.style.display = "none";
      const adminControls = document.getElementById("admin-controls");
      if (adminControls) adminControls.style.display = "none";
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

function setFormError(formEl, message) {
  const errorEl = formEl.querySelector(".auth-form-error");
  if (errorEl) {
    errorEl.textContent = message || "";
    errorEl.style.display = message ? "block" : "none";
  }
}

async function submitAuthForm(endpoint, formEl) {
  const username = formEl.querySelector('input[name="username"]').value.trim();
  const password = formEl.querySelector('input[name="password"]').value;

  setFormError(formEl, "");

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setFormError(formEl, data.error || "Something went wrong.");
      return false;
    }

    showToast(
      "Welcome, comrade!",
      `Logged in as ${data.user?.username || username}.`,
      "success"
    );
    await checkUserSession();
    return true;
  } catch (error) {
    console.error("Auth request failed:", error);
    setFormError(formEl, "Network error. Please try again.");
    return false;
  }
}

export function initializeAuthForms() {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const logoutBtn = document.getElementById("logout-btn");
  const showRegisterBtn = document.getElementById("show-register");
  const showLoginBtn = document.getElementById("show-login");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const ok = await submitAuthForm("/api/login", loginForm);
      if (ok) loginForm.reset();
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const ok = await submitAuthForm("/api/register", registerForm);
      if (ok) registerForm.reset();
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      await fetch("/api/logout");
      localStorage.removeItem("revolutionaryUsername");
      window.location.reload();
    });
  }

  // Toggle between login and register forms within the same panel
  if (showRegisterBtn && showLoginBtn && loginForm && registerForm) {
    showRegisterBtn.addEventListener("click", () => {
      loginForm.style.display = "none";
      registerForm.style.display = "flex";
    });
    showLoginBtn.addEventListener("click", () => {
      registerForm.style.display = "none";
      loginForm.style.display = "flex";
    });
  }
}
