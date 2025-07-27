// File: solid0p2.js

// Populate the dropdown with global cities and custom city option
function populateDropdown() {
  const citySelector = document.getElementById('cityDropdown');
  if (!citySelector) return;
  
  // Clear existing options except the default
  while (citySelector.options.length > 1) {
    citySelector.remove(1);
  }
  
  // Add cities to dropdown
  globalCities.forEach(city => {
    const option = document.createElemen  // Add to global cities list
  globalCities.push(city);

  // Repopulate dropdown to include the new city
  populateDropdown();

  // Place marker for the custom city with integrated weather
  const marker = L.marker([city.lat, city.lon]).addTo(map);
  marker._icon.id = `marker-${city.name.replace(/[^a-zA-Z0-9]/g, '-')}`;
  
  // Fetch weather and integrate it with the marker
  fetchAndIntegrateWeather(city, marker);
  
  // Add popup and event listeners
  marker.bindPopup(createCityPopup(city));
  marker.on('click', () => {
    const dropdown = document.getElementById('cityDropdown');
    if (dropdown) {
      dropdown.value = city.name;
    }
    map.setView([city.lat, city.lon], 6);
    updateCityMetrics(city);
  });
  
  // Color the marker based on solidarity level
  colorizeMarker(marker, city);

  // Update the sidebar with the custom city's metrics);
    option.value = city.name;
    option.textContent = city.name;
    citySelector.appendChild(option);
  });
  
  // Add option for custom city
  const customOption = document.createElement('option');
  customOption.value = "custom";
  customOption.textContent = "Add Custom City...";
  citySelector.appendChild(customOption);
}

// Populate the city dropdown
function populateDropdown() {
  const citySelector = document.getElementById('cityDropdown');
  if (!citySelector) return;
  
  // Clear existing options except the default
  while (citySelector.options.length > 1) {
    citySelector.remove(1);
  }
  
  // Add cities to dropdown
  globalCities.forEach(city => {
    const option = document.createElement('option');
    option.value = city.name;
    option.textContent = city.name;
    citySelector.appendChild(option);
  });
  
  // Add option for custom city
  const customOption = document.createElement('option');
  customOption.value = "custom";
  customOption.textContent = "Add Custom City...";
  citySelector.appendChild(customOption);
}

// Placeholder for future API integration
async function fetchAdditionalCities() {
  // In the future, you can fetch additional cities from an external API:
  // const response = await fetch('https://example.com/api/cities');
  // const additionalCities = await response.json();

  // For now, let's just simulate adding one additional city:
  const additionalCities = [
    { name: 'Berlin', lat: 52.5200, lon: 13.4050, ipi: 85, solidarity: 15, propaganda: 90 }
  ];

  additionalCities.forEach(city => globalCities.push(city));
  populateDropdown();
}

// Initial dropdown population
populateDropdown();

// Initialize city markers on the map when the page loads
function initializeMap() {
  // Start with a smaller batch of cities to avoid overwhelming the API
  const initialBatch = globalCities.slice(0, 30); // Start with 30 cities
  
  // Place markers for these cities
  initialBatch.forEach(city => {
    placeStaticMarker(city);
  });
  
  // Schedule the rest of the cities to load gradually
  setTimeout(() => {
    globalCities.slice(30).forEach((city, index) => {
      setTimeout(() => {
        placeStaticMarker(city);
      }, index * 100); // 100ms delay between each city
    });
  }, 2000); // Start after 2 seconds
}

// Place a static marker without weather API calls to avoid rate limits
function placeStaticMarker(city) {
  const marker = L.marker([city.lat, city.lon]).addTo(map);
  
  // Set a unique id for the marker
  marker._icon.id = `marker-${city.name.replace(/[^a-zA-Z0-9]/g, '-')}`;
  
  // Fetch weather data for this city
  fetchAndIntegrateWeather(city, marker);
  
  // Add popup for more detailed info and actions
  marker.bindPopup(createCityPopup(city));
  
  // On click, set the dropdown and zoom in closer
  marker.on('click', () => {
    const dropdown = document.getElementById('cityDropdown');
    if (dropdown) {
      dropdown.value = city.name;
    }
    map.setView([city.lat, city.lon], 6);
    updateCityMetrics(city);
  });
  
  // Color the marker based on solidarity level
  colorizeMarker(marker, city);
}

