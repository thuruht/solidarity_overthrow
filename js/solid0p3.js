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

// Initialize global metrics data object
const globalMetricsData = {
  ipi: 100,
  propaganda: 100,
  solidarity: 0
};

// Example: If a marker is clicked and the city data isn't ready, call handleCitySelection():
// In solid0p1.js or solid0p2.js marker on click:
// marker.on('click', () => { handleCitySelection(city.name); });

// Example: If city is selected from dropdown in solid0p2.js, replace direct fetch calls with:
// handleCitySelection(selectedValue);

console.log('Caching and batch logic (solid0p3.js) loaded.');

// State retaliation mechanisms based on collective actions
function triggerStateRetaliation(actionType) {
  // Higher chance of retaliation when imperialist power is threatened
  const retaliationChance = Math.random() + (0.5 - globalMetricsData.ipi/200); // 0-100% chance
  const threshold = 0.3;  // 30% base chance

  if (retaliationChance < threshold) {
    switch (actionType) {
      case 'sabotage':
        applyRetaliation('crackdown', 'The state responds with a violent crackdown!');
        break;
      case 'protest':
        if (Math.random() < 0.5) {
          applyRetaliation('propaganda', 'The state intensifies propaganda campaigns.');
        } else {
          applyRetaliation('arrests', 'Protest leaders are being arrested!');
        }
        break;
      case 'strike':
        if (Math.random() < 0.7) {
          applyRetaliation('arrests', 'Mass arrests disrupt the strike efforts.');
        } else {
          applyRetaliation('economic_sanctions', 'Economic penalties imposed on striking regions.');
        }
        break;
      case 'network':
        applyRetaliation('surveillance', 'The state increases surveillance on revolutionary networks.');
        break;
    }
  } else if (globalMetricsData.ipi < 50 && Math.random() < 0.2) {
    // Desperate measures when imperial power is really threatened
    applyRetaliation('military_intervention', 'Military forces deployed to maintain control!');
  }
}

function applyRetaliation(type, message) {
  const feedback = document.getElementById('retaliation-feedback');
  feedback.textContent = message;
  feedback.style.backgroundColor = 'rgba(139, 0, 0, 0.8)';
  feedback.style.display = 'block';

  // Hide alert after 3 seconds
  setTimeout(() => feedback.style.display = 'none', 3000);

  // Target random cities for retaliation
  const targetCityCount = Math.floor(Math.random() * 5) + 3; // 3-7 cities
  const highSolidarityCities = [...globalCities].filter(city => city.solidarity > 30)
                                              .sort(() => Math.random() - 0.5)
                                              .slice(0, targetCityCount);
  
  // Apply localized effects to targeted cities
  highSolidarityCities.forEach(city => {
    switch (type) {
      case 'crackdown':
        city.ipi += 2;
        city.solidarity -= 5;
        break;
      case 'propaganda':
        city.propaganda += 5;
        city.solidarity -= 1;
        break;
      case 'arrests':
        city.solidarity -= 3;
        break;
      case 'surveillance':
        city.solidarity -= 2;
        break;
      case 'economic_sanctions':
        city.solidarity -= 4;
        city.propaganda += 2;
        break;
      case 'military_intervention':
        city.ipi += 10;
        city.solidarity -= 8;
        break;
    }
    
    // Animate the marker for affected cities
    const cityMarker = document.querySelector(`#marker-${city.name.replace(/[^a-zA-Z0-9]/g, '-')}`);
    if (cityMarker && typeof gsap !== 'undefined') {
      gsap.to(cityMarker, { 
        opacity: 0.2, 
        duration: 0.3,
        repeat: 3,
        yoyo: true,
        ease: "power2.inOut"
      });
    }
  });

  // Apply global effects
  // Apply global effects
  switch (type) {
    case 'crackdown':
      globalMetricsData.ipi = Math.min(100, globalMetricsData.ipi + 5);
      globalMetricsData.solidarity = Math.max(0, globalMetricsData.solidarity - 3);
      break;
    case 'propaganda':
      globalMetricsData.propaganda = Math.min(100, globalMetricsData.propaganda + 10);
      break;
    case 'arrests':
      globalMetricsData.solidarity = Math.max(0, globalMetricsData.solidarity - 5);
      break;
    case 'surveillance':
      globalMetricsData.ipi = Math.min(100, globalMetricsData.ipi + 3);
      globalMetricsData.solidarity = Math.max(0, globalMetricsData.solidarity - 2);
      break;
    case 'economic_sanctions':
      globalMetricsData.solidarity = Math.max(0, globalMetricsData.solidarity - 10);
      globalMetricsData.propaganda = Math.min(100, globalMetricsData.propaganda + 5);
      break;
    case 'military_intervention':
      globalMetricsData.ipi = Math.min(100, globalMetricsData.ipi + 15);
      globalMetricsData.solidarity = Math.max(0, globalMetricsData.solidarity - 15);
      break;
  }

  updateGlobalMetrics();
}

function updateGlobalMetrics() {
  const totalIpi = globalCities.reduce((sum, city) => sum + city.ipi, 0);
  const globalIpiValue = (totalIpi / globalCities.length).toFixed(2);

  const totalPropaganda = globalCities.reduce((sum, city) => sum + city.propaganda, 0);
  const globalPropagandaValue = (totalPropaganda / globalCities.length).toFixed(2);

  const totalSolidarity = globalCities.reduce((sum, city) => sum + city.solidarity, 0);
  const globalSolidarityValue = (totalSolidarity / globalCities.length).toFixed(2);

  const globalMetrics = document.querySelector('#top-bar .global-metrics');
  globalMetrics.innerHTML = `
    <span><b><span class="material-icons">military_tech</span> Imperialist Power Index:</b> ${globalIpiValue}%</span>
    <span><b><span class="material-icons">campaign</span> Propaganda Level:</b> ${globalPropagandaValue}%</span>
    <span><b><span class="material-icons">groups</span> Solidarity Index:</b> ${globalSolidarityValue}%</span>
  `;
}
