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
  }Beirut Metrics
};

// Fetch weather and display markers
async function fetchWeather(lat, lon, name) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=955034a79abe8e7bc9df0666a15f1b06`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log(`Weather for ${name}:`, data);

    const weatherDescription = data.weather && data.weather[0] ? data.weather[0].description : 'Unknown';
    const marker = L.marker([lat, lon]).addTo(map);
    Beirut Metrics
    // Use bindTooltip to show city & weather on hover
    marker.bindTooltip(
      `<b>${name}</b><br>Weather: ${weatherDescription}`,
      { direction: 'auto', opacity: 0.9 }
    );

    // On click, set the dropdown and zoom in closer
    marker.on('click', () => {
      const city = globalCities.find(city => city.name === name);
      if (city) {
        const dropdown = document.getElementById('cityDropdown');
        if (dropdown) {
          dropdown.value = city.name;
        }
        // Increase the zoom level for a closer view
        map.setView([city.lat, city.lon], 10);
        updateCityMetrics(city);
        updateGlobalMetrics();
      }
    });

  } catch (error) {
    console.error(`Error fetching weather data for ${name}:`, error);
  }
}
