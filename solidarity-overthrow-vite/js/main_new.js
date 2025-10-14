import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { gsap } from "gsap";
import {
  globalCities,
  globalMetricsData,
  applyLoadedState,
} from "./gameState.js";
import { setupCityInteractions, updateCityMetrics } from "./solid0p2.js";
import { initializeCollectiveActions as initCollectiveActions } from "./solid0p3.js";
import { gameLoopManager } from "./gameLoop.js";
import { initRandomEvents } from "./randomEvents.js";
import { initializeLog } from "./log.js";
import { initializeProgressTrackers, updateProgress } from "./progress.js";
import { initializeIntro } from "./intro.js";
import { initializeChat } from "./chat-client.js";

// Export map instance to be used across modules
export let map;

let isInitialLoad = true;

document.addEventListener("DOMContentLoaded", function () {
  checkUserSession(); // Check login status on every page load
  if (isInitialLoad) {
    isInitialLoad = false;
    // This function will be called when the DOM is ready
    // It will set up the initial UI and wait for the user to start the game
    const urlParams = new URLSearchParams(window.location.search);
    const skipIntro = urlParams.get("skipIntro") === "true";

    if (skipIntro) {
      // If we skip the intro, we can start the game immediately
      initializeGame();
    } else {
      // The intro script will handle starting the game
      initializeIntro(initializeGame);
    }
  }
});

async function checkUserSession() {
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

export function initializeGame() {
  // Initialize the game map
  map = L.map("map", {
    center: [20, 0],
    zoom: 2,
    minZoom: 2,
    maxZoom: 6,
    worldCopyJump: true,
    attributionControl: false,
  });

  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  }).addTo(map);

  // Initialize various game components
  setupCityInteractions(); // From solid0p2.js
  initializeControls(map);
  initRandomEvents(); // Initializes the system, but doesn't start the timer.

  // Initialize notification and log systems
  initializeLog();
  initializeProgressTrackers();

  // Start the game
  startGame(map);
}

