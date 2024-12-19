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

// Fetch real-time weather data from OpenWeatherMap
const apiKey = '955034a79abe8e7bc9df0666a15f1b06';

// Function to fetch weather data and plot multiple markers
async function fetchAndDisplayWeather() {
  try {
    // Array of example coordinates for multiple locations
    const locations = [
      { lat: 40.7128, lon: -74.0060, name: 'New York City' },
      { lat: 51.5074, lon: -0.1278, name: 'London' },
      { lat: 35.6895, lon: 139.6917, name: 'Tokyo' }
    ];

    // Loop through locations to fetch and display weather data
    for (const loc of locations) {
      const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${loc.lat}&lon=${loc.lon}&appid=${apiKey}`);
      const data = await response.json();

      // Extract weather description
      const description = data.weather[0].description;

      // Add marker for each location
      L.marker([loc.lat, loc.lon])
        .addTo(map)
        .bindPopup(`<b>${loc.name}</b><br><b>Weather:</b> ${description}`)
        .openPopup();

      console.log(`Weather data for ${loc.name}:`, data);
    }
  } catch (error) {
    console.error('Error fetching weather data:', error);
  }
}

// Call the function to fetch and display weather data
fetchAndDisplayWeather();

// Sidebar for metrics
const sidebar = L.control({ position: 'topright' });
sidebar.onAdd = function () {
  const div = L.DomUtil.create('div', 'sidebar');
  div.innerHTML = `<h3>Global Metrics</h3>
    <p><b>Imperialist Power Index:</b> 85%</p>
    <p><b>Community Resilience:</b> 45%</p>
    <p><b>Tracked Locations:</b> 3</p>`;
  return div;
};
sidebar.addTo(map);

// Offline support setup (basic caching example)
if ('indexedDB' in window) {
  console.log('IndexedDB available for offline support.');
  // Add IndexedDB caching logic here for future extensions.
}
