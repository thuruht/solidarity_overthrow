// File: solid0p2.js

// This function will be called by main_new.js to set up everything related to city interactions
window.setupCityInteractions = function() {
  populateDropdown();
  initializeCityMarkers();
  setupDropdownListener();
  setupSearchListener();
};

// Populate the dropdown with global cities and custom city option
function populateDropdown(filter = '') {
  const citySelector = document.getElementById('cityDropdown');
  if (!citySelector) return;
  
  const lowerCaseFilter = filter.toLowerCase();

  // Clear existing options except the default
  let currentCity = citySelector.value;
  while (citySelector.options.length > 1) {
    citySelector.remove(1);
  }
  
  // Add cities to dropdown that match the filter
  globalCities.forEach(city => {
    if (city.name.toLowerCase().includes(lowerCaseFilter)) {
        const option = document.createElement('option');
        option.value = city.name;
        option.textContent = city.name;
        citySelector.appendChild(option);
    }
  });
  
  // Add option for custom city
  const customOption = document.createElement('option');
  customOption.value = "custom";
  customOption.textContent = "Add Custom City...";
  citySelector.appendChild(customOption);

  // Restore previous selection if it still exists and matches filter
  if (currentCity && globalCities.some(c => c.name === currentCity && c.name.toLowerCase().includes(lowerCaseFilter))) {
    citySelector.value = currentCity;
  }
}
window.populateDropdown = populateDropdown; // Make it globally accessible

// Initialize city markers on the map
function initializeCityMarkers() {
  // Place markers for all cities with a delay
  globalCities.forEach((city, index) => {
    setTimeout(() => {
      placeStaticMarker(city);
    }, index * 50); // 50ms delay between each city
  });
}

// Set up the listener for the city search input
function setupSearchListener() {
  const searchInput = document.getElementById('citySearch');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    populateDropdown(e.target.value);
  });
}

// Place a static marker for a city
function placeStaticMarker(city) {
  if (!window.map) return;
  const marker = L.marker([city.lat, city.lon]).addTo(window.map);
  
  marker._icon.id = `marker-${city.name.replace(/[^a-zA-Z0-9]/g, '-')}`;
  
  fetchAndIntegrateWeather(city, marker);
  
  marker.bindPopup(createCityPopup(city));
  
  marker.on('click', () => {
    document.getElementById('cityDropdown').value = city.name;
    window.map.setView([city.lat, city.lon], 6);
    updateCityMetrics(city);
  });
  
  colorizeMarker(marker, city);
}