// Fetch weather data and integrate it with the city marker
async function fetchAndIntegrateWeather(city, marker) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${city.lat}&lon=${city.lon}&units=metric&appid=955034a79abe8e7bc9df0666a15f1b06`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    // Store weather data with the city
    city.weather = {
      description: data.weather && data.weather[0] ? data.weather[0].description : 'Unknown',
      temp: data.main ? data.main.temp : null,
      humidity: data.main ? data.main.humidity : null,
      wind: data.wind ? data.wind.speed : null,
      icon: data.weather && data.weather[0] ? data.weather[0].icon : null
    };
    
    // Update the tooltip to include weather info
    marker.bindTooltip(
      `<b>${city.name}</b><br>
       <span>Weather: ${city.weather.description}</span><br>
       <span>Temp: ${city.weather.temp !== null ? city.weather.temp.toFixed(1) + '°C' : 'N/A'}</span><br>
       <span>IPI: ${city.ipi}%</span><br>
       <span>Solidarity: ${city.solidarity}%</span>`,
      { direction: 'auto', opacity: 0.9 }
    );
    
    // Update popup if it's already created
    const popup = marker.getPopup();
    if (popup) {
      popup.setContent(createCityPopup(city));
    }
    
  } catch (error) {
    console.error(`Error fetching weather data for ${city.name}:`, error);
    
    // Default tooltip without weather
    marker.bindTooltip(
      `<b>${city.name}</b><br>
       <span>IPI: ${city.ipi}%</span><br>
       <span>Solidarity: ${city.solidarity}%</span><br>
       <span>Propaganda: ${city.propaganda}%</span>`,
      { direction: 'auto', opacity: 0.9 }
    );
  }
}

// Create popup content for a city
function createCityPopup(city) {
  const popupContent = document.createElement('div');
  popupContent.className = 'city-popup';
  
  // City name as header
  const header = document.createElement('h3');
  header.textContent = city.name;
  popupContent.appendChild(header);
  
  // Weather information (if available)
  if (city.weather) {
    const weatherDiv = document.createElement('div');
    weatherDiv.className = 'popup-weather';
    
    // If we have a weather icon, display it
    let weatherHTML = '';
    if (city.weather.icon) {
      weatherHTML += `<img src="https://openweathermap.org/img/wn/${city.weather.icon}.png" alt="${city.weather.description}" style="vertical-align: middle; margin-right: 5px;">`;
    }
    
    weatherHTML += `
      <p><b>Weather:</b> ${city.weather.description}</p>
      ${city.weather.temp !== null ? `<p><b>Temperature:</b> ${city.weather.temp.toFixed(1)}°C</p>` : ''}
      ${city.weather.humidity !== null ? `<p><b>Humidity:</b> ${city.weather.humidity}%</p>` : ''}
      ${city.weather.wind !== null ? `<p><b>Wind:</b> ${city.weather.wind} m/s</p>` : ''}
    `;
    
    weatherDiv.innerHTML = weatherHTML;
    popupContent.appendChild(weatherDiv);
  }
  
  // City metrics
  const metrics = document.createElement('div');
  metrics.className = 'popup-metrics';
  metrics.innerHTML = `
    <p><b>Imperialist Power Index:</b> <span class="metric-value">${city.ipi}%</span></p>
    <p><b>Solidarity:</b> <span class="metric-value">${city.solidarity}%</span></p>
    <p><b>Propaganda:</b> <span class="metric-value">${city.propaganda}%</span></p>
  `;
  popupContent.appendChild(metrics);
  
  // Actions section
  const actions = document.createElement('div');
  actions.className = 'popup-actions';
  actions.innerHTML = `
    <p><b>City-Specific Actions:</b></p>
    <button class="action-btn" data-action="protest" data-city="${city.name}">Protest</button>
    <button class="action-btn" data-action="strike" data-city="${city.name}">Strike</button>
    <button class="action-btn" data-action="network" data-city="${city.name}">Network</button>
    <button class="action-btn" data-action="sabotage" data-city="${city.name}">Sabotage</button>
  `;
  popupContent.appendChild(actions);
  
  // Add event listeners for action buttons
  setTimeout(() => {
    const actionButtons = document.querySelectorAll(`.action-btn[data-city="${city.name}"]`);
    actionButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        const cityName = e.target.dataset.city;
        performCityAction(action, cityName);
      });
    });
  }, 100);
  
  return popupContent;
}

// Perform action on a specific city
function performCityAction(action, cityName) {
  const city = globalCities.find(c => c.name === cityName);
  if (!city) return;
  
  // Apply action effect to this specific city
  let ipiChange = 0;
  let propagandaChange = 0;
  let solidarityChange = 0;
  let message = '';
  
  switch (action) {
    case 'protest':
      ipiChange = -3;
      propagandaChange = -2;
      solidarityChange = 2;
      message = `Protest organized in ${cityName}!`;
      break;
    case 'strike':
      ipiChange = -5;
      solidarityChange = 3;
      message = `Workers on strike in ${cityName}!`;
      break;
    case 'network':
      solidarityChange = 7;
      propagandaChange = -1;
      message = `Solidarity network strengthened in ${cityName}!`;
      break;
    case 'sabotage':
      ipiChange = -10;
      propagandaChange = 4;
      solidarityChange = -3;
      message = `Sabotage action conducted in ${cityName}!`;
      break;
  }
  
  // Apply changes
  city.ipi = Math.max(0, Math.min(100, city.ipi + ipiChange));
  city.propaganda = Math.max(0, Math.min(100, city.propaganda + propagandaChange));
  city.solidarity = Math.max(0, Math.min(100, city.solidarity + solidarityChange));
  
  // Update marker color
  const marker = document.querySelector(`#marker-${cityName.replace(/[^a-zA-Z0-9]/g, '-')}`);
  if (marker) {
    const leafletMarker = map._layers[Object.keys(map._layers).find(
      key => map._layers[key]._icon && map._layers[key]._icon.id === marker.id
    )];
    if (leafletMarker) {
      colorizeMarker(leafletMarker, city);
      leafletMarker.getPopup().setContent(createCityPopup(city));
    }
  }
  
  // Show feedback
  const feedback = document.getElementById('retaliation-feedback');
  if (feedback) {
    feedback.textContent = message;
    feedback.style.backgroundColor = 'rgba(0, 100, 0, 0.8)';
    feedback.style.display = 'block';
    setTimeout(() => feedback.style.display = 'none', 3000);
  }
  
  // Update city metrics if this is the selected city
  const dropdown = document.getElementById('cityDropdown');
  if (dropdown && dropdown.value === cityName) {
    updateCityMetrics(city);
  }
  
  // Count the action for achievements
  if (typeof performedActions !== 'undefined' && performedActions[action] !== undefined) {
    performedActions[action]++;
    if (typeof checkAchievements === 'function') {
      checkAchievements();
    }
  }
  
  // Update global metrics and check game state
  updateGlobalMetrics();
  if (typeof checkGameState === 'function') {
    checkGameState();
  }
}

