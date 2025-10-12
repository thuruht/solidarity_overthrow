// Coup Planning and Execution Logic

// Create a coupPlanner object to expose functions to other modules
const coupPlanner = (() => {
  // Private variables
  const plan = {
    active: false,
    securityLevel: 100,  // 0-100, lower is better (less detected)
    prepLevel: 0,        // 0-100, higher is better
    cells: [],           // Cities that are part of the coup network
    leadCity: null,      // The city leading the coup
    requiredPrep: 75,    // Prep level required to launch coup
    detectionRisk: 5,    // Base risk of detection per turn (%)
    lastAction: null,    // Timestamp of last coup-related action
    cooldown: 30000,     // 30 seconds cooldown between coup actions
  };

  // Initialize coup planning system
  function init() {
    // Add coup button to sidebar if prep conditions are met
    checkCoupPlanningAvailability();
    
    // Set up event listener for coup planning panel toggle
    document.addEventListener('click', function(e) {
      if(e.target && e.target.id === 'coup-plan-btn') {
        toggleCoupPlanningPanel();
      }
      if(e.target && e.target.id === 'start-coup-planning') {
        startCoupPlanning();
      }
      if(e.target && e.target.id === 'execute-coup') {
        executeCoup();
      }
      if(e.target && e.target.id === 'cancel-coup') {
        cancelCoupPlanning();
      }
    });
    
    // Add a detector for any collective action to check for coup detection
    const originalPerformCollectiveAction = window.performCollectiveAction;
    window.performCollectiveAction = function(actionType) {
      // Call the original function
      originalPerformCollectiveAction(actionType);
      
      // Check if a coup is being planned
      if (plan.active) {
        // Calculate risk of detection based on action type
        let detectionRisk = plan.detectionRisk;
        
        // Adjust risk based on action type
        if (actionType === 'sabotage') {
          detectionRisk *= 3; // Sabotage has high risk of exposure
        } else if (actionType === 'protest') {
          detectionRisk *= 2; // Protests are public and increase scrutiny
        }
        
        // Roll for detection
        const detectionRoll = Math.random() * 100;
        if (detectionRoll < detectionRisk) {
          increaseSuspicion();
        }
      }
    };
    
    // Check for coup planning conditions periodically
    setInterval(checkCoupPlanningAvailability, 10000);
  }

  // Check if coup planning should be available based on global metrics
  function checkCoupPlanningAvailability() {
    const controlsContainer = document.getElementById('unified-controls');
    const existingBtn = document.getElementById('coup-plan-btn');
    
    // Conditions for coup planning to become available
    const minSolidarity = 25; // Need at least 25% global solidarity
    const maxIPI = 85;        // IPI should be weakened to max 85%
    
    if (globalMetricsData.solidarity >= minSolidarity && globalMetricsData.ipi <= maxIPI) {
      // Add button if it doesn't exist
      if (!existingBtn && controlsContainer) {
        const coupControlBlock = document.createElement('div');
        coupControlBlock.className = 'control-block';

        const coupBtn = document.createElement('button');
        coupBtn.id = 'coup-plan-btn';
        coupBtn.className = 'control-toggle';
        coupBtn.innerHTML = `<span class="material-icons">vpn_key</span> Plan Revolution`;
        
        coupControlBlock.appendChild(coupBtn);
        controlsContainer.appendChild(coupControlBlock);
        
        // Highlight button effect
        if (typeof gsap !== 'undefined') {
          gsap.to(coupBtn, {
            backgroundColor: '#8B0000',
            duration: 1,
            repeat: 2,
            yoyo: true,
            onComplete: () => {
              gsap.to(coupBtn, { backgroundColor: '#333', duration: 0.5 });
            }
          });
        }
        
        // Show notification that revolution planning is available
        showNotification('Revolution Planning Available!', 'You can now begin planning the final overthrow of the imperialist system.');
      }
    } else if (existingBtn && (globalMetricsData.solidarity < minSolidarity || globalMetricsData.ipi > maxIPI)) {
      // Remove button if conditions no longer met
      existingBtn.parentElement.remove();
    }
  }

  // Toggle the coup planning panel
  function toggleCoupPlanningPanel() {
    let panel = document.getElementById('coup-planning-panel');
    
    if (!panel) {
      // Create panel if it doesn't exist
      panel = document.createElement('div');
      panel.id = 'coup-planning-panel';
      panel.className = 'coup-panel';
      
      if (!plan.active) {
        // Initial state - not planning yet
        panel.innerHTML = `
          <h3>Revolution Planning</h3>
          <p>Planning a revolution against the imperialist system requires careful coordination across multiple cities.</p>
          <p>You'll need to:</p>
          <ul>
            <li>Establish revolutionary cells in key cities</li>
            <li>Maintain secrecy to avoid detection</li>
            <li>Build preparation to 75% or higher</li>
            <li>Choose a strategic moment to strike</li>
          </ul>
          <p>Warning: If your security level drops to 0, your plot will be discovered and the game will end!</p>
          <button id="start-coup-planning" class="action-btn">Begin Planning</button>
          <button id="close-panel" class="action-btn">Close</button>
        `;
      } else {
        // Already planning - show status
        updateCoupPlanningPanel(panel);
      }
      
      document.body.appendChild(panel);
      
      // Add close button functionality
      document.getElementById('close-panel').addEventListener('click', function() {
        panel.remove();
      });
    } else {
      // Update panel with latest data if it exists
      if (plan.active) {
        updateCoupPlanningPanel(panel);
      }
      
      // Toggle visibility
      if (panel.style.display === 'none') {
        panel.style.display = 'block';
      } else {
        panel.style.display = 'none';
      }
    }
  }

  // Update the coup planning panel with current status
  function updateCoupPlanningPanel(panel) {
    if (!panel) {
      panel = document.getElementById('coup-planning-panel');
      if (!panel) return;
    }
    
    // Create the cells list
    let cellsHTML = '';
    if (plan.cells.length === 0) {
      cellsHTML = '<p>No revolutionary cells established yet.</p>';
    } else {
      cellsHTML = '<ul class="cells-list">';
      plan.cells.forEach(cell => {
        const city = globalCities.find(c => c.name === cell);
        const isLead = cell === plan.leadCity;
        
        cellsHTML += `<li class="${isLead ? 'lead-cell' : ''}">
          ${cell} ${isLead ? '(Lead Cell)' : ''}
          <span class="cell-status">
            <span class="material-icons">group</span> ${city ? city.solidarity : 'N/A'}%
          </span>
        </li>`;
      });
      cellsHTML += '</ul>';
    }
    
    // Show the current status of the coup planning
    panel.innerHTML = `
      <h3>Revolution Status</h3>
      <div class="status-bars">
        <div class="status-item">
          <label>Preparation: ${plan.prepLevel}%</label>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${plan.prepLevel}%; background-color: ${plan.prepLevel >= plan.requiredPrep ? '#6B8E23' : '#888'};"></div>
          </div>
        </div>
        <div class="status-item">
          <label>Security: ${plan.securityLevel}%</label>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${plan.securityLevel}%; background-color: ${plan.securityLevel < 30 ? 'red' : plan.securityLevel < 60 ? 'orange' : '#6B8E23'};"></div>
          </div>
        </div>
      </div>
      
      <h4>Revolutionary Cells</h4>
      ${cellsHTML}
      
      <div class="coup-actions">
        <button id="add-cell" class="action-btn" onclick="coupPlanner.openCellSelection()">Add Cell</button>
        <button id="improve-security" class="action-btn" onclick="coupPlanner.improveSecurity()">Improve Security</button>
        <button id="accelerate-prep" class="action-btn" onclick="coupPlanner.acceleratePrep()">Accelerate Prep</button>
        ${plan.leadCity ? '' : '<button id="designate-lead" class="action-btn" onclick="coupPlanner.selectLeadCity()">Select Lead City</button>'}
      </div>
      
      <div class="coup-execute">
        ${plan.prepLevel >= plan.requiredPrep && plan.leadCity ? 
          '<button id="execute-coup" class="execute-btn">Execute Revolution!</button>' : 
          '<button class="execute-btn disabled" disabled>Revolution Not Ready</button>'}
        <button id="cancel-coup" class="cancel-btn">Cancel Plans</button>
      </div>
      
      <button id="close-panel" class="action-btn">Close</button>
    `;
    
    // Re-add close button functionality
    document.getElementById('close-panel').addEventListener('click', function() {
      panel.style.display = 'none';
    });
  }

  // Start planning a coup
  function startCoupPlanning() {
    plan.active = true;
    plan.securityLevel = 100;
    plan.prepLevel = 0;
    plan.cells = [];
    plan.leadCity = null;
    plan.lastAction = Date.now();
    
    showNotification('Revolution Planning Started', 'You have begun planning the revolution. Maintain secrecy and establish cells in strategic cities.');
    
    // Update the planning panel
    toggleCoupPlanningPanel();
    
    // Add the coup status indicator to the top bar
    addCoupStatusIndicator();
  }

  // Add a status indicator for the coup to the top bar
  function addCoupStatusIndicator() {
    const topBar = document.getElementById('unified-controls');
    
    // Check if indicator already exists
    if (document.getElementById('coup-status-indicator')) return;
    
    const indicator = document.createElement('div');
    indicator.id = 'coup-status-indicator';
    indicator.className = 'coup-indicator';
    indicator.innerHTML = `
      <span class="material-icons">security</span>
      <div class="mini-progress">
        <div class="mini-bar security"></div>
      </div>
      <span class="material-icons">build</span>
      <div class="mini-progress">
        <div class="mini-bar prep"></div>
      </div>
    `;
    
    topBar.appendChild(indicator);
    updateCoupIndicator();
  }

  // Update the coup status indicator
  function updateCoupIndicator() {
    const indicator = document.getElementById('coup-status-indicator');
    if (!indicator) return;
    
    const securityBar = indicator.querySelector('.mini-bar.security');
    const prepBar = indicator.querySelector('.mini-bar.prep');
    
    securityBar.style.width = `${plan.securityLevel}%`;
    securityBar.style.backgroundColor = plan.securityLevel < 30 ? 'red' : 
                                       plan.securityLevel < 60 ? 'orange' : '#6B8E23';
    
    prepBar.style.width = `${plan.prepLevel}%`;
    prepBar.style.backgroundColor = plan.prepLevel >= plan.requiredPrep ? '#6B8E23' : '#888';
  }

  // Open the cell selection dialog
  function openCellSelection() {
    // Check cooldown
    if (!checkCoupActionCooldown()) return;
    
    // Filter cities that have high enough solidarity and aren't already cells
    const eligibleCities = globalCities.filter(city => 
      city.solidarity >= 50 && !plan.cells.includes(city.name)
    );
    
    if (eligibleCities.length === 0) {
      showNotification('No Eligible Cities', 'You need cities with at least 50% solidarity to establish revolutionary cells.');
      return;
    }
    
    // Create and show the selection dialog
    const dialog = document.createElement('div');
    dialog.className = 'selection-dialog';
    dialog.innerHTML = `
      <h3>Select City for Revolutionary Cell</h3>
      <p>Choose a city with high solidarity to establish a revolutionary cell.</p>
      <div class="city-list">
        ${eligibleCities.map(city => 
          `<div class="city-option" data-city="${city.name}">
            <span>${city.name}</span>
            <span>Solidarity: ${city.solidarity}%</span>
           </div>`
        ).join('')}
      </div>
      <button id="close-selection" class="action-btn">Cancel</button>
    `;
    
    document.body.appendChild(dialog);
    
    // Add event listeners to city options
    const cityOptions = dialog.querySelectorAll('.city-option');
    cityOptions.forEach(option => {
      option.addEventListener('click', function() {
        const cityName = this.dataset.city;
        addCellToNetwork(cityName);
        dialog.remove();
      });
    });
    
    // Add close button functionality
    document.getElementById('close-selection').addEventListener('click', function() {
      dialog.remove();
    });
  }  // Add a city to the revolutionary network
  function addCellToNetwork(cityName) {
    // Update coup plan
    plan.cells.push(cityName);
    plan.lastAction = Date.now();
    
    // Increase preparation level
    const city = globalCities.find(c => c.name === cityName);
    const prepIncrease = Math.floor(city.solidarity / 10); // Higher solidarity = more prep
    plan.prepLevel = Math.min(100, plan.prepLevel + prepIncrease);
    
    // Small security risk
    const securityDecrease = Math.floor(Math.random() * 5) + 1; // 1-5% decrease
    plan.securityLevel = Math.max(0, plan.securityLevel - securityDecrease);
    
    // Check if security is compromised
    if (plan.securityLevel <= 0) {
      coupPlanExposed();
      return;
    }
    
    // Check for achievement
    if (typeof gameLogic !== 'undefined' && gameLogic.checkAchievements) {
      gameLogic.checkAchievements();
    }
    
    // Update UI
    updateCoupPlanningPanel();
    updateCoupIndicator();
    
    // Zoom to the city on the map
    const cityData = globalCities.find(c => c.name === cityName);
    if (cityData && typeof map !== 'undefined') {
      map.setView([cityData.lat, cityData.lon], 6);
    }
    
    showNotification('Cell Established', `Revolutionary cell established in ${cityName}. Preparation +${prepIncrease}%, Security -${securityDecrease}%`);
  }

  // Select a lead city for the revolution
  function selectLeadCity() {
    // Check cooldown
    if (!checkCoupActionCooldown()) return;
    
    if (plan.cells.length === 0) {
      showNotification('No Cells Available', 'You need to establish at least one revolutionary cell first.');
      return;
    }
    
    // Create and show the selection dialog
    const dialog = document.createElement('div');
    dialog.className = 'selection-dialog';
    dialog.innerHTML = `
      <h3>Select Lead City for Revolution</h3>
      <p>Choose the city that will lead and coordinate the revolutionary action.</p>
      <div class="city-list">
        ${plan.cells.map(cellName => {
          const city = globalCities.find(c => c.name === cellName);
          return `<div class="city-option" data-city="${cellName}">
            <span>${cellName}</span>
            <span>Solidarity: ${city ? city.solidarity : 'N/A'}%</span>
           </div>`;
        }).join('')}
      </div>
      <button id="close-selection" class="action-btn">Cancel</button>
    `;
    
    document.body.appendChild(dialog);
    
    // Add event listeners to city options
    const cityOptions = dialog.querySelectorAll('.city-option');
    cityOptions.forEach(option => {
      option.addEventListener('click', function() {
        const cityName = this.dataset.city;
        setLeadCity(cityName);
        dialog.remove();
      });
    });
    
    // Add close button functionality
    document.getElementById('close-selection').addEventListener('click', function() {
      dialog.remove();
    });
  }

  // Set a city as the lead for the revolution
  function setLeadCity(cityName) {
    plan.leadCity = cityName;
    plan.lastAction = Date.now();
    
    // Lead city selection gives a boost to preparation
    const prepBoost = 10;
    plan.prepLevel = Math.min(100, plan.prepLevel + prepBoost);
    
    // Medium security risk
    const securityDecrease = Math.floor(Math.random() * 10) + 5; // 5-15% decrease
    plan.securityLevel = Math.max(0, plan.securityLevel - securityDecrease);
    
    // Check if security is compromised
    if (plan.securityLevel <= 0) {
      coupPlanExposed();
      return;
    }
    
    // Update UI
    updateCoupPlanningPanel();
    updateCoupIndicator();
    
    // Zoom to the lead city on the map
    const cityData = globalCities.find(c => c.name === cityName);
    if (cityData && typeof map !== 'undefined') {
      map.setView([cityData.lat, cityData.lon], 6);
    }
    
    showNotification('Lead City Designated', `${cityName} has been designated as the lead city for the revolution. Preparation +${prepBoost}%, Security -${securityDecrease}%`);
  }

  // Improve security for the coup plan
  function improveSecurity() {
    // Check cooldown
    if (!checkCoupActionCooldown()) return;
    
    const securityImprovement = Math.floor(Math.random() * 15) + 10; // 10-25% increase
    plan.securityLevel = Math.min(100, plan.securityLevel + securityImprovement);
    plan.lastAction = Date.now();
    
    // Small negative impact on preparation
    const prepDecrease = Math.floor(Math.random() * 5) + 1; // 1-5% decrease
    plan.prepLevel = Math.max(0, plan.prepLevel - prepDecrease);
    
    // Update UI
    updateCoupPlanningPanel();
    updateCoupIndicator();
    
    showNotification('Security Improved', `Improved operational security measures. Security +${securityImprovement}%, Preparation -${prepDecrease}%`);
  }

  // Accelerate preparation for the coup
  function acceleratePrep() {
    // Check cooldown
    if (!checkCoupActionCooldown()) return;
    
    const prepImprovement = Math.floor(Math.random() * 15) + 10; // 10-25% increase
    plan.prepLevel = Math.min(100, plan.prepLevel + prepImprovement);
    plan.lastAction = Date.now();
    
    // Significant security risk
    const securityDecrease = Math.floor(Math.random() * 15) + 10; // 10-25% decrease
    plan.securityLevel = Math.max(0, plan.securityLevel - securityDecrease);
    
    // Check if security is compromised
    if (plan.securityLevel <= 0) {
      coupPlanExposed();
      return;
    }
    
    // Update UI
    updateCoupPlanningPanel();
    updateCoupIndicator();
    
    showNotification('Preparation Accelerated', `Accelerated revolutionary preparations. Preparation +${prepImprovement}%, Security -${securityDecrease}%`);
  }

  // Increase suspicion when detected
  function increaseSuspicion() {
    const suspicionIncrease = Math.floor(Math.random() * 10) + 5; // 5-15% decrease in security
    plan.securityLevel = Math.max(0, plan.securityLevel - suspicionIncrease);
    
    // Check if security is compromised
    if (plan.securityLevel <= 0) {
      coupPlanExposed();
      return;
    }
    
    // Update UI
    updateCoupPlanningPanel();
    updateCoupIndicator();
    
    showNotification('Suspicion Increased', `The authorities are becoming suspicious of unusual activity. Security -${suspicionIncrease}%`, 'warning');
  }

  // Check if enough time has passed since the last coup action
  function checkCoupActionCooldown() {
    const now = Date.now();
    const timeSinceLastAction = now - plan.lastAction;
    
    if (timeSinceLastAction < plan.cooldown) {
      const remainingSeconds = Math.ceil((plan.cooldown - timeSinceLastAction) / 1000);
      showNotification('Action Cooldown', `You must wait ${remainingSeconds} seconds before taking another revolutionary action.`, 'warning');
      return false;
    }
    
    return true;
  }

  // Execute the coup
  function executeCoup() {
    // Check required conditions
    if (plan.prepLevel < plan.requiredPrep || !plan.leadCity) {
      showNotification('Not Ready', 'The revolution is not ready to be executed yet.', 'warning');
      return;
    }
    
    // Calculate success chance based on preparation, security, and global metrics
    const baseChance = plan.prepLevel;
    const securityModifier = plan.securityLevel / 100; // Higher security = better chance
    const solidarityModifier = globalMetricsData.solidarity / 50; // Higher solidarity = better chance
    const ipiModifier = (100 - globalMetricsData.ipi) / 50; // Lower IPI = better chance
    
    const successChance = baseChance * securityModifier * solidarityModifier * ipiModifier;
    
    // Roll for success
    const successRoll = Math.random() * 100;
    
    if (successRoll <= successChance) {
      revolutionVictory();
    } else {
      revolutionFailure();
    }
  }

  // The revolution is successful
  function revolutionVictory() {
    // Hide coup planning panel if open
    const panel = document.getElementById('coup-planning-panel');
    if (panel) panel.style.display = 'none';
    
    // Use the gameLogic module to trigger victory
    if (typeof gameLogic !== 'undefined' && gameLogic.triggerWin) {
      gameLogic.triggerWin('revolution');
    } else {
      // Fallback if gameLogic is not available
      const victoryMessage = document.createElement('div');
      victoryMessage.id = 'game-end-message';
      victoryMessage.style.backgroundColor = 'rgba(0, 100, 0, 0.9)';
      victoryMessage.innerHTML = `
        <h2>Revolutionary Victory!</h2>
        <p>The coordinated revolutionary action has succeeded! The imperialist power structure has been overthrown!</p>
        <p>Led by the brave revolutionaries of ${plan.leadCity}, and supported by cells in ${plan.cells.length} cities around the world, a new era of solidarity and freedom has begun.</p>
        <p>Global IPI: 0%</p>
        <p>Global Solidarity: 100%</p>
        <button id="restart-game">Continue The Struggle</button>
      `;
      
      document.body.appendChild(victoryMessage);
      
      // Add event listener to restart button
      document.getElementById('restart-game').addEventListener('click', () => {
        if (typeof restartGame === 'function') {
          restartGame();
        } else {
          window.location.reload();
        }
        document.body.removeChild(victoryMessage);
      });
    }
    
    // Reset coup plan
    resetCoupPlan();
  }

  // The revolution fails
  function revolutionFailure() {
    // Hide coup planning panel if open
    const panel = document.getElementById('coup-planning-panel');
    if (panel) panel.style.display = 'none';
    
    // Use the gameLogic module to trigger failure
    if (typeof gameLogic !== 'undefined' && gameLogic.triggerLose) {
      gameLogic.triggerLose('revolution_failed');
    } else {
      // Fallback if gameLogic is not available
      const failureMessage = document.createElement('div');
      failureMessage.id = 'game-end-message';
      failureMessage.style.backgroundColor = 'rgba(100, 0, 0, 0.9)';
      failureMessage.innerHTML = `
        <h2>Revolution Failed!</h2>
        <p>The revolutionary action has failed! Despite careful planning, the imperialist forces were able to counter the uprising.</p>
        <p>Many revolutionaries have been arrested, and the movement has been set back significantly.</p>
        <p>Global IPI: ${Math.min(100, globalMetricsData.ipi + 20).toFixed(1)}%</p>
        <p>Global Solidarity: ${Math.max(0, globalMetricsData.solidarity - 30).toFixed(1)}%</p>
        <button id="restart-game">Try Again</button>
      `;
      
      document.body.appendChild(failureMessage);
      
      // Add event listener to restart button
      document.getElementById('restart-game').addEventListener('click', () => {
        if (typeof restartGame === 'function') {
          restartGame();
        } else {
          window.location.reload();
        }
        document.body.removeChild(failureMessage);
      });
      
      // Apply penalties to global metrics
      globalMetricsData.ipi = Math.min(100, globalMetricsData.ipi + 20);
      globalMetricsData.solidarity = Math.max(0, globalMetricsData.solidarity - 30);
      
      // Apply penalties to all cities in the network
      plan.cells.forEach(cellName => {
        const city = globalCities.find(c => c.name === cellName);
        if (city) {
          city.ipi = Math.min(100, city.ipi + 15);
          city.solidarity = Math.max(0, city.solidarity - 25);
        }
      });
    }
    
    // Reset coup plan
    resetCoupPlan();
  }

  // The coup plan is exposed by authorities
  function coupPlanExposed() {
    // Hide coup planning panel if open
    const panel = document.getElementById('coup-planning-panel');
    if (panel) panel.style.display = 'none';
    
    // Use the gameLogic module to trigger failure
    if (typeof gameLogic !== 'undefined' && gameLogic.triggerLose) {
      gameLogic.triggerLose('coup_exposed');
    } else {
      // Fallback if gameLogic is not available
      const exposureMessage = document.createElement('div');
      exposureMessage.id = 'game-end-message';
      exposureMessage.style.backgroundColor = 'rgba(100, 0, 0, 0.9)';
      exposureMessage.innerHTML = `
        <h2>Revolution Plans Exposed!</h2>
        <p>Your revolutionary network has been infiltrated and exposed by the authorities!</p>
        <p>Mass arrests have been carried out in all revolutionary cells, and the movement has been severely damaged.</p>
        <p>Global IPI: ${Math.min(100, globalMetricsData.ipi + 30).toFixed(1)}%</p>
        <p>Global Solidarity: ${Math.max(0, globalMetricsData.solidarity - 40).toFixed(1)}%</p>
        <button id="restart-game">Try Again</button>
      `;
      
      document.body.appendChild(exposureMessage);
      
      // Add event listener to restart button
      document.getElementById('restart-game').addEventListener('click', () => {
        if (typeof restartGame === 'function') {
          restartGame();
        } else {
          window.location.reload();
        }
        document.body.removeChild(exposureMessage);
      });
      
      // Apply penalties to global metrics
      globalMetricsData.ipi = Math.min(100, globalMetricsData.ipi + 30);
      globalMetricsData.solidarity = Math.max(0, globalMetricsData.solidarity - 40);
      
      // Apply penalties to all cities in the network
      plan.cells.forEach(cellName => {
        const city = globalCities.find(c => c.name === cellName);
        if (city) {
          city.ipi = Math.min(100, city.ipi + 25);
          city.solidarity = Math.max(0, city.solidarity - 35);
        }
      });
    }
    
    // Reset coup plan
    resetCoupPlan();
  }

  // Cancel coup planning
  function cancelCoupPlanning() {
    // Confirm cancellation
    if (!confirm('Are you sure you want to cancel the revolutionary plans? All progress will be lost.')) {
      return;
    }
    
    // Show cancellation message
    showNotification('Plans Canceled', 'Revolutionary plans have been safely canceled and all traces removed.');
    
    // Reset coup plan
    resetCoupPlan();
    
    // Hide coup planning panel
    const panel = document.getElementById('coup-planning-panel');
    if (panel) panel.remove();
    
    // Remove coup status indicator
    const indicator = document.getElementById('coup-status-indicator');
    if (indicator) indicator.remove();
  }

  // Reset the coup plan
  function resetCoupPlan() {
    plan.active = false;
    plan.securityLevel = 100;
    plan.prepLevel = 0;
    plan.cells = [];
    plan.leadCity = null;
    
    // Remove coup status indicator
    const indicator = document.getElementById('coup-status-indicator');
    if (indicator) indicator.remove();
    
    // Update global metrics display
    if (typeof updateGlobalMetrics === 'function') {
      updateGlobalMetrics();
    }
    
    // Check if coup planning should be available
    checkCoupPlanningAvailability();
  }

  // Public API
  return {
    init,
    openCellSelection,
    improveSecurity,
    acceleratePrep,
    selectLeadCity,
    executeCoup,
    cancelCoupPlanning,
    getCellsCount: () => plan.cells.length,
    getLeadCity: () => plan.leadCity,
    getPreparation: () => plan.prepLevel,
    getSecrecy: () => plan.securityLevel,
    isActive: () => plan.active
  };
})();

// Initialize the coup planner when the page loads
window.addEventListener('load', () => {
  coupPlanner.init();
});