// Fetch weather data and integrate it with the city marker
async function fetchAndIntegrateWeather(city, marker) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${city.lat}&lon=${city.lon}&units=metric&appid=955034a79abe8e7bc9df0666a15f1b06`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    city.weather = {
      description: data.weather?.[0]?.description || 'Unknown',
      temp: data.main?.temp,
      humidity: data.main?.humidity,
      wind: data.wind?.speed,
      icon: data.weather?.[0]?.icon
    };
    
    marker.bindTooltip(
      `<b>${city.name}</b><br>
       <span>Solidarity: ${city.solidarity}%</span>`,
      { direction: 'auto', opacity: 0.9 }
    );
    
    const popup = marker.getPopup();
    if (popup) {
      popup.setContent(createCityPopup(city));
    }
    
  } catch (error) {
    console.error(`Error fetching weather data for ${city.name}:`, error);
  }
}
window.fetchAndIntegrateWeather = fetchAndIntegrateWeather; // Make it globally accessible

// Helper to get a description of the weather's effect
function getWeatherEffectDescription(weatherDesc) {
    if (!weatherDesc) return '';
    const desc = weatherDesc.toLowerCase();
    if (desc.includes('rain') || desc.includes('storm') || desc.includes('drizzle')) {
        return 'Public actions may be less effective.';
    } else if (desc.includes('snow')) {
        return 'Public actions may be significantly less effective.';
    } else if (desc.includes('clear')) {
        return 'Public actions may be more effective.';
    }
    return '';
}

// Create popup content for a city
function createCityPopup(city) {
  const popupContent = document.createElement('div');
  popupContent.className = 'city-popup';
  
  let weatherEffectHint = '';
  if (city.weather && city.weather.description) {
      const effect = getWeatherEffectDescription(city.weather.description);
      if (effect) {
          weatherEffectHint = `<p class="weather-effect"><em>${effect}</em></p>`;
      }
  }

  popupContent.innerHTML = `
    <h3>${city.name}</h3>
    <div class="popup-metrics">
      <p><b>IPI:</b> ${city.ipi}%</p>
      <p><b>Solidarity:</b> ${city.solidarity}%</p>
      <p><b>Propaganda:</b> ${city.propaganda}%</p>
      ${weatherEffectHint}
    </div>
    <div class="popup-actions">
      <p><b>Actions:</b></p>
      <button class="action-btn" data-action="protest" data-city="${city.name}">Protest</button>
      <button class="action-btn" data-action="strike" data-city="${city.name}">Strike</button>
      <button class="action-btn" data-action="network" data-city="${city.name}">Network</button>
      <button class="action-btn" data-action="sabotage" data-city="${city.name}">Sabotage</button>
      <button class="action-btn" data-action="mutualAid" data-city="${city.name}">Mutual Aid</button>
      <button class="action-btn" data-action="hackMedia" data-city="${city.name}">Hack Media</button>
    </div>
  `;
  
  // Use a timeout to ensure the popup is in the DOM
  setTimeout(() => {
    popupContent.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        performCityAction(e.target.dataset.action, e.target.dataset.city);
      });
    });
  }, 100);
  
  return popupContent;
}

// Perform action on a specific city
function performCityAction(action, cityName) {
  const city = globalCities.find(c => c.name === cityName);
  if (!city) return;
  
  let ipiChange = 0, propagandaChange = 0, solidarityChange = 0, message = '';
  
  // Define weather modifiers
  let weatherModifier = 1.0;
  let weatherMessage = '';
  if (city.weather && city.weather.description) {
      const weatherDesc = city.weather.description.toLowerCase();
      if (weatherDesc.includes('rain') || weatherDesc.includes('storm') || weatherDesc.includes('drizzle')) {
          weatherModifier = 0.8; // 20% less effective
          weatherMessage = ' (Rain dampened turnout)';
      } else if (weatherDesc.includes('snow')) {
          weatherModifier = 0.7; // 30% less effective
          weatherMessage = ' (Snow suppressed activity)';
      } else if (weatherDesc.includes('clear')) {
          weatherModifier = 1.2; // 20% more effective
          weatherMessage = ' (Clear skies encouraged participation)';
      }
  }

  switch (action) {
    case 'protest':
      ipiChange = -3 * weatherModifier;
      propagandaChange = -2 * weatherModifier;
      solidarityChange = 2 * weatherModifier;
      message = `Protest in ${cityName}!`;
      break;
    case 'strike':
      ipiChange = -5 * weatherModifier;
      solidarityChange = 3 * weatherModifier;
      message = `Strike in ${cityName}!`;
      break;
    case 'network':
      solidarityChange = 7;
      propagandaChange = -1;
      message = `Network strengthened in ${cityName}!`;
      break;
    case 'sabotage':
      ipiChange = -10;
      propagandaChange = 4;
      solidarityChange = -3;
      message = `Sabotage in ${cityName}!`;
      break;
    case 'mutualAid':
      solidarityChange = 5;
      message = `Mutual aid network established in ${cityName}!`;
      break;
    case 'hackMedia':
      propagandaChange = -10;
      solidarityChange = 1;
      ipiChange = -1;
      message = `State media hacked in ${cityName}!`;
      break;
  }
  
  city.ipi = Math.max(0, Math.min(100, city.ipi + ipiChange));
  city.propaganda = Math.max(0, Math.min(100, city.propaganda + propagandaChange));
  city.solidarity = Math.max(0, Math.min(100, city.solidarity + solidarityChange));
  
  // Update marker and sidebar
  updateCityVisuals(city);
  window.updateGlobalMetrics();
  
  // Show feedback using the new notification system
  showToast('Action Report', message + weatherMessage, 'info');
}

// Update marker color and popup content
function updateCityVisuals(city) {
    const markerElement = document.getElementById(`marker-${city.name.replace(/[^a-zA-Z0-9]/g, '-')}`);
    if (markerElement) {
        const leafletMarker = window.map._layers[Object.keys(window.map._layers).find(key =>
            window.map._layers[key]._icon && window.map._layers[key]._icon.id === markerElement.id
        )];
        if (leafletMarker) {
            colorizeMarker(leafletMarker, city);
            leafletMarker.getPopup().setContent(createCityPopup(city));
        }
    }

    const dropdown = document.getElementById('cityDropdown');
    if (dropdown && dropdown.value === city.name) {
        updateCityMetrics(city);
    }
}
window.updateCityVisuals = updateCityVisuals;

// Colorize marker based on solidarity level
function colorizeMarker(marker, city) {
  let iconColor = 'red';
  if (city.solidarity >= 80) {
    iconColor = 'green';
  } else if (city.solidarity >= 50) {
    iconColor = 'gold';
  } else if (city.solidarity >= 20) {
    iconColor = 'orange';
  }
  
  marker.setIcon(L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${iconColor}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  }));
}

// Set up the listener for the city dropdown
function setupDropdownListener() {
  document.getElementById('cityDropdown').addEventListener('change', async function () {
    if (this.value === 'custom') {
      const cityName = prompt('Enter city name:');
      if (cityName) await addCustomCity(cityName);
    } else {
      handleCitySelection(this.value);
    }
  });
}

// Handle city selection from dropdown
function handleCitySelection(cityName) {
  const city = globalCities.find(c => c.name === cityName);
  if (city) {
    window.map.setView([city.lat, city.lon], 6);
    updateCityMetrics(city);
  }
}

// Add a custom city dynamically
async function addCustomCity(cityName) {
  if (globalCities.some(c => c.name.toLowerCase() === cityName.toLowerCase())) {
    alert(`${cityName} is already on the map.`);
    return;
  }
  
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}&format=json&limit=1`);
    const data = await response.json();
    if (data.length > 0) {
      const { lat, lon, display_name } = data[0];
      const newCity = {
        name: display_name.split(',')[0],
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        ipi: 85 + Math.floor(Math.random() * 10),
        solidarity: Math.floor(Math.random() * 15),
        propaganda: 80 + Math.floor(Math.random() * 20),
      };
      globalCities.push(newCity);
      populateDropdown();
      placeStaticMarker(newCity);
      handleCitySelection(newCity.name);
    } else {
      alert('City not found.');
    }
  } catch (error) {
    console.error('Error adding custom city:', error);
  }
}