// Colorize marker based on solidarity level
function colorizeMarker(marker, city) {
  let iconColor;
  
  if (city.solidarity < 20) {
    iconColor = 'red';
  } else if (city.solidarity < 50) {
    iconColor = 'orange';
  } else if (city.solidarity < 80) {
    iconColor = 'gold';
  } else {
    iconColor = 'green';
  }
  
  // Create a custom icon with the appropriate color
  const customIcon = L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${iconColor}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
  
  marker.setIcon(customIcon);
}

// Initialize map with markers
initializeMap();



// Handle city selection from dropdown
document.getElementById('cityDropdown').addEventListener('change', async function () {
  const selectedValue = this.value;

  if (selectedValue === 'custom') {
    const cityName = prompt('Enter the name of the city:');
    if (cityName) {
      const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}&format=json&limit=1`;
      try {
        const response = await fetch(geocodeUrl);
        const data = await response.json();

        if (data.length > 0) {
          const { lat, lon, display_name } = data[0];
          const customCity = {
            name: display_name.split(',')[0],
            lat: parseFloat(lat),
            lon: parseFloat(lon),
            ipi: Math.floor(Math.random() * 16) + 85,
            solidarity: Math.floor(Math.random() * 16),
            propaganda: Math.floor(Math.random() * 21) + 80,
          };

          addCustomCity(customCity);
        } else {
          alert('City not found. Please try again.');
        }
      } catch (error) {
        console.error('Error fetching city coordinates:', error);
      }
    }
  } else {
    handleCitySelection(selectedValue);
  }
});

// Handle city selection
function handleCitySelection(cityName) {
  const city = globalCities.find(c => c.name === cityName);
  if (city) {
    map.setView([city.lat, city.lon], 6);
    updateCityMetrics(city);
  }
}

// Add a custom city dynamically
function addCustomCity(city) {
  // Prevent duplicate cities
  if (globalCities.some(existingCity => existingCity.name === city.name)) {
    alert(`${city.name} is already added.`);
    return;
  }

  // Add to global cities list
  globalCities.push(city);

  // Repopulate dropdown to include the new city
  populateDropdown();

  // Place marker for the custom city with integrated weather
  const marker = L.marker([city.lat, city.lon]).addTo(map);
  marker._icon.id = `marker-${city.name.replace(/[^a-zA-Z0-9]/g, '-')}`;
  
  // Fetch weather and integrate it with the marker
  fetchAndIntegrateWeather(city, marker);
  
  // Add popup and event listeners
  marker.bindPopup(createCityPopup(city));
  marker.on('click', () => {
    const dropdown = document.getElementById('cityDropdown');
    if (dropdown) {
      dropdown.value = city.name;
    }
    map.setView([city.lat, city.lon], 6);
    updateCityMetrics(city);
  });
  
  // Color the marker based on solidarity level
  colorizeMarker(marker, city);

  // Update the sidebar with the custom city's metrics
  updateCityMetrics(city);
  updateGlobalMetrics();
  
  // Focus on the new city
  map.setView([city.lat, city.lon], 6);
}


// Add a custom city dynamically
function addCustomCity(city) {
  // Prevent duplicate cities
  if (globalCities.some(existingCity => existingCity.name === city.name)) {
    alert(`${city.name} is already added.`);
    return;
  }

  // Add to global cities list
  globalCities.push(city);

  // Repopulate dropdown to include the new city
  populateDropdown();

  // Fetch weather to place marker & popup for the custom city
  fetchWeather(city.lat, city.lon, city.name);

  // Update the sidebar with the custom city’s metrics
  updateCityMetrics(city);
  updateGlobalMetrics();
}

// Update the sidebar with city metrics
function updateCityMetrics(city) {
  let content = `<h3>${city.name} Metrics</h3>`;
  
  // Add weather info if available
  if (city.weather) {
    content += `
      <p><b>Weather:</b> ${city.weather.description}</p>
      ${city.weather.temp !== null ? `<p><b>Temperature:</b> ${city.weather.temp.toFixed(1)}°C</p>` : ''}
    `;
  }
  
  content += `
    <p><b>Imperialist Power Index:</b> ${city.ipi}%</p>
    <p><b>Solidarity:</b> ${city.solidarity}%</p>
    <p><b>Propaganda:</b> ${city.propaganda}%</p>
  `;
  
  document.querySelector(".city-metrics").innerHTML = content;
}

// Function to update global metrics
function updateGlobalMetrics() {
  const totalIpi = globalCities.reduce((sum, city) => sum + city.ipi, 0);
  const globalIpi = (totalIpi / globalCities.length).toFixed(2);

  const totalPropaganda = globalCities.reduce((sum, city) => sum + city.propaganda, 0);
  const globalPropaganda = (totalPropaganda / globalCities.length).toFixed(2);

  const totalSolidarity = globalCities.reduce((sum, city) => sum + city.solidarity, 0);
  const globalSolidarity = (totalSolidarity / globalCities.length).toFixed(2);

  // Update global metrics data (used by retaliation)
  if (typeof globalMetricsData !== 'undefined') {
    globalMetricsData.ipi = Math.min(100, Math.max(0, parseFloat(globalIpi)));
    globalMetricsData.propaganda = Math.min(100, Math.max(0, parseFloat(globalPropaganda)));
    globalMetricsData.solidarity = Math.min(100, Math.max(0, parseFloat(globalSolidarity)));
  }

  const globalMetricsElement = document.querySelector('#top-bar .global-metrics');
  globalMetricsElement.innerHTML = `
    <span><b><span class="material-icons">military_tech</span> Imperialist Power Index:</b> ${globalIpi}%</span>
    <span><b><span class="material-icons">campaign</span> Propaganda Level:</b> ${globalPropaganda}%</span>
    <span><b><span class="material-icons">groups</span> Solidarity Index:</b> ${globalSolidarity}%</span>
  `;
  
  // Animate global metrics update
  if (typeof gsap !== 'undefined') {
    gsap.fromTo(globalMetricsElement, { opacity: 0.5 }, { opacity: 1, duration: 1 });
  }
}

// Initialize global metrics on page load
updateGlobalMetrics();

// Collective actions and their effects on global and city metrics
function performCollectiveAction(actionType) {
  // Count the action
  if (typeof performedActions !== 'undefined' && performedActions[actionType] !== undefined) {
    performedActions[actionType]++;
  }

  // Get global solidarity level to determine impact
  const globalSolidarity = typeof window.globalMetricsData !== 'undefined' ? 
    window.globalMetricsData.solidarity : 
    (globalCities.reduce((sum, city) => sum + city.solidarity, 0) / globalCities.length);
  
  // Filter cities with solidarity > 10
  const potentialCities = globalCities.filter(city => city.solidarity > 10);
  
  // Check if there are any eligible cities
  if (potentialCities.length === 0) {
    // Show feedback about no eligible cities
    const feedback = document.getElementById('retaliation-feedback');
    if (feedback) {
      feedback.textContent = "No cities have enough solidarity (>10%) to participate in collective actions!";
      feedback.style.backgroundColor = 'rgba(255, 165, 0, 0.8)'; // Orange for warning
      feedback.style.display = 'block';
      
      // Hide feedback after 3 seconds
      setTimeout(() => feedback.style.display = 'none', 3000);
    }
    return; // Exit the function
  }
  
  // Calculate how many cities can be affected based on global solidarity
  // Higher solidarity means more coordinated action across cities
  const maxAffectedPercentage = Math.min(0.6, globalSolidarity / 100);
  
  // Calculate how many cities will actually be affected
  const maxAffectableCount = Math.max(1, Math.floor(potentialCities.length * maxAffectedPercentage));
  
  // Randomly select cities from potential cities, prioritizing those with higher solidarity
  const sortedByHigherSolidarity = [...potentialCities].sort((a, b) => b.solidarity - a.solidarity);
  const affectedCities = sortedByHigherSolidarity.slice(0, maxAffectableCount);
  
  // Base effectiveness is higher when more cities have solidarity > 10
  const effectiveness = Math.min(1.5, 0.5 + (affectedCities.length / Math.max(1, potentialCities.length)));
  
  // Show feedback about the action
  let actionFeedback = '';
  
  affectedCities.forEach(city => {
    let ipiChange = 0;
    let propagandaChange = 0;
    let solidarityChange = 0;
    
    switch (actionType) {
      case 'protest':
        ipiChange = -2 * effectiveness;
        propagandaChange = -1 * effectiveness;
        solidarityChange = 1 * effectiveness;
        actionFeedback = `Protests have erupted in ${affectedCities.length} cities!`;
        break;
      case 'strike':
        ipiChange = -4 * effectiveness;
        solidarityChange = 2 * effectiveness;
        actionFeedback = `Workers on strike in ${affectedCities.length} cities!`;
        break;
      case 'network':
        solidarityChange = 5 * effectiveness;
        propagandaChange = -1 * effectiveness;
        actionFeedback = `Solidarity networks strengthened in ${affectedCities.length} cities!`;
        break;
      case 'sabotage':
        ipiChange = -8 * effectiveness;
        propagandaChange = 3 * effectiveness; // Negative side effect: increased propaganda
        solidarityChange = -2 * effectiveness; // Negative side effect: reduced solidarity
        actionFeedback = `Sabotage actions conducted in ${affectedCities.length} cities!`;
        break;
    }
    
    // Apply changes with limits to prevent values going below 0 or above 100
    city.ipi = Math.max(0, Math.min(100, city.ipi + ipiChange));
    city.propaganda = Math.max(0, Math.min(100, city.propaganda + propagandaChange));
    city.solidarity = Math.max(0, Math.min(100, city.solidarity + solidarityChange));
    
    // Animate marker
    const cityMarker = document.querySelector(`#marker-${city.name.replace(/[^a-zA-Z0-9]/g, '-')}`);
    if (cityMarker) {
      if (typeof gsap !== 'undefined') {
        gsap.fromTo(cityMarker, { scale: 1 }, { scale: 1.5, duration: 0.5, yoyo: true, repeat: 1 });
      } else {
        console.log('Animation skipped - GSAP not available');
      }
    }
    
    // Update city metrics if this is the currently selected city
    const dropdown = document.getElementById('cityDropdown');
    if (dropdown && dropdown.value === city.name) {
      updateCityMetrics(city);
    }
  });

  // Show action feedback
  const feedback = document.getElementById('retaliation-feedback');
  if (feedback) {
    feedback.textContent = actionFeedback;
    feedback.style.backgroundColor = 'rgba(0, 100, 0, 0.8)';
    feedback.style.display = 'block';
    
    // Show which cities were affected in a follow-up message
    if (affectedCities.length > 0) {
      setTimeout(() => {
        const cityList = affectedCities.length <= 5 ? 
          affectedCities.map(city => city.name).join(', ') : 
          affectedCities.slice(0, 5).map(city => city.name).join(', ') + ` and ${affectedCities.length - 5} more`;
        
        feedback.textContent = `Affected cities: ${cityList}`;
        feedback.style.backgroundColor = 'rgba(0, 0, 100, 0.8)';
        feedback.style.display = 'block';
        
        // Hide feedback after 3 more seconds
        setTimeout(() => feedback.style.display = 'none', 3000);
      }, 3500);
    } else {
      // Hide feedback after 3 seconds if no cities were affected
      setTimeout(() => feedback.style.display = 'none', 3000);
    }
  }

  updateGlobalMetrics();
  if (typeof triggerStateRetaliation === 'function') {
    triggerStateRetaliation(actionType);
  }

  // Check achievements and game state
  if (typeof checkAchievements === 'function') {
    checkAchievements();
  }
  
  if (typeof checkGameState === 'function') {
    checkGameState();
  }
}

// Dropdown event listener
document.getElementById('collectiveActionsDropdown').addEventListener('change', function () {
  if (this.value) {
    performCollectiveAction(this.value);
    if (typeof gsap !== 'undefined') {
      gsap.fromTo(this, { scale: 1 }, { scale: 1.2, duration: 0.3, yoyo: true, repeat: 1 });
    }
    this.value = "";
  }
});

// Make fetchAndIntegrateWeather globally available
window.fetchAndIntegrateWeather = fetchAndIntegrateWeather;
