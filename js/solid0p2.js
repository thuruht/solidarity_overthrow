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

  const sidebarContent = `<h3>Global Metrics</h3>
    <p><b>Global Imperialist Power Index:</b> ${globalIpi}%</p>
    <p><b>Propaganda Level:</b> ${globalPropaganda}%</p>
    <p><b>Solidarity Index:</b> ${globalSolidarity}%</p>`;
  document.querySelector(".global-metrics").innerHTML = sidebarContent;
}

// Initialize global metrics on page load
updateGlobalMetrics();

// Collective actions and their effects on global and city metrics
function performCollectiveAction(actionType) {
  const affectedCities = globalCities.filter(city => city.solidarity > 10);

  affectedCities.forEach(city => {
    switch (actionType) {
      case 'protest':
        city.ipi -= 2;
        city.propaganda -= 1;
        break;
      case 'strike':
        city.ipi -= 4;
        city.solidarity += 2;
        break;
      case 'network':
        city.solidarity += 5;
        break;
      case 'sabotage':
        city.ipi -= 8;
        city.propaganda += 3;
        city.solidarity -= 2;
        break;
    }
    // Animate marker (using GSAP)
    const cityMarker = document.querySelector(`#marker-${city.name}`);
    if (cityMarker) {
      gsap.fromTo(cityMarker, { scale: 1 }, { scale: 1.5, duration: 0.5, yoyo: true, repeat: 1 });
    }
    updateCityMetrics(city);
  });

  updateGlobalMetrics();
  triggerStateRetaliation(actionType);

  // Animate global metrics
  gsap.fromTo("#global-metrics", { opacity: 0.5 }, { opacity: 1, duration: 1 });
}

// Dropdown event listener
document.getElementById('collectiveActionsDropdown').addEventListener('change', function () {
  if (this.value) {
    performCollectiveAction(this.value);
    gsap.fromTo(this, { scale: 1 }, { scale: 1.2, duration: 0.3, yoyo: true, repeat: 1 });
    this.value = "";
  }
});
