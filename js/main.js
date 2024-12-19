// File: revolutionary_simulator_prototype.js

// Include Leaflet.js (Add this in your HTML file):
// <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
// <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>

// Initialize the map
const map = L.map('map', {
  attributionControl: false // Disable default attribution control
}).setView([20, 0], 2); // Centered globally

// Use CartoDB's tile service for clean tiles
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors & <a href="https://carto.com/">CARTO</a>',
  subdomains: 'abcd',
  maxZoom: 19
}).addTo(map);

// Add custom attribution control
L.control.attribution({
  position: 'bottomright'
}).addTo(map).setPrefix(''); // Remove Leaflet attribution

// OpenWeatherMap API key
const apiKey = '955034a79abe8e7bc9df0666a15f1b06';

// Offline storage setup using IndexedDB
let db;
if ('indexedDB' in window) {
  const request = indexedDB.open('SolidarityOverthrowDB', 1);
  request.onupgradeneeded = event => {
    db = event.target.result;
    db.createObjectStore('weatherData', { keyPath: 'id' });
    db.createObjectStore('locationData', { keyPath: 'name' }); // Added to track locations
  };
  request.onsuccess = event => {
    db = event.target.result;
    console.log('IndexedDB initialized.');
  };
  request.onerror = () => {
    console.error('Error initializing IndexedDB.');
  };
}

// Function to cache data
const cacheData = (storeName, data) => {
  if (db) {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.put(data);
    tx.oncomplete = () => console.log(`Cached data for ${data.name || data.id}`);
  }
};

// Function to fetch and display weather data dynamically
async function fetchAndDisplayWeather(lat, lon, name) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`;
  try {
    const response = await fetch(url);
    const data = await response.json();

    // Extract weather description
    const description = data.weather[0].description;

    // Add marker to the map
    const marker = L.marker([lat, lon]).addTo(map);
    marker.bindPopup(`<b>${name}</b><br><b>Weather:</b> ${description}<br><button id="track-${name}">Track Location</button>`);

    // Add event listener for the button
    marker.on('popupopen', () => {
      document.getElementById(`track-${name}`).addEventListener('click', () => trackLocation(name, lat, lon));
    });

    console.log(`Weather data for ${name}:`, data);

    // Cache the data
    cacheData('weatherData', { id: name, data });
  } catch (error) {
    console.error(`Error fetching weather data for ${name}:`, error);
  }
}

// Function to track a location and associate metrics
function trackLocation(name, lat, lon) {
  // Prevent duplicates
  if (trackedLocations.some(loc => loc.name === name)) {
    alert(`${name} is already being tracked.`);
    return;
  }

  const ipi = Math.floor(Math.random() * 21) + 80; // Imperialist Power Index starts high (80–100)
  const solidarity = Math.floor(Math.random() * 21); // Solidarity Index starts low (0–20)
  const propaganda = Math.floor(Math.random() * 21) + 80; // Propaganda Level starts high (80–100)
  const locationData = { name, lat, lon, ipi, solidarity, propaganda };
  cacheData('locationData', locationData);

  // Update tracked locations in sidebar
  trackedLocations.push(locationData);
  updateSidebar();
  console.log(`Tracking location: ${name}, IPI: ${ipi}, Solidarity: ${solidarity}, Propaganda: ${propaganda}`);
}

// Example locations array
const locations = [
  { lat: 40.7128, lon: -74.0060, name: 'New York City' },
  { lat: 51.5074, lon: -0.1278, name: 'London' },
  { lat: 35.6895, lon: 139.6917, name: 'Tokyo' },
  { lat: -34.6037, lon: -58.3816, name: 'Buenos Aires' },
  { lat: -1.2921, lon: 36.8219, name: 'Nairobi' },
  { lat: -22.9068, lon: -43.1729, name: 'Rio de Janeiro' },
  { lat: 28.6139, lon: 77.2090, name: 'New Delhi' },
  { lat: 6.5244, lon: 3.3792, name: 'Lagos' },
  { lat: -33.9249, lon: 18.4241, name: 'Cape Town' }
];

const trackedLocations = []; // Stores tracked locations

// Fetch weather for all example locations
locations.forEach(loc => fetchAndDisplayWeather(loc.lat, loc.lon, loc.name));

// Add user input for dynamic location search
const searchInput = L.control({ position: 'topleft' });
searchInput.onAdd = function () {
  const div = L.DomUtil.create('div', 'search-bar');
  div.innerHTML = '<input type="text" id="locationSearch" placeholder="Search Location...">';
  return div;
};
searchInput.addTo(map);

document.getElementById('locationSearch').addEventListener('keydown', async event => {
  if (event.key === 'Enter') {
    const query = event.target.value;
    const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;
    try {
      const response = await fetch(geocodeUrl);
      const data = await response.json();
      if (data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const cityAndCountry = display_name.split(',').slice(0, 2).join(',').trim();
        fetchAndDisplayWeather(lat, lon, cityAndCountry);
        map.setView([lat, lon], 6);
      } else {
        alert('Location not found. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching geocode data:', error);
    }
  }
});

// Function to update the sidebar
function updateSidebar() {
  const totalIpi = trackedLocations.reduce((sum, loc) => sum + loc.ipi, 0);
  const averageIpi = trackedLocations.length > 0 ? (totalIpi / trackedLocations.length).toFixed(2) : 0;

  const sidebarContent = `<h3>Global Metrics</h3>
    <p><b>Imperialist Power Index:</b> ${averageIpi}%</p>
    <h4>Tracked Locations</h4>
    <ul>
      ${trackedLocations.map(loc => `<li>${loc.name}: IPI ${loc.ipi}%, Solidarity: ${loc.solidarity}%, Propaganda: ${loc.propaganda}%</li>`).join('')}
    </ul>`;
  document.querySelector('.sidebar').innerHTML = sidebarContent;
}

// Sidebar for metrics
const sidebar = L.control({ position: 'topright' });
sidebar.onAdd = function () {
  const div = L.DomUtil.create('div', 'sidebar');
  div.innerHTML = `<h3>Global Metrics</h3>
    <p><b>Imperialist Power Index:</b> 0%</p>
    <h4>Tracked Locations</h4>
    <ul></ul>`;
  return div;
};
sidebar.addTo(map);
