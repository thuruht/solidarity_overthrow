// File: solid0p1.js

// Initialize the map
const map = L.map('map', {
  attributionControl: false // Disable default attribution control
}).setView([20, 0], 2); // Centered globally

// Use CartoDB's tile service for clean tiles
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '<small>&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors & <a href="https://carto.com/">CARTO</a></small>',
  subdomains: 'abcd',
  maxZoom: 19
}).addTo(map);

// Add custom attribution control
L.control.attribution({
  position: 'bottomright'
}).addTo(map).setPrefix('');

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
    
    return div;
  };

  legend.addTo(map);
}

// Add legend to the map
addLegend();

// Add reset view button
function addResetViewButton() {
  // Position it top-left, below the city dropdown
  const resetButton = L.control({ position: 'topleft' });
  
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
      map.setView([20, 0], 2); // Reset to default view
      
      // Add a small animation
      if (typeof gsap !== 'undefined') {
        gsap.fromTo(button, { scale: 0.9 }, { scale: 1, duration: 0.3 });
      }
    });
    
    // Prevent map click events when button is clicked
    L.DomEvent.disableClickPropagation(button);
    
    return button;
  };
  
  resetButton.addTo(map);
}

// Add reset view button to the map
addResetViewButton();

// Offline storage setup using IndexedDB (if needed)
let db;
if ('indexedDB' in window) {
  const request = indexedDB.open('SolidarityOverthrowDB', 1);
  request.onupgradeneeded = event => {
    db = event.target.result;
    db.createObjectStore('weatherData', { keyPath: 'id' });
    db.createObjectStore('locationData', { keyPath: 'name' });
  };
  request.onsuccess = event => {
    db = event.target.result;
    console.log('IndexedDB initialized.');
  };
  request.onerror = () => {
    console.error('Error initializing IndexedDB.');
  };
}

// Global Imperialist Power Index placeholder
let globalIpi = 100;

// Function to cache data (if needed)
const cacheData = (storeName, data) => {
  if (db) {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.put(data);
    tx.oncomplete = () => console.log(`Cached data for ${data.name || data.id}`);
  }
};

// Fetch weather and display markers
async function fetchWeather(lat, lon, name) {
  // Instead of creating a separate marker, use fetchAndIntegrateWeather
  const city = globalCities.find(c => c.name === name);
  if (city) {
    const marker = L.marker([lat, lon]).addTo(map);
    marker._icon.id = `marker-${name.replace(/[^a-zA-Z0-9]/g, '-')}`;
    
    // Use the globally available fetchAndIntegrateWeather function
    if (typeof window.fetchAndIntegrateWeather === 'function') {
      window.fetchAndIntegrateWeather(city, marker);
    } else {
      // Fallback if not available yet
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=955034a79abe8e7bc9df0666a15f1b06`;
      try {
        const response = await fetch(url);
        const data = await response.json();
        const weatherDescription = data.weather && data.weather[0] ? data.weather[0].description : 'Unknown';
        
        marker.bindTooltip(
          `<b>${name}</b><br>Weather: ${weatherDescription}`,
          { direction: 'auto', opacity: 0.9 }
        );
      } catch (error) {
        console.error(`Error fetching weather data for ${name}:`, error);
      }
    }

    // On click, set the dropdown and zoom in closer
    marker.on('click', () => {
      const dropdown = document.getElementById('cityDropdown');
      if (dropdown) {
        dropdown.value = city.name;
      }
      // Increase the zoom level for a closer view
      map.setView([city.lat, city.lon], 10);
      updateCityMetrics(city);
      updateGlobalMetrics();
    });
  }
}
