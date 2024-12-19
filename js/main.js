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
const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=0&lon=0&appid=${apiKey}`;

// Function to fetch weather data and plot it on the map
async function fetchAndDisplayWeather() {
  try {
    // Fetch weather data
    const response = await fetch(weatherUrl);
    const data = await response.json();

    // Example data extraction (mocking one location for now)
    const lat = data.coord.lat;
    const lon = data.coord.lon;
    const description = data.weather[0].description;

    // Add marker to the map
    L.marker([lat, lon])
      .addTo(map)
      .bindPopup(`<b>Weather Event:</b> ${description}`)
      .openPopup();

    console.log('Weather data plotted:', data);
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
    <p><b>Community Resilience:</b> 45%</p>`;
  return div;
};
sidebar.addTo(map);

// Offline support setup (basic caching example)
if ('indexedDB' in window) {
  console.log('IndexedDB available for offline support.');
  // Add IndexedDB caching logic here for future extensions.
}
