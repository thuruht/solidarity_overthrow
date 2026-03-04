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
      setupDeviceFlowLogin(loginBtn);
    }
  } catch (error) {
    console.error("Error checking user session:", error);
  }
}

function setupDeviceFlowLogin(loginBtn) {
  if (loginBtn.dataset.listenerAttached) return;
  loginBtn.dataset.listenerAttached = 'true';

  const modal = document.getElementById("device-flow-modal");
  const urlEl = document.getElementById("device-flow-url");
  const codeEl = document.getElementById("device-flow-code");
  const statusEl = document.getElementById("device-flow-status");
  const cancelBtn = document.getElementById("device-flow-cancel");

  let isPolling = false;

  loginBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    loginBtn.disabled = true;

    try {
      const response = await fetch("/api/auth/device/code");

      // If we get HTML (like a 404 from vite dev server) don't try to parse JSON
      if (!response.ok || response.headers.get("content-type")?.includes("text/html")) {
        throw new Error("API not available in this environment.");
      }

      const data = await response.json();

      if (data.error) {
        showToast("Login Error", data.error, "error");
        loginBtn.disabled = false;
        return;
      }

      urlEl.href = data.verification_uri;
      urlEl.textContent = data.verification_uri;
      codeEl.textContent = data.user_code;
      statusEl.textContent = "Waiting for authorization...";

      import("gsap").then(({ gsap }) => {
        modal.style.display = "flex";
        gsap.fromTo(modal, { opacity: 0 }, { opacity: 1, duration: 0.3 });
      });

      isPolling = true;
      pollForDeviceToken(data.device_code, data.interval);

    } catch (err) {
      console.error("Device flow error:", err);

      // For local testing/demo without backend: show a mocked modal
      if (err.message.includes("API not available")) {
        urlEl.href = "https://github.com/login/device";
        urlEl.textContent = "https://github.com/login/device";
        codeEl.textContent = "DEMO-CODE";
        statusEl.textContent = "Waiting for authorization... (MOCKED DEMO MODE)";

        import("gsap").then(({ gsap }) => {
          modal.style.display = "flex";
          gsap.fromTo(modal, { opacity: 0 }, { opacity: 1, duration: 0.3 });
        });
      } else {
        showToast("Login Error", "Failed to start device flow", "error");
        loginBtn.disabled = false;
      }
    }
  });

  cancelBtn.addEventListener("click", () => {
    isPolling = false;
    loginBtn.disabled = false;
    import("gsap").then(({ gsap }) => {
      gsap.to(modal, {
        opacity: 0,
        duration: 0.3,
        onComplete: () => (modal.style.display = "none"),
      });
    });
  });

  async function pollForDeviceToken(deviceCode, interval) {
    let currentInterval = interval;

    while (isPolling) {
      await new Promise(resolve => setTimeout(resolve, currentInterval * 1000));
      if (!isPolling) break;

      try {
        const res = await fetch("/api/auth/device/poll", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ device_code: deviceCode }),
        });

        const data = await res.json();

        if (data.error === "authorization_pending") {
          continue;
        } else if (data.error === "slow_down") {
          currentInterval += 5;
          continue;
        } else if (data.error === "expired_token") {
          statusEl.textContent = "Token expired. Please try again.";
          isPolling = false;
          break;
        } else if (data.error === "access_denied") {
          statusEl.textContent = "Access denied.";
          isPolling = false;
          break;
        } else if (data.error) {
          statusEl.textContent = `Error: ${data.error}`;
          isPolling = false;
          break;
        } else if (data.success && data.user) {
          // Success!
          isPolling = false;
          import("gsap").then(({ gsap }) => {
            gsap.to(modal, {
              opacity: 0,
              duration: 0.3,
              onComplete: () => {
                modal.style.display = "none";
                checkUserSession(); // re-init UI with logged in user
                showToast("Success", "Successfully connected device!", "success");
              },
            });
          });
          break;
        }
      } catch (err) {
        console.error("Poll error:", err);
      }
    }
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
