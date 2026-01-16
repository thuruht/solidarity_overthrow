import { getMetrics, getCities } from "./gameState.js";
import { updateCityMetrics } from "./cityInteractions.js";
import { updateProgress } from "./progress.js";
import { initializeSaveGame, initializeLoadGame } from "./saveLoad.js";

export function initializeControls(map) {
  const controlToggles = document.querySelectorAll(".control-toggle");
  const backdrop = document.getElementById("panel-backdrop");
  let activePanel = null;
  
  // Check if we're on mobile
  const isMobile = () => window.innerWidth <= 768;

  controlToggles.forEach((toggle) => {
    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
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
        const prevPanel = document.getElementById(currentActivePanelId);
        prevPanel.classList.remove("show");
        setTimeout(() => {
          prevPanel.style.display = "none";
        }, 300);
      }

      // Toggle current button and panel
      this.classList.toggle("active");
      if (this.classList.contains("active")) {
        targetPanel.style.display = "block";
        // Force reflow for animation
        targetPanel.offsetHeight;
        targetPanel.classList.add("show");
        activePanel = targetPanel;
        
        // Show backdrop on mobile
        if (isMobile() && backdrop) {
          backdrop.classList.add("show");
        }
        
        // Special handling for panels that need dynamic content
        if (targetPanelId === "legend-panel") {
          updateGlobalMetrics();
        }
      } else {
        targetPanel.classList.remove("show");
        setTimeout(() => {
          targetPanel.style.display = "none";
        }, 300);
        activePanel = null;
        
        // Hide backdrop
        if (backdrop) {
          backdrop.classList.remove("show");
        }
      }
    });
  });

  // Close panel if clicking backdrop or outside
  const closeActivePanel = () => {
    const currentActiveToggle = document.querySelector(
      ".control-toggle.active"
    );
    if (currentActiveToggle && activePanel) {
      currentActiveToggle.classList.remove("active");
      activePanel.classList.remove("show");
      setTimeout(() => {
        activePanel.style.display = "none";
      }, 300);
      activePanel = null;
      
      if (backdrop) {
        backdrop.classList.remove("show");
      }
    }
  };
  
  // Click backdrop to close
  if (backdrop) {
    backdrop.addEventListener("click", closeActivePanel);
  }
  
  // Click outside to close (desktop)
  document.addEventListener("click", function (event) {
    if (
      activePanel &&
      !activePanel.contains(event.target) &&
      !event.target.closest(".control-toggle") &&
      !isMobile()
    ) {
      closeActivePanel();
    }
  });
  
  // ESC key to close
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && activePanel) {
      closeActivePanel();
    }
  });
  
  // Swipe down to close on mobile
  let touchStartY = 0;
  let touchEndY = 0;
  
  document.addEventListener("touchstart", function (event) {
    if (activePanel && activePanel.contains(event.target) && isMobile()) {
      touchStartY = event.touches[0].clientY;
    }
  }, { passive: true });
  
  document.addEventListener("touchmove", function (event) {
    if (activePanel && touchStartY > 0 && isMobile()) {
      touchEndY = event.touches[0].clientY;
      const diff = touchEndY - touchStartY;
      
      // Only allow downward swipes and apply transform
      if (diff > 0) {
        activePanel.style.transform = `translateY(${diff}px)`;
      }
    }
  }, { passive: true });
  
  document.addEventListener("touchend", function () {
    if (activePanel && touchStartY > 0 && isMobile()) {
      const diff = touchEndY - touchStartY;
      
      // If swiped down more than 100px, close the panel
      if (diff > 100) {
        closeActivePanel();
      }
      
      // Reset transform
      activePanel.style.transform = "";
      touchStartY = 0;
      touchEndY = 0;
    }
  });

  // Initialize city search
  initializeCitySearch(map);
  initializeSaveGame();
  initializeLoadGame();
}

// These functions will be called from initializeSocialFeatures in auth.js or other modules
export function initializeLeaderboard() {
  const leaderboardToggle = document.querySelector(
    '.control-toggle[data-target="leaderboard-panel"]'
  );
  leaderboardToggle.addEventListener("click", fetchLeaderboard, { once: true });
}

async function fetchLeaderboard() {
  const list = document.getElementById("leaderboard-list");
  list.innerHTML = '<div style="text-align:center; padding: 10px;"><div class="loading-spinner"></div></div>';
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
        <span><span class="material-icons">military_tech</span> IPI: <strong>${getMetrics().ipi.toFixed(
          2
        )}%</strong></span>
        <span><span class="material-icons">campaign</span> Propaganda: <strong>${getMetrics().propaganda.toFixed(
          2
        )}%</strong></span>
        <span><span class="material-icons">groups</span> Solidarity: <strong>${getMetrics().solidarity.toFixed(
          2
        )}%</strong></span>
    `;

  // Update progress trackers
  if (updateProgress) {
    updateProgress("solidarity", getMetrics().solidarity);
    updateProgress("ipi", getMetrics().ipi);
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

    const filteredCities = getCities().filter((city) =>
      city.name.toLowerCase().includes(searchTerm)
    );

    filteredCities.forEach((city) => {
      const resultItem = document.createElement("div");
      resultItem.classList.add("search-result-item");
      resultItem.textContent = city.name;
      resultItem.addEventListener("click", () => {
        map.flyTo([city.lat, city.lon], 6);
        updateCityMetrics(city.name); // Changed to city.name
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