function initializeControls(map) {
  const controlToggles = document.querySelectorAll(".control-toggle");
  let activePanel = null;

  controlToggles.forEach((toggle) => {
    toggle.addEventListener("click", function () {
      const targetPanelId = this.getAttribute("data-target");
      const targetPanel = document.getElementById(targetPanelId);

      // Deactivate previously active toggle and hide its panel
      const currentActiveToggle = document.querySelector(
        ".control-toggle.active"
      );
      if (currentActiveToggle && currentActiveToggle !== this) {
        currentActiveToggle.classList.remove("active");
        const currentActivePanelId =
          currentActiveToggle.getAttribute("data-target");
        document.getElementById(currentActivePanelId).style.display = "none";
      }

      // Toggle current button and panel
      this.classList.toggle("active");
      if (this.classList.contains("active")) {
        targetPanel.style.display = "block";
        activePanel = targetPanel;
        // Special handling for panels that need dynamic content
        if (targetPanelId === "legend-panel") {
          updateGlobalMetrics();
        }
      } else {
        targetPanel.style.display = "none";
        activePanel = null;
      }
    });
  });

  // Close panel if clicking outside
  document.addEventListener("click", function (event) {
    if (
      activePanel &&
      !activePanel.contains(event.target) &&
      !event.target.closest(".control-toggle")
    ) {
      const currentActiveToggle = document.querySelector(
        ".control-toggle.active"
      );
      if (currentActiveToggle) {
        currentActiveToggle.classList.remove("active");
        activePanel.style.display = "none";
        activePanel = null;
      }
    }
  });

  // Initialize city search
  initializeCitySearch(map);
  // Initialize collective actions
  initCollectiveActions();
  // Initialize save game functionality
  initializeSaveGame();
  // Initialize load game functionality
  initializeLoadGame();
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

function initializeLeaderboard() {
  const leaderboardToggle = document.querySelector(
    '.control-toggle[data-target="leaderboard-panel"]'
  );
  leaderboardToggle.addEventListener("click", fetchLeaderboard, { once: true });
}

async function fetchLeaderboard() {
  const list = document.getElementById("leaderboard-list");
  list.innerHTML = "<li>Loading...</li>";
  try {
    const response = await fetch("/api/leaderboard");
    if (!response.ok) throw new Error("Failed to fetch leaderboard");

    const scores = await response.json();
    if (scores.length === 0) {
      list.innerHTML = "<li>No scores yet. Be the first!</li>";
      return;
    }

    list.innerHTML = scores
      .map(
        (entry) =>
          `<li><strong>${entry.username}</strong> - ${entry.score}</li>`
      )
      .join("");
  } catch (error) {
    list.innerHTML = "<li>Error loading scores.</li>";
    console.error(error);
  }
}

export function updateGlobalMetrics() {
  const metricsContainer = document.querySelector(
    "#legend-panel .global-metrics"
  );
  if (!metricsContainer) return;

  metricsContainer.innerHTML = `
        <span><span class="material-icons">military_tech</span> IPI: <strong>${globalMetricsData.ipi.toFixed(
          2
        )}%</strong></span>
        <span><span class="material-icons">campaign</span> Propaganda: <strong>${globalMetricsData.propaganda.toFixed(
          2
        )}%</strong></span>
        <span><span class="material-icons">groups</span> Solidarity: <strong>${globalMetricsData.solidarity.toFixed(
          2
        )}%</strong></span>
    `;

  // Update progress trackers
  if (updateProgress) {
    updateProgress("solidarity", globalMetricsData.solidarity);
    updateProgress("ipi", globalMetricsData.ipi);
  }
}

function initializeCitySearch(map) {
  const citySearchInput = document.getElementById("citySearch");
  const searchResultsContainer = document.getElementById("city-search-results");

  citySearchInput.addEventListener("input", function () {
    const searchTerm = this.value.toLowerCase();
    searchResultsContainer.innerHTML = ""; // Clear previous results

    if (searchTerm.length === 0) {
      return;
    }

    const filteredCities = globalCities.filter((city) =>
      city.name.toLowerCase().includes(searchTerm)
    );

    filteredCities.forEach((city) => {
      const resultItem = document.createElement("div");
      resultItem.classList.add("search-result-item");
      resultItem.textContent = city.name;
      resultItem.addEventListener("click", () => {
        map.flyTo([city.lat, city.lon], 6);
        updateCityMetrics(city);
        this.value = city.name; // Populate input with selected city
        searchResultsContainer.innerHTML = ""; // Clear results
        // Close the panel after selection
        const toggle = document.querySelector(
          '.control-toggle[data-target="city-search-panel"]'
        );
        if (toggle) {
          toggle.click();
        }
      });
      searchResultsContainer.appendChild(resultItem);
    });
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

function initializeLoadGame() {
  const loadPanelToggle = document.querySelector(
    '[data-target="load-game-panel"]'
  );
  if (!loadPanelToggle) return;

  loadPanelToggle.addEventListener("click", async () => {
    const slotsContainer = document.querySelector(
      "#load-game-panel .load-slots"
    );
    slotsContainer.innerHTML = "<p>Fetching saves...</p>";

    try {
      const response = await fetch("/api/saves");
      if (!response.ok) throw new Error("Could not fetch save list.");
      const saves = await response.json();

      slotsContainer.innerHTML = ""; // Clear loading message
      if (saves.length === 0) {
        slotsContainer.innerHTML = "<p>No saved games found.</p>";
        return;
      }

      saves.forEach((save) => {
        const slotButton = document.createElement("button");
        slotButton.className = "action-btn";
        const saveDate = save.metadata?.timestamp
          ? new Date(save.metadata.timestamp).toLocaleString()
          : "No date";
        slotButton.innerHTML = `Load ${save.slotId}<br><small>${saveDate}</small>`;
        slotButton.dataset.slotId = save.slotId;
        slotButton.addEventListener("click", handleLoadClick);
        slotsContainer.appendChild(slotButton);
      });
    } catch (error) {
      slotsContainer.innerHTML = `<p style="color: red;">${error.message}</p>`;
    }
  });
}

function startGame(map) {
  // This function is called after the intro is dismissed
  console.log("Game has started!");
  // Start the main game loop
  gameLoopManager.start();
}
