import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { gsap } from "gsap";
import {
  getCities,
  getMetrics,
  applyLoadedState,
  setCities,
  setMetrics,
} from "./gameState.js";
import { checkUserSession } from "./auth.js";
import { initializeControls } from "./uiControls.js";
import { initializeSaveGame, initializeLoadGame } from "./saveLoad.js";
import { setupCityInteractions, updateCityMetrics } from "./cityInteractions.js";
import { initializeCollectiveActions as initCollectiveActions } from "./collectiveActions.js";
import { gameLoopManager } from "./gameLoop.js";
import { initRandomEvents } from "./randomEvents.js";
import { initializeLog } from "./log.js";
import { initializeProgressTrackers } from "./progress.js";
import { initializeIntro } from "./intro.js";

import { showToast } from "./notifications.js";
import "../css/main.css";

// Export map instance to be used across modules
export let map;

let isInitialLoad = true;

document.addEventListener("DOMContentLoaded", function () {
  checkUserSession();
  if (isInitialLoad) {
    isInitialLoad = false;
    const urlParams = new URLSearchParams(window.location.search);
    const skipIntro = urlParams.get("skipIntro") === "true";

    if (skipIntro) {
      initializeGame();
    } else {
      initializeIntro(initializeGame);
    }
  }
});



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

  // Initialize city interactions (markers, dropdown)
  setupCityInteractions();

  // Initialize various game components
  initializeControls(map);
  initCollectiveActions();
  initRandomEvents();
  initializeLog();
  initializeProgressTrackers();

  // Start the game
  startGame(map);
}









function startGame(map) {
  // This function is called after the intro is dismissed
  console.log("Game has started!");
  // Start the main game loop
  gameLoopManager.start();
}
