// File: solid0p3.js
// This file should be loaded AFTER solid0p1.js and solid0p2.js

// Constants
const ONE_DAY = 24 * 60 * 60 * 1000;
const BATCH_SIZE = 10;
const BATCH_DELAY = 60 * 1000; // 1 minute between batches

// Retrieve a city record from IndexedDB
async function getCityFromIndexedDB(name) {
  return new Promise((resolve, reject) => {
    if (!db) return resolve(null);
    const tx = db.transaction('locationData', 'readonly');
    const store = tx.objectStore('locationData');
    const request = store.get(name);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

// Save or update a city record in IndexedDB
async function saveCityToIndexedDB(cityData) {
  return new Promise((resolve, reject) => {
    if (!db) return resolve(); // If no DB, do nothing
    const tx = db.transaction('locationData', 'readwrite');
    const store = tx.objectStore('locationData');
    const request = store.put(cityData);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Check cached data before fetching fresh weather
async function getCityWeather(city) {
  const cityData = await getCityFromIndexedDB(city.name);
  const now = Date.now();

  if (cityData && cityData.weather && (now - cityData.weather.lastFetched) < ONE_DAY) {
    // Cached data is fresh
    return cityData.weather;
  }

  // Need fresh data
  const freshWeather = await fetchWeatherAndUpdateCache(city);
  return freshWeather;
}

// Fetch weather from the API and update cache, without placing markers directly
async function fetchWeatherDataOnly(lat, lon, name) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=955034a79abe8e7bc9df0666a15f1b06`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Network response was not ok');
  const data = await response.json();
  const description = (data.weather && data.weather[0]) ? data.weather[0].description : 'Unknown';
  const temp = data.main ? data.main.temp : null;
  return { description, temp };
}

// Fetch fresh data and update cache, then place marker by calling existing fetchWeather()
async function fetchWeatherAndUpdateCache(city) {
  // First get raw data
  const weatherData = await fetchWeatherDataOnly(city.lat, city.lon, city.name);

  // Update cache
  const cityData = await getCityFromIndexedDB(city.name) || city;
  cityData.weather = { ...weatherData, lastFetched: Date.now() };
  await saveCityToIndexedDB(cityData);

  // Now place the marker & tooltip via existing fetchWeather() function
  // fetchWeather() places a marker and sets tooltip, but doesn't return data.
  // We have data already, so just call fetchWeather() to place the marker and set events.
  await fetchWeather(city.lat, city.lon, city.name);

  return cityData.weather;
}

// Handle user selection of a city on-demand
async function handleCitySelection(cityName) {
  const city = globalCities.find(c => c.name === cityName);
  if (!city) return alert('City not found!');

  // Get weather data (cached or fresh)
  const weather = await getCityWeather(city);

  // Now that weather is ensured fetched and marker placed by fetchWeatherAndUpdateCache() if needed:
  // Update metrics and map view
  map.setView([city.lat, city.lon], 10);
  updateCityMetrics(city);
  updateGlobalMetrics();
}

// Batch update all cities, spread out over time to avoid rate limits
async function updateAllCitiesInBatches() {
  for (let i = 0; i < globalCities.length; i += BATCH_SIZE) {
    const batch = globalCities.slice(i, i + BATCH_SIZE);
    for (const city of batch) {
      await getCityWeather(city); 
      // This fetches fresh data if needed, places markers if not done yet.
    }
    if (i + BATCH_SIZE < globalCities.length) {
      await new Promise(r => setTimeout(r, BATCH_DELAY));
    }
  }
}

// OPTIONAL: Call updateAllCitiesInBatches() at load or when desired.
// You might remove the bulk fetch from solid0p2.js and rely on this:
updateAllCitiesInBatches();

// Example: If a marker is clicked and the city data isn't ready, call handleCitySelection():
// In solid0p1.js or solid0p2.js marker on click:
// marker.on('click', () => { handleCitySelection(city.name); });

// Example: If city is selected from dropdown in solid0p2.js, replace direct fetch calls with:
// handleCitySelection(selectedValue);

console.log('Caching and batch logic (solid0p3.js) loaded.');

// State retaliation mechanisms based on collective actions
function triggerStateRetaliation(actionType) {
  const retaliationChance = Math.random(); // 30% chance for retaliation

  if (retaliationChance < 0.3) {
    switch (actionType) {
      case 'sabotage':
        applyRetaliation('crackdown', 'The state responds with a crackdown!');
        break;
      case 'protest':
        applyRetaliation('propaganda', 'The state intensifies propaganda campaigns.');
        break;
      case 'strike':
        applyRetaliation('arrests', 'Mass arrests disrupt the strike efforts.');
        break;
      case 'network':
        applyRetaliation('surveillance', 'The state increases surveillance on revolutionary networks.');
        break;
    }
  }
}

function applyRetaliation(type, message) {
  const feedback = document.getElementById('retaliation-feedback');
  feedback.textContent = message;
  feedback.style.display = 'block';

  // Hide alert after 3 seconds
  setTimeout(() => feedback.style.display = 'none', 3000);

  // Apply retaliation effects
  switch (type) {
    case 'crackdown':
      globalMetrics.ipi += 5;
      globalMetrics.solidarity -= 3;
      break;
    case 'propaganda':
      globalMetrics.propaganda += 10;
      break;
    case 'arrests':
      globalMetrics.solidarity -= 5;
      break;
    case 'surveillance':
      globalMetrics.ipi += 3;
      globalMetrics.solidarity -= 2;
      break;
    case 'economic_sanctions':
      globalMetrics.solidarity -= 10;
      globalMetrics.propaganda += 5;
      break;
    case 'military_intervention':
      globalMetrics.ipi += 15;
      globalMetrics.solidarity -= 15;
      break;
  }

  updateGlobalMetrics();
}

function updateGlobalMetrics() {
  const globalMetrics = document.querySelector('#top-bar .global-metrics');
  globalMetrics.innerHTML = `
    <span><b><span class="material-icons">military_tech</span> Imperialist Power Index:</b> ${globalMetricsData.ipi.toFixed(2)}%</span>
    <span><b><span class="material-icons">campaign</span> Propaganda Level:</b> ${globalMetricsData.propaganda.toFixed(2)}%</span>
    <span><b><span class="material-icons">groups</span> Solidarity Index:</b> ${globalMetricsData.solidarity.toFixed(2)}%</span>
  `;
}
