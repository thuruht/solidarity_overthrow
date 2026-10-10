import { map } from "./main_new.js";
// File: solid0p1.js
//
// BUGFIX: both functions below were declared but never exported, and this
// file was never imported anywhere else in the codebase - the "Reset View"
// map button and the offline weather/location cache were fully dead code.
// Both are now exported and wired up from main_new.js's initializeGame().

// Add reset view button
export function addResetViewButton() {
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

// Offline storage setup using IndexedDB.
// NOTE: this only *initializes* the database. Nothing currently reads from
// or writes to it (fetchAndIntegrateWeather() in cityInteractions.js still
// always hits the network) - actually caching weather/location data through
// this store is a follow-up enhancement, not part of this fix.
export function setupOfflineStorage() {
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
