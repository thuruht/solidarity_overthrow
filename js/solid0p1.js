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

  // Add a legend to explain marker colors
  addLegend();

  // Add reset view button
  addResetViewButton();

  // Initialize offline storage
  setupOfflineStorage();
};

// Add a legend to explain marker colors
function addLegend() {
  const legend = L.control({ position: 'bottomleft' });

  legend.onAdd = function(map) {
    const div = L.DomUtil.create('div', 'info legend');
    div.innerHTML = `
      <h4>Solidarity Level</h4>
      <div><span style="background-color: green; width: 12px; height: 12px; display: inline-block; border-radius: 50%; margin-right: 5px;"></span> High (80-100%)</div>
      <div><span style="background-color: gold; width: 12px; height: 12px; display: inline-block; border-radius: 50%; margin-right: 5px;"></span> Medium (50-79%)</div>
      <div><span style="background-color: orange; width: 12px; height: 12px; display: inline-block; border-radius: 50%; margin-right: 5px;"></span> Low (20-49%)</div>
      <div><span style="background-color: red; width: 12px; height: 12px; display: inline-block; border-radius: 50%; margin-right: 5px;"></span> Critical (0-19%)</div>
    `;
    
    // Add custom styling
    div.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    div.style.padding = '10px';
    div.style.borderRadius = '5px';
    div.style.color = 'white';
    div.style.fontFamily = "'Special Elite', monospace";
    div.style.fontSize = '0.8em';
    div.style.maxWidth = '200px';
    div.style.zIndex = '1002';
    
    return div;
  };

  legend.addTo(window.map);
}

// Add reset view button
function addResetViewButton() {
  const resetButton = L.control({ position: 'bottomleft' });
  
  resetButton.onAdd = function(map) {
    const button = L.DomUtil.create('button', 'reset-view-button');
    button.innerHTML = '<span class="material-icons">public</span> Reset View';
    button.title = 'Reset map to default view';
    
    // Style the button
    button.style.backgroundColor = '#444';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.padding = '8px 12px';
    button.style.borderRadius = '4px';
    button.style.cursor = 'pointer';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.fontFamily = "'Special Elite', monospace";
    button.style.fontSize = '14px';
    button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
    button.style.marginTop = '10px'; // Add some top margin
    button.style.zIndex = '1002';
    
    // Add hover effect
    button.onmouseover = function() {
      this.style.backgroundColor = '#666';
    };
    button.onmouseout = function() {
      this.style.backgroundColor = '#444';
    };
    
    // Add click event
    L.DomEvent.on(button, 'click', function(e) {
      L.DomEvent.stopPropagation(e);
      window.map.setView([20, 0], 2); // Reset to default view
      
      if (typeof gsap !== 'undefined') {
        gsap.fromTo(button, { scale: 0.9 }, { scale: 1, duration: 0.3 });
      }
    });
    
    L.DomEvent.disableClickPropagation(button);
    
    return button;
  };
  
  resetButton.addTo(window.map);
}

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