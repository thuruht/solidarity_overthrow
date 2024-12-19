// File Part 1: revolutionary_simulator_prototype.js

// Include Leaflet.js (Add this in your HTML file):
// <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
// <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>

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

// Global Imperialist Power Index
let globalIpi = 100;

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

  // Adjust global IPI
  const localIpiReduction = ipi - solidarity;
  globalIpi = Math.max(globalIpi - localIpiReduction / 10, 0); // Reduce global IPI by 1/10th of local reduction

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
// File Part 2: revolutionary_simulator_prototype.js

// Fetch weather for all example locations
locations.forEach(loc => fetchAndDisplayWeather(loc.lat, loc.lon, loc.name));

// Add dropdown for selecting cities
const cityDropdown = L.control({ position: 'topleft' });
cityDropdown.onAdd = function () {
  const div = L.DomUtil.create('div', 'city-dropdown');
  div.innerHTML = '<select id="cityDropdown"><option value="" disabled selected>Select a city...</option></select>';
  return div;
};
cityDropdown.addTo(map);

// Populate the dropdown with global cities and custom city option
function populateDropdown() {
  const dropdown = document.getElementById("cityDropdown");

  // Populate with global cities
  globalCities.forEach(city => {
    const option = document.createElement("option");
    option.value = city.name;
    option.textContent = city.name;
    dropdown.appendChild(option);
  });

  // Add "Custom City" option
  const customOption = document.createElement("option");
  customOption.value = "custom";
  customOption.textContent = "Add Custom City...";
  dropdown.appendChild(customOption);
}

populateDropdown();

// Handle city selection from dropdown
const trackedLocations = []; // Stores tracked locations

document.getElementById("cityDropdown").addEventListener("change", async function () {
  if (this.value === "custom") {
    const cityName = prompt("Enter the name of the city:");
    if (cityName) {
      const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}&format=json&limit=1`;
      try {
        const response = await fetch(geocodeUrl);
        const data = await response.json();

        if (data.length > 0) {
          const { lat, lon, display_name } = data[0];
          const customCity = {
            name: display_name.split(",")[0],
            lat: parseFloat(lat),
            lon: parseFloat(lon),
            ipi: Math.floor(Math.random() * 16) + 85, // Random IPI: 85–100
            solidarity: Math.floor(Math.random() * 16), // Random Solidarity: 0–15
            propaganda: Math.floor(Math.random() * 21) + 80, // Random Propaganda: 80–100
          };

          addCustomCity(customCity);
        } else {
          alert("City not found. Please try again.");
        }
      } catch (error) {
        console.error("Error fetching city coordinates:", error);
        alert("Unable to find city coordinates. Please try again.");
      }
    }
  } else {
    const selectedCity = globalCities.find(city => city.name === this.value);
    if (selectedCity) {
      updateCityMetrics(selectedCity);
      map.setView([selectedCity.lat, selectedCity.lon], 6);
    }
  }
});

// Add a custom city dynamically
function addCustomCity(city) {
  // Add to dropdown
  const dropdown = document.getElementById("cityDropdown");
  const option = document.createElement("option");
  option.value = city.name;
  option.textContent = city.name;
  dropdown.appendChild(option);

  // Add to global cities list
  globalCities.push(city);

  // Add marker to the map
  const marker = L.marker([city.lat, city.lon]).addTo(map);
  marker.bindPopup(`<b>${city.name}</b><br><b>IPI:</b> ${city.ipi}%<br><b>Solidarity:</b> ${city.solidarity}%<br><b>Propaganda:</b> ${city.propaganda}%`);
  map.setView([city.lat, city.lon], 6);

  // Update the sidebar with the custom city’s metrics
  updateCityMetrics(city);
}

// Update the sidebar with city metrics
function updateCityMetrics(city) {
  const sidebarContent = `<h3>${city.name} Metrics</h3>
    <p><b>Imperialist Power Index:</b> ${city.ipi}%</p>
    <p><b>Solidarity:</b> ${city.solidarity}%</p>
    <p><b>Propaganda:</b> ${city.propaganda}%</p>`;
  document.querySelector(".city-metrics").innerHTML = sidebarContent;
}

// Function to update global metrics
function updateGlobalMetrics() {
  const totalIpi = globalCities.reduce((sum, city) => sum + city.ipi, 0);
  const globalIpi = (totalIpi / globalCities.length).toFixed(2);

  const totalPropaganda = globalCities.reduce((sum, city) => sum + city.propaganda, 0);
  const globalPropaganda = (totalPropaganda / globalCities.length).toFixed(2);

  const totalSolidarity = globalCities.reduce((sum, city) => sum + city.solidarity, 0);
  const globalSolidarity = (totalSolidarity / globalCities.length).toFixed(2);

  const sidebarContent = `<h3>Global Metrics</h3>
    <p><b>Global Imperialist Power Index:</b> ${globalIpi}%</p>
    <p><b>Propaganda Level:</b> ${globalPropaganda}%</p>
    <p><b>Solidarity Index:</b> ${globalSolidarity}%</p>`;
  document.querySelector(".global-metrics").innerHTML = sidebarContent;
}

// Initialize global metrics on page load
updateGlobalMetrics();

// Sidebar HTML updates are expected to include:
// <div id="sidebar">
//   <div class="global-metrics"></div>
//   <div class="city-metrics"></div>
// </div>
