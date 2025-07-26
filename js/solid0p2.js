// File: solid0p2.js

// Populate the dropdown with global cities and custom city option
function populateDropdown() {
  const dropdown = document.getElementById('cityDropdown');
  if (!dropdown) return;
  dropdown.innerHTML = `
    <option value="" disabled selected>Select a city...</option>
    ${globalCities
      .map(city => `<option value="${city.name}">${city.name}</option>`)
      .join('')}
    <option value="custom">Add Custom City...</option>
  `;
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
  
  // Use bindTooltip to show city info on hover
  marker.bindTooltip(
    `<b>${city.name}</b><br>
     <span>IPI: ${city.ipi}%</span><br>
     <span>Solidarity: ${city.solidarity}%</span><br>
     <span>Propaganda: ${city.propaganda}%</span>`,
    { direction: 'auto', opacity: 0.9 }
  );

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

// Create popup content for a city
function createCityPopup(city) {
  const popupContent = document.createElement('div');
  popupContent.className = 'city-popup';
  
  // City name as header
  const header = document.createElement('h3');
  header.textContent = city.name;
  popupContent.appendChild(header);
  
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
    <p><b>Take Action:</b></p>
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

// Fetch additional cities (placeholder) and then fetch weather for all
// Comment this out to avoid immediate rate limit issues:
// fetchAdditionalCities().then(() => {
//   globalCities.forEach(city => {
//     fetchWeather(city.lat, city.lon, city.name);
//   });
// });



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

  // Base effectiveness is higher when more cities have solidarity > 10
  const affectedCities = globalCities.filter(city => city.solidarity > 10);
  const effectiveness = Math.min(1.5, 0.5 + (affectedCities.length / globalCities.length));
  
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
    
    // Hide feedback after 3 seconds
    setTimeout(() => feedback.style.display = 'none', 3000);
  }

  updateGlobalMetrics();
  triggerStateRetaliation(actionType);

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
