import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's missing icon URLs when bundled by Vite
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41], // Default anchor for Leaflet marker
  popupAnchor: [1, -34], // Default popup anchor
});
L.Marker.prototype.options.icon = DefaultIcon;

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
import { initializeChat } from "./chat-client.js";

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

  // Try to initialize chat if we are logged in
  const username = localStorage.getItem("revolutionaryUsername");
  if (username) {
    initializeChat(username);
  }

  // Start the main game loop
  gameLoopManager.start();
}