// Update the sidebar with city metrics
function updateCityMetrics(city) {
  const metricsDiv = document.querySelector(".city-metrics");
  if (!metricsDiv) return;
  
  let weatherInfo = '';
  if (city.weather) {
    weatherInfo = `
      <p><b>Weather:</b> ${city.weather.description}</p>
      ${city.weather.temp !== null ? `<p><b>Temp:</b> ${city.weather.temp.toFixed(1)}°C</p>` : ''}
    `;
  }
  
  metricsDiv.innerHTML = `
    <h4>${city.name}</h4>
    ${weatherInfo}
    <p><b>IPI:</b> ${city.ipi.toFixed(1)}%</p>
    <p><b>Solidarity:</b> ${city.solidarity.toFixed(1)}%</p>
    <p><b>Propaganda:</b> ${city.propaganda.toFixed(1)}%</p>
  `;
}
window.updateCityMetrics = updateCityMetrics;

// Generic feedback function
function showFeedback(message, type = 'info') {
  const feedback = document.getElementById('retaliation-feedback');
  if (feedback) {
    feedback.textContent = message;
    feedback.style.backgroundColor = type === 'success' ? 'rgba(0, 100, 0, 0.8)' : 'rgba(200, 0, 0, 0.8)';
    feedback.style.display = 'block';
    setTimeout(() => feedback.style.display = 'none', 3000);
  }
}
window.showFeedback = showFeedback;