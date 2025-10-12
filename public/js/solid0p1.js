// File: solid0p1.js

// Make map globally available
window.map = null;

// Function to set up the map and its basic controls
window.setupMap = function() {
  // Initialize the map
  window.map = L.map('map', {
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
};



// Offline storage setup using IndexedDB
function setupOfflineStorage() {
  if ('indexedDB' in window) {
    const request = indexedDB.open('SolidarityOverthrowDB', 1);
    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('weatherData')) {
        db.createObjectStore('weatherData', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('locationData')) {
        db.createObjectStore('locationData', { keyPath: 'name' });
      }
    };
    request.onsuccess = event => {
      console.log('IndexedDB initialized.');
    };
    request.onerror = () => {
      console.error('Error initializing IndexedDB.');
    };
  }
}