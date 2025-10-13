// Game Logic: Win/Lose Conditions and Game Progression

// Create a gameLogic object to expose functions to other modules
const gameLogic = (() => {
  // Check if the game is won or lost after each action
  function checkGameState() {
    // Check for revolutionary victory if coup planner is active
    if (typeof coupPlanner !== 'undefined' && 
        coupPlanner.isActive() && 
        coupPlanner.getCellsCount() >= 5 && 
        coupPlanner.getPreparation() >= 95 && 
        coupPlanner.getSecrecy() >= 80 && 
        coupPlanner.getLeadCity() !== null) {
      // Player has all the conditions for revolutionary victory, but needs to execute it manually
      // This is handled in the coupPlanner's executeCoup function
    }
    
    // Standard victory conditions
    if (globalMetricsData.ipi <= 25) {
      // Win condition - imperialist power is very low
      triggerWin('victory');
    } else if (globalMetricsData.solidarity >= 75) {
      // Alternative win condition - solidarity is very high
      triggerWin('solidarity-victory');
    } else if (globalMetricsData.propaganda <= 25) {
      // Alternative win condition - propaganda is very low
      triggerWin('truth-victory');
    } else if (globalMetricsData.ipi >= 95 && globalMetricsData.solidarity <= 10) {
      // Lose condition - high imperialist power and low solidarity
      triggerLose('defeat');
    }
  }

  // Trigger win condition
  function triggerWin(type) {
    showGameEndMessage(type);
  }

  // Trigger lose condition
  function triggerLose(type) {
    if (type === 'coup_exposed') {
      showGameEndMessage('coup-exposed');
    } else if (type === 'revolution_failed') {
      showGameEndMessage('revolution-failed');
    } else {
      showGameEndMessage('defeat');
    }
  }

  // Display victory or defeat message
  function showGameEndMessage(outcome) {
    const messageContainer = document.createElement('div');
    messageContainer.id = 'game-end-message';
    messageContainer.classList.add('game-end-message');

    let message = '';
    
    switch(outcome) {
      case 'victory':
        messageContainer.classList.add('victory');
        message = `
          <h2>Victory! Imperialism Has Been Overthrown!</h2>
          <p>Through solidarity and collective action, the people of the world have successfully dismantled the imperialist power structure!</p>
          <p>Global IPI: ${globalMetricsData.ipi.toFixed(1)}%</p>
          <p>Global Solidarity: ${globalMetricsData.solidarity.toFixed(1)}%</p>
          <button id="restart-game">Continue The Struggle</button>
        `;
        break;
      case 'solidarity-victory':
        messageContainer.classList.add('victory');
        message = `
          <h2>Solidarity Victory!</h2>
          <p>The world's people have united in an unprecedented show of solidarity. Imperialism cannot survive against such unity!</p>
          <p>Global Solidarity: ${globalMetricsData.solidarity.toFixed(1)}%</p>
          <p>Global IPI: ${globalMetricsData.ipi.toFixed(1)}%</p>
          <button id="restart-game">Continue The Struggle</button>
        `;
        break;
      case 'truth-victory':
        messageContainer.classList.add('victory');
        message = `
          <h2>Truth Victory!</h2>
          <p>Imperial propaganda has been countered with truth. The people now see through the lies and are rising up!</p>
          <p>Global Propaganda: ${globalMetricsData.propaganda.toFixed(1)}%</p>
          <p>Global IPI: ${globalMetricsData.ipi.toFixed(1)}%</p>
          <button id="restart-game">Continue The Struggle</button>
        `;
        break;
      case 'revolution':
        messageContainer.classList.add('victory');
        message = `
          <h2>Revolutionary Victory!</h2>
          <p>The secret revolutionary network you built has successfully executed a global coup! The imperialist structures have been overthrown and the people now control their own destiny.</p>
          <p>Global Solidarity: ${globalMetricsData.solidarity.toFixed(1)}%</p>
          <p>Global IPI: ${globalMetricsData.ipi.toFixed(1)}%</p>
          <button id="restart-game">Continue The Struggle</button>
        `;
        break;
      case 'defeat':
        messageContainer.classList.add('defeat');
        message = `
          <h2>Defeat!</h2>
          <p>The imperial powers have consolidated control. The struggle continues, but this battle is lost...</p>
          <p>Global IPI: ${globalMetricsData.ipi.toFixed(1)}%</p>
          <p>Global Solidarity: ${globalMetricsData.solidarity.toFixed(1)}%</p>
          <button id="restart-game">Try Again</button>
        `;
        break;
      case 'coup-exposed':
        messageContainer.classList.add('defeat');
        message = `
          <h2>Revolution Exposed!</h2>
          <p>Your revolutionary network has been infiltrated and exposed. The leaders have been arrested, and the movement is in disarray.</p>
          <p>The imperial powers have increased their control, but the spirit of revolution lives on...</p>
          <button id="restart-game">Try Again</button>
        `;
        break;
      case 'revolution-failed':
        messageContainer.classList.add('defeat');
        message = `
          <h2>Revolution Failed!</h2>
          <p>Despite meticulous planning, the revolution has been suppressed by overwhelming government forces.</p>
          <p>But this is not the end. The people have tasted resistance, and the embers of revolution will burn again...</p>
          <button id="restart-game">Try Again</button>
        `;
        break;
    }
    
    messageContainer.innerHTML = message;
    document.body.appendChild(messageContainer);
    
    // Add event listener to restart button
    document.getElementById('restart-game').addEventListener('click', () => {
      restartGame();
      document.body.removeChild(messageContainer);
    });
  }

  // Restart the game
  function restartGame() {
    // Reset global metrics
    globalMetricsData.ipi = 100;
    globalMetricsData.propaganda = 100;
    globalMetricsData.solidarity = 0;
    
    // Reset all cities
    globalCities.forEach(city => {
      city.ipi = Math.floor(Math.random() * 11) + 85; // 85-95
      city.propaganda = Math.floor(Math.random() * 16) + 85; // 85-100
      city.solidarity = Math.floor(Math.random() * 11); // 0-10
    });
    
    // Update metrics display
    updateGlobalMetrics();
    
    // If a city is selected, update its metrics display
    const cityDropdown = document.getElementById('cityDropdown');
    if (cityDropdown && cityDropdown.value) {
      const selectedCity = globalCities.find(city => city.name === cityDropdown.value);
      if (selectedCity) {
        updateCityMetrics(selectedCity);
      }
    }
    
    // Reset achievements
    Object.keys(achievements).forEach(key => {
      achievements[key].unlocked = false;
    });
    
    // Reset performed actions
    Object.keys(performedActions).forEach(key => {
      performedActions[key] = 0;
    });
    
    // Reload the page to reset all game systems
    window.location.reload();
  }

  // Add achievement system
  const achievements = {
    firstProtest: { unlocked: false, name: "First Protest", description: "Organized your first protest" },
    globalStrike: { unlocked: false, name: "Global Strike", description: "Organized strikes in 10+ cities" },
    propagandaBuster: { unlocked: false, name: "Propaganda Buster", description: "Reduced global propaganda below 75%" },
    solidarityBuilder: { unlocked: false, name: "Solidarity Builder", description: "Increased global solidarity above 25%" },
    revolutionaryCell: { unlocked: false, name: "Revolutionary Cell", description: "Established your first revolutionary cell" },
    secretNetwork: { unlocked: false, name: "Secret Network", description: "Built a revolutionary network with 3+ cells" },
    secureOperations: { unlocked: false, name: "Secure Operations", description: "Maintained revolutionary secrecy above 90%" },
    wellPrepared: { unlocked: false, name: "Well Prepared", description: "Reached 75% preparation for revolutionary action" }
  };

  // Check achievements
  function checkAchievements() {
    // Check for First Protest
    if (!achievements.firstProtest.unlocked && performedActions.protest >= 1) {
      unlockAchievement('firstProtest');
    }
    
    // Check for Global Strike
    if (!achievements.globalStrike.unlocked && performedActions.strike >= 10) {
      unlockAchievement('globalStrike');
    }
    
    // Check for Propaganda Buster
    if (!achievements.propagandaBuster.unlocked && globalMetricsData.propaganda < 75) {
      unlockAchievement('propagandaBuster');
    }
    
    // Check for Solidarity Builder
    if (!achievements.solidarityBuilder.unlocked && globalMetricsData.solidarity > 25) {
      unlockAchievement('solidarityBuilder');
    }
    
    // Check for coup planning achievements if coupPlanner is available
    if (typeof coupPlanner !== 'undefined') {
      // Check for Revolutionary Cell
      if (!achievements.revolutionaryCell.unlocked && coupPlanner.getCellsCount() >= 1) {
        unlockAchievement('revolutionaryCell');
      }
      
      // Check for Secret Network
      if (!achievements.secretNetwork.unlocked && coupPlanner.getCellsCount() >= 3) {
        unlockAchievement('secretNetwork');
      }
      
      // Check for Secure Operations
      if (!achievements.secureOperations.unlocked && 
          coupPlanner.isActive() && 
          coupPlanner.getSecrecy() >= 90) {
        unlockAchievement('secureOperations');
      }
      
      // Check for Well Prepared
      if (!achievements.wellPrepared.unlocked && 
          coupPlanner.isActive() && 
          coupPlanner.getPreparation() >= 75) {
        unlockAchievement('wellPrepared');
      }
      
      // Check for revolutionary win condition
      if (coupPlanner.isActive() && 
          coupPlanner.getCellsCount() >= 5 && 
          coupPlanner.getPreparation() >= 95 && 
          coupPlanner.getSecrecy() >= 80 && 
          coupPlanner.getLeadCity() !== null) {
        // Conditions are met for a successful revolution!
        // This check allows the Execute button to be enabled in the coup planner
      }
    }
  }

  // Track performed actions
  const performedActions = {
    protest: 0,
    strike: 0,
    network: 0,
    sabotage: 0
  };

  // Display achievement notification
  function unlockAchievement(achievementId) {
    achievements[achievementId].unlocked = true;
    const achievement = achievements[achievementId];
    
    // Use the new global notification system
    showToast(
      `🏆 ${achievement.name}`,
      achievement.description,
      'achievement',
      10000 // 10 seconds for achievements
    );
  }
  
  // Public methods
  return {
    checkGameState,
    triggerWin,
    triggerLose,
    checkAchievements,
    restartGame,
    unlockAchievement,
    performedActions
  };
})();

// Run achievement check periodically
setInterval(() => {
  gameLogic.checkAchievements();
}, 5000);
