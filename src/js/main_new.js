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
import { checkUserSession, initializeAuthForms } from "./auth.js";
import { initializeControls } from "./uiControls.js";
import { initializeSaveGame, initializeLoadGame } from "./saveLoad.js";
import { setupCityInteractions, updateCityMetrics } from "./cityInteractions.js";
import { initializeCollectiveActions as initCollectiveActions } from "./collectiveActions.js";
import { gameLoopManager } from "./gameLoop.js";
import { initRandomEvents } from "./randomEvents.js";
import { initializeLog } from "./log.js";
import { initializeProgressTrackers } from "./progress.js";
import { initializeIntro } from "./intro.js";
// NOTE: initializeChat is intentionally NOT imported/called here anymore.
// auth.js's checkUserSession() is now the single source of truth for
// starting the chat connection (see startGame() below for why).
import { coupPlanner } from "./coupPlanner.js";
import { addResetViewButton, setupOfflineStorage } from "./mapUtilities.js";

import { showToast } from "./notifications.js";
import "../css/main.css";

// Export map instance to be used across modules
export let map;

let isInitialLoad = true;

document.addEventListener("DOMContentLoaded", function () {
  initializeAuthForms();
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
    zoomControl: false,
  });

  // Add zoom control to top-right to avoid overlap
  L.control.zoom({
    position: 'topright'
  }).addTo(map);

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

  // Revolutionary coup-planning system. Previously this was never
  // initialized anywhere, so the "Plan Revolution" button and the entire
  // fourth win condition were unreachable in the shipped game.
  coupPlanner.initialize();

  // Reset-view map control + offline weather/location cache. Previously
  // exported but never called from anywhere.
  addResetViewButton();
  setupOfflineStorage();

  // Address map visibility glitch after loading/sizing
  setTimeout(() => {
    if (map) {
      map.invalidateSize();
    }
  }, 500);

  // Start the game
  startGame(map);
}









function startGame(map) {
  // This function is called after the intro is dismissed
  console.log("Game has started!");

  // BUGFIX: this used to also call initializeChat(username) here, reading
  // a possibly-stale username out of localStorage. Combined with auth.js's
  // checkUserSession() (which calls initializeChat() again once it confirms
  // the session server-side), a returning logged-in user ended up with two
  // separate WebSocket connections and duplicated chat messages. Chat
  // startup is now handled exclusively by checkUserSession() in auth.js,
  // which only connects once the server has actually confirmed who's
  // logged in - it no longer trusts a stale localStorage value on its own.

  // Start the main game loop
  gameLoopManager.start();
}
