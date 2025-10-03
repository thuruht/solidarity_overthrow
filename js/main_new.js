// js/main_new.js - Initializes and coordinates all game components

// Game state flags
let gameInitialized = false;

// Global variables for tracking game state
const globalMetricsData = {
  ipi: 100, // Imperialist Power Index
  propaganda: 100, // Propaganda Level
  solidarity: 0 // Solidarity Index
};

// Globally accessible function to initialize the game
window.initializeGame = function() {
  if (gameInitialized) {
    console.log("Game already initialized.");
    return;
  }
  
  console.log("1. Initializing game components...");

  console.log("2. Merging additional cities...");
  mergeAdditionalCities();
  console.log("...Merging complete.");

  console.log("3. Setting up map...");
  if (typeof window.setupMap === 'function') {
    window.setupMap();
    console.log("...Map setup complete.");
  } else {
    console.error('setupMap function not found!');
  }

  console.log("4. Setting up city interactions...");
  if (typeof window.setupCityInteractions === 'function') {
    window.setupCityInteractions();
    console.log("...City interactions setup complete.");
  } else {
    console.error('setupCityInteractions function not found!');
  }

  console.log("5. Setting up collective actions...");
  if (typeof window.setupCollectiveActions === 'function') {
    window.setupCollectiveActions();
    console.log("...Collective actions setup complete.");
  } else {
    console.error('setupCollectiveActions function not found!');
  }
  
  console.log("6. Initializing global metrics...");
  updateGlobalMetrics();
  console.log("...Global metrics initialized.");

  console.log("7. Setting up periodic checks...");
  setInterval(() => {
    if (typeof gameLogic !== 'undefined' && gameLogic.checkGameState) {
      gameLogic.checkGameState();
    }
    updateGlobalMetrics();
  }, 10000);
  console.log("...Periodic checks set up.");
  
  gameInitialized = true;
  console.log("8. Game initialization complete.");
};

// Update global metrics display in the UI
function updateGlobalMetrics() {
  // Calculate global metrics based on all cities
  if (typeof globalCities !== 'undefined' && globalCities.length > 0) {
    const totalIpi = globalCities.reduce((sum, city) => sum + city.ipi, 0);
    const totalPropaganda = globalCities.reduce((sum, city) => sum + city.propaganda, 0);
    const totalSolidarity = globalCities.reduce((sum, city) => sum + city.solidarity, 0);
    
    globalMetricsData.ipi = parseFloat((totalIpi / globalCities.length).toFixed(1));
    globalMetricsData.propaganda = parseFloat((totalPropaganda / globalCities.length).toFixed(1));
    globalMetricsData.solidarity = parseFloat((totalSolidarity / globalCities.length).toFixed(1));
  }
  
  // Update the display in the top bar
  const globalMetricsDisplay = document.querySelector('.global-metrics');
  if (globalMetricsDisplay) {
    globalMetricsDisplay.innerHTML = `
      <span><b><span class="material-icons">military_tech</span> Imperialist Power Index:</b> ${globalMetricsData.ipi.toFixed(1)}%</span>
      <span><b><span class="material-icons">campaign</span> Propaganda Level:</b> ${globalMetricsData.propaganda.toFixed(1)}%</span>
      <span><b><span class="material-icons">groups</span> Solidarity Index:</b> ${globalMetricsData.solidarity.toFixed(1)}%</span>
    `;
  }
}

// Global function for restarting the game
function restartGame() {
  console.log('Restarting game...');
  
  // Reset global metrics
  globalMetricsData.ipi = 100;
  globalMetricsData.propaganda = 100;
  globalMetricsData.solidarity = 0;
  
  // Reset all cities
  if (typeof globalCities !== 'undefined') {
    globalCities.forEach(city => {
      city.ipi = Math.floor(Math.random() * 11) + 85; // 85-95
      city.propaganda = Math.floor(Math.random() * 16) + 85; // 85-100
      city.solidarity = Math.floor(Math.random() * 11); // 0-10
    });
  }
  
  // Update metrics display
  updateGlobalMetrics();
  
  // If a city is selected, update its metrics display
  const cityDropdown = document.getElementById('cityDropdown');
  if (cityDropdown && cityDropdown.value) {
    const selectedCity = globalCities.find(city => city.name === cityDropdown.value);
    if (selectedCity && typeof updateCityMetrics === 'function') {
      updateCityMetrics(selectedCity);
    }
  }
  
  // Reset markers if possible
  if (typeof updateCityMarkers === 'function') {
    updateCityMarkers();
  }
  
  // Reset coup planner if it exists
  if (typeof coupPlanner !== 'undefined' && coupPlanner.init) {
    coupPlanner.init();
  }
  
  console.log('Game restart complete');
}

// Function to merge the additional cities into the global cities array
function mergeAdditionalCities() {
  if (typeof additionalCities === 'undefined' || typeof globalCities === 'undefined') {
    console.error('City data not loaded properly!');
    return;
  }

  // Filter out duplicate cities
  const filteredAdditionalCities = additionalCities.filter(newCity => {
    return !globalCities.some(existingCity =>
      existingCity.name === newCity.name ||
      (Math.abs(existingCity.lat - newCity.lat) < 0.01 &&
       Math.abs(existingCity.lon - newCity.lon) < 0.01)
    );
  });

  // Add the filtered additional cities to the global cities array
  globalCities = globalCities.concat(filteredAdditionalCities);

  console.log(`Merged ${filteredAdditionalCities.length} new cities. Total: ${globalCities.length}`);
}

// Make key functions globally available
window.updateGlobalMetrics = updateGlobalMetrics;
window.restartGame = restartGame;
window.globalMetricsData = globalMetricsData;