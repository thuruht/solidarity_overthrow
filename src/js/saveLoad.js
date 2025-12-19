import { getCities, getMetrics, applyLoadedState } from "./gameState.js";
import { showToast } from "./notifications.js";
import { updateGlobalMetrics } from "./uiControls.js";

export function initializeSaveGame() {
  const savePanelToggle = document.querySelector(
    '[data-target="save-game-panel"]'
  );
  if (!savePanelToggle) return;

  savePanelToggle.addEventListener("click", () => {
    const slotsContainer = document.querySelector(
      "#save-game-panel .save-slots"
    );
    slotsContainer.innerHTML = ""; // Clear previous
    for (let i = 1; i <= 3; i++) {
      const slotButton = document.createElement("button");
      slotButton.className = "action-btn";
      slotButton.textContent = `Save to Slot ${i}`;
      slotButton.dataset.slotId = `slot${i}`;
      slotButton.addEventListener("click", handleSaveClick);
      slotsContainer.appendChild(slotButton);
    }
  });
}

async function handleSaveClick(event) {
  const slotId = event.target.dataset.slotId;
  const gameState = {
    cities: getCities(),
    metrics: getMetrics(),
  };

  try {
    showToast("Saving...", `Saving game to ${slotId}.`, "info");
    const response = await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotId, gameState }),
    });

    if (!response.ok)
      throw new Error(`Server responded with ${response.status}`);
    const result = await response.json();
    if (result.success) {
      showToast("Game Saved!", `Progress saved to ${slotId}.`, "success");
    } else {
      throw new Error(result.message || "Unknown server error.");
    }
  } catch (error) {
    console.error("Failed to save game:", error);
    showToast("Save Failed", error.message, "error");
  }
}

export function initializeLoadGame() {
  const loadPanelToggle = document.querySelector(
    '[data-target="load-game-panel"]'
  );
  if (!loadPanelToggle) return;

  loadPanelToggle.addEventListener("click", async () => {
    const slotsContainer = document.querySelector(
      "#load-game-panel .load-slots"
    );
    slotsContainer.innerHTML = '<div class="loading-spinner"></div>';

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

async function handleLoadClick(event) {
  const slotId = event.target.dataset.slotId;
  try {
    showToast("Loading...", `Loading game from ${slotId}.`, "info");
    const response = await fetch(`/api/load?slotId=${slotId}`);
    
    if (!response.ok) {
       // Try to parse error message if possible
       let errorMsg = `Server responded with ${response.status}`;
       try {
         const errData = await response.json();
         if (errData.error) errorMsg = errData.error;
       } catch (e) {}
       throw new Error(errorMsg);
    }

    const loadedData = await response.json();
    
    // The worker returns the raw game state object
    if (loadedData && loadedData.cities && loadedData.metrics) {
      applyLoadedState(loadedData);
      updateGlobalMetrics();
      showToast("Game Loaded!", `Progress restored from ${slotId}.`, "success");
    } else {
      throw new Error("Invalid save file format.");
    }
  } catch (error) {
    console.error("Failed to load game:", error);
    showToast("Load Failed", error.message, "error");
  }
}
