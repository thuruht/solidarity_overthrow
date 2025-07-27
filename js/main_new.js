// Main.js - Initializes and coordinates all game components

// Global variables for tracking game state
const globalMetricsData = {
  ipi: 100, // Imperialist Power Index
  propaganda: 100, // Propaganda Level
  solidarity: 0 // Solidarity Index
};

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing Solidarity Overthrow game...');
  
  // Initialize global metrics display
  updateGlobalMetrics();
  
  // Check if game modules are properly loaded
  if (typeof initMap === 'function') {
    console.log('Map module loaded');
  } else {
    console.error('Map module not loaded properly!');
  }
  
  if (typeof gameLogic !== 'undefined') {
    console.log('Game logic module loaded');
  } else {
    console.error('Game logic module not loaded properly!');
  }
  
  if (typeof coupPlanner !== 'undefined') {
    console.log('Coup planner module loaded');
  } else {
    console.error('Coup planner module not loaded properly!');
  }
  
  // Set up periodic checks for game state
  setInterval(() => {
    // Check game state (win/lose conditions)
    if (typeof gameLogic !== 'undefined') {
      gameLogic.checkGameState();
    }
    
    // Update global metrics
    updateGlobalMetrics();
  }, 10000); // Check every 10 seconds
  
  console.log('Game initialization complete');
});

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
