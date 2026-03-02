import { map } from "./main_new.js";
// File: solid0p1.js

// Function to set up the map and its basic controls
// This is now handled directly in main_new.js
/*
export function setupMap() {
  // Initialize the map
  map = L.map('map', {
    attributionControl: false // Disable default attribution control
  }).setView([20, 0], 2); // Centered globally

  // Use CartoDB's tile service for clean tiles
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '<small>&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors & <a href="https://carto.com/">CARTO</a></small>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(window.map);

  // Add custom attribution control
  L.control.attribution({
    position: 'bottomright'
  }).addTo(window.map).setPrefix('');

  // Initialize offline storage
  setupOfflineStorage();
};*/

// Add reset view button
function addResetViewButton() {
  const resetButton = L.control({ position: "topleft" });

  resetButton.onAdd = function (map) {
    const button = L.DomUtil.create("button", "reset-view-button");
    button.innerHTML = '<span class="material-icons">public</span> Reset View';
    button.title = "Reset map to default view";

    button.className = "leaflet-control-reset-view";

    // Add click event
    L.DomEvent.on(button, "click", function (e) {
      L.DomEvent.stopPropagation(e);
      map.setView([20, 0], 2); // Reset to default view

      if (typeof gsap !== "undefined") {
        gsap.fromTo(button, { scale: 0.9 }, { scale: 1, duration: 0.3 });
      }
    });

    L.DomEvent.disableClickPropagation(button);

    return button;
  };

  resetButton.addTo(map);
}

// Offline storage setup using IndexedDB
function setupOfflineStorage() {
  if ("indexedDB" in window) {
    const request = indexedDB.open("SolidarityOverthrowDB", 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("weatherData")) {
        db.createObjectStore("weatherData", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("locationData")) {
        db.createObjectStore("locationData", { keyPath: "name" });
      }
    };
    request.onsuccess = (event) => {
      console.log("IndexedDB initialized.");
    };
    request.onerror = () => {
      console.error("Error initializing IndexedDB.");
    };
  }
}
