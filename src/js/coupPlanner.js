// Coup Planning and Execution Logic
import { gameLogic } from "./gameLogic.js";
import { getMetrics, getCities } from "./gameState.js";
import { showToast } from "./notifications.js";
import { updateProgress } from "./progress.js";
import { map } from "./main_new.js";

// Create a coupPlanner object to expose functions to other modules
export const coupPlanner = (() => {
  // Private variables
  const plan = {
    active: false,
    securityLevel: 100, // 0-100, lower is better (less detected)
    prepLevel: 0, // 0-100, higher is better
    cells: [], // Cities that are part of the coup network
    leadCity: null, // The city leading the coup
    requiredPrep: 75, // Prep level required to launch coup
    detectionRisk: 5, // Base risk of detection per turn (%)
    lastAction: null, // Timestamp of last coup-related action
    cooldown: 30000, // 30 seconds cooldown between coup actions
  };

  // Initialize coup planning system
  function initialize() {
    // Add coup button to sidebar if prep conditions are met
    checkCoupPlanningAvailability();

    // Set up event listener for coup planning panel toggle
    document.addEventListener("click", function (e) {
      if (e.target && e.target.id === "coup-plan-btn") {
        toggleCoupPlanningPanel();
      }
      if (e.target && e.target.id === "start-coup-planning") {
        startCoupPlanning();
      }
      if (e.target && e.target.id === "execute-coup") {
        executeCoup();
      }
      if (e.target && e.target.id === "cancel-coup") {
        cancelCoupPlanning();
      }
    });

    // Check for coup planning conditions periodically
    setInterval(checkCoupPlanningAvailability, 10000);
  }

  // Check if coup planning should be available based on global metrics
  function checkCoupPlanningAvailability() {
    const existingBtn = document.getElementById("coup-plan-btn");
    const actionsPanel = document.getElementById("do-your-part-panel");

    // Conditions for coup planning to become available
    const minSolidarity = 25; // Need at least 25% global solidarity
    const maxIPI = 85; // IPI should be weakened to max 85%

    if (
      getMetrics().solidarity >= minSolidarity &&
      getMetrics().ipi <= maxIPI
    ) {
      // Add button if it doesn't exist
      if (!existingBtn && actionsPanel) {
        const coupBtn = document.createElement("button");
        coupBtn.id = "coup-plan-btn";
        coupBtn.className = "action-btn coup-button"; // Use existing class for consistency
        coupBtn.innerHTML = `<span class="material-icons">vpn_key</span> Plan Revolution`;

        actionsPanel.appendChild(coupBtn);

        // Highlight button effect
        if (typeof gsap !== "undefined") {
          gsap.to(coupBtn, {
            backgroundColor: "#8B0000",
            duration: 1,
            repeat: 2,
            yoyo: true,
            onComplete: () => {
              gsap.to(coupBtn, {
                backgroundColor: "initial",
                duration: 0.5,
              });
            },
          });
        }

        // Show notification that revolution planning is available
        showToast(
          "Revolution Planning Available!",
          "You can now begin planning the final overthrow of the imperialist system."
        );
      }
    } else if (
      existingBtn &&
      (getMetrics().solidarity < minSolidarity ||
        getMetrics().ipi > maxIPI)
    ) {
      // Remove button if conditions no longer met
      existingBtn.remove();
    }
  }

  // Toggle the coup planning panel
  function toggleCoupPlanningPanel() {
    let panel = document.getElementById("coup-planning-panel");

    if (!panel) {
      // Create panel if it doesn't exist
      panel = document.createElement("div");
      panel.id = "coup-planning-panel";
      panel.className = "coup-panel";

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
      document
        .getElementById("close-panel")
        .addEventListener("click", function () {
          panel.remove();
        });
    } else {
      // Update panel with latest data if it exists
      if (plan.active) {
        updateCoupPlanningPanel(panel);
      }

      // Toggle visibility
      if (panel.style.display === "none") {
        panel.style.display = "block";
      } else {
        panel.style.display = "none";
      }
    }
  }

  // Update the coup planning panel with current status
  function updateCoupPlanningPanel(panel) {
    if (!panel) {
      panel = document.getElementById("coup-planning-panel");
      if (!panel) return;
    }

    // Create the cells list
    let cellsHTML = "";
    if (plan.cells.length === 0) {
      cellsHTML = "<p>No revolutionary cells established yet.</p>";
    } else {
      cellsHTML = '<ul class="cells-list">';
      plan.cells.forEach((cell) => {
        const city = getCities().find((c) => c.name === cell);
        const isLead = cell === plan.leadCity;

        cellsHTML += `<li class="${isLead ? "lead-cell" : ""}">
          ${cell} ${isLead ? "(Lead Cell)" : ""}
          <span class="cell-status">
            <span class="material-icons">group</span> ${
              city ? city.solidarity : "N/A"
            }%
          </span>
        </li>`;
      });
      cellsHTML += "</ul>";
    }

    // Show the current status of the coup planning
    panel.innerHTML = `
      <h3>Revolution Status</h3>
      <div class="status-bars">
        <div class="status-item">
          <label>Preparation: ${plan.prepLevel}%</label>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${
              plan.prepLevel
            }%; background-color: ${
      plan.prepLevel >= plan.requiredPrep ? "#6B8E23" : "#888"
    };"></div>
          </div>
        </div>
        <div class="status-item">
          <label>Security: ${plan.securityLevel}%</label>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${
              plan.securityLevel
            }%; background-color: ${
      plan.securityLevel < 30
        ? "red"
        : plan.securityLevel < 60
        ? "orange"
        : "#6B8E23"
    };"></div>
          </div>
        </div>
      </div>
      
      <h4>Revolutionary Cells</h4>
      ${cellsHTML}
      
      <div class="coup-actions">
        <button id="add-cell" class="action-btn" onclick="coupPlanner.openCellSelection()">Add Cell</button>
        <button id="improve-security" class="action-btn" onclick="coupPlanner.improveSecurity()">Improve Security</button>
        <button id="accelerate-prep" class="action-btn" onclick="coupPlanner.acceleratePrep()">Accelerate Prep</button>
        ${
          plan.leadCity
            ? ""
            : '<button id="designate-lead" class="action-btn" onclick="coupPlanner.selectLeadCity()">Select Lead City</button>'
        }
      </div>
      
      <div class="coup-execute">
        ${
          plan.prepLevel >= plan.requiredPrep && plan.leadCity
            ? '<button id="execute-coup" class="execute-btn">Execute Revolution!</button>'
            : '<button class="execute-btn disabled" disabled>Revolution Not Ready</button>'
        }
        <button id="cancel-coup" class="cancel-btn">Cancel Plans</button>
      </div>
      
      <button id="close-panel" class="action-btn">Close</button>
    `;

    // Re-add close button functionality
    document
      .getElementById("close-panel")
      .addEventListener("click", function () {
        panel.style.display = "none";
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

    showToast(
      "Revolution Planning Started",
      "Establish cells in strategic cities. Maintain secrecy."
    );

    // Update the planning panel
    toggleCoupPlanningPanel();
  }

  // Open the cell selection dialog
  function openCellSelection() {
    // Check cooldown
    if (!checkCoupActionCooldown()) return;

    // Filter cities that have high enough solidarity and aren't already cells
    const eligibleCities = getCities().filter(
      (city) => city.solidarity >= 50 && !plan.cells.includes(city.name)
    );

    if (eligibleCities.length === 0) {
      showToast(
        "No Eligible Cities",
        "You need cities with at least 50% solidarity to establish revolutionary cells."
      );
      return;
    }

    // Create and show the selection dialog
    const dialog = document.createElement("div");
    dialog.className = "selection-dialog";
    dialog.innerHTML = `
      <h3>Select City for Revolutionary Cell</h3>
      <p>Choose a city with high solidarity to establish a revolutionary cell.</p>
      <div class="city-list">
        ${eligibleCities
          .map(
            (city) =>
              `<div class="city-option" data-city="${city.name}">
            <span>${city.name}</span>
            <span>Solidarity: ${city.solidarity}%</span>
           </div>`
          )
          .join("")}
      </div>
      <button id="close-selection" class="action-btn">Cancel</button>
    `;

    document.body.appendChild(dialog);

    // Add event listeners to city options
    const cityOptions = dialog.querySelectorAll(".city-option");
    cityOptions.forEach((option) => {
      option.addEventListener("click", function () {
        const cityName = this.dataset.city;
        addCellToNetwork(cityName);
        dialog.remove();
      });
    });

    // Add close button functionality
    document
      .getElementById("close-selection")
      .addEventListener("click", function () {
        dialog.remove();
      });
  } // Add a city to the revolutionary network
  function addCellToNetwork(cityName) {
    // Update coup plan
    plan.cells.push(cityName);
    plan.lastAction = Date.now();

    // Increase preparation level
    const city = getCities().find((c) => c.name === cityName);
    const prepIncrease = Math.floor(city.solidarity / 10); // Higher solidarity = more prep
    plan.prepLevel = Math.min(100, plan.prepLevel + prepIncrease);
    updateProgress("revolution", plan.prepLevel);

    // Small security risk
    const securityDecrease = Math.floor(Math.random() * 5) + 1; // 1-5% decrease
    plan.securityLevel = Math.max(0, plan.securityLevel - securityDecrease);

    // Check if security is compromised
    if (plan.securityLevel <= 0) {
      coupPlanExposed();
      return;
    }

    // Check for achievement
    gameLogic.checkAchievements();

    // Update UI
    updateCoupPlanningPanel();

    // Zoom to the city on the map
    const cityData = getCities().find((c) => c.name === cityName);
    if (cityData && map) {
      map.setView([cityData.lat, cityData.lon], 6);
    }

    showToast(
      "Cell Established",
      `Revolutionary cell established in ${cityName}. Preparation +${prepIncrease}%, Security -${securityDecrease}%`
    );
  }

  // Select a lead city for the revolution
  function selectLeadCity() {
    // Check cooldown
    if (!checkCoupActionCooldown()) return;

    if (plan.cells.length === 0) {
      showToast(
        "No Cells Available",
        "You need to establish at least one revolutionary cell first."
      );
      return;
    }

    // Create and show the selection dialog
    const dialog = document.createElement("div");
    dialog.className = "selection-dialog";
    dialog.innerHTML = `
      <h3>Select Lead City for Revolution</h3>
      <p>Choose the city that will lead and coordinate the revolutionary action.</p>
      <div class="city-list">
        ${plan.cells
          .map((cellName) => {
            const city = getCities().find((c) => c.name === cellName);
            return `<div class="city-option" data-city="${cellName}">
            <span>${cellName}</span>
            <span>Solidarity: ${city ? city.solidarity : "N/A"}%</span>
           </div>`;
          })
          .join("")}
      </div>
      <button id="close-selection" class="action-btn">Cancel</button>
    `;

    document.body.appendChild(dialog);

    // Add event listeners to city options
    const cityOptions = dialog.querySelectorAll(".city-option");
    cityOptions.forEach((option) => {
      option.addEventListener("click", function () {
        const cityName = this.dataset.city;
        setLeadCity(cityName);
        dialog.remove();
      });
    });

    // Add close button functionality
    document
      .getElementById("close-selection")
      .addEventListener("click", function () {
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
    updateProgress("revolution", plan.prepLevel);

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

    // Zoom to the lead city on the map
    const cityData = getCities().find((c) => c.name === cityName);
    if (cityData && map) {
      map.setView([cityData.lat, cityData.lon], 6);
    }

    showToast(
      "Lead City Designated",
      `${cityName} has been designated as the lead city for the revolution. Preparation +${prepBoost}%, Security -${securityDecrease}%`
    );
  }

  // Improve security for the coup plan
  function improveSecurity() {
    // Check cooldown
    if (!checkCoupActionCooldown()) return;

    const securityImprovement = Math.floor(Math.random() * 15) + 10; // 10-25% increase
    plan.securityLevel = Math.min(
      100,
      plan.securityLevel + securityImprovement
    );
    plan.lastAction = Date.now();

    // Small negative impact on preparation
    const prepDecrease = Math.floor(Math.random() * 5) + 1; // 1-5% decrease
    plan.prepLevel = Math.max(0, plan.prepLevel - prepDecrease);
    updateProgress("revolution", plan.prepLevel);

    // Update UI
    updateCoupPlanningPanel();

    showToast(
      "Security Improved",
      `Improved operational security measures. Security +${securityImprovement}%, Preparation -${prepDecrease}%`
    );
  }

  // Accelerate preparation for the coup
  function acceleratePrep() {
    // Check cooldown
    if (!checkCoupActionCooldown()) return;

    const prepImprovement = Math.floor(Math.random() * 15) + 10; // 10-25% increase
    plan.prepLevel = Math.min(100, plan.prepLevel + prepImprovement);
    updateProgress("revolution", plan.prepLevel);
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

    showToast(
      "Preparation Accelerated",
      `Accelerated revolutionary preparations. Preparation +${prepImprovement}%, Security -${securityDecrease}%`
    );
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

    showToast(
      "Suspicion Increased",
      `The authorities are becoming suspicious of unusual activity. Security -${suspicionIncrease}%`,
      "warning"
    );
  }

  // Check if enough time has passed since the last coup action
  function checkCoupActionCooldown() {
    const now = Date.now();
    const timeSinceLastAction = now - plan.lastAction;

    if (timeSinceLastAction < plan.cooldown) {
      const remainingSeconds = Math.ceil(
        (plan.cooldown - timeSinceLastAction) / 1000
      );
      showToast(
        "Action Cooldown",
        `You must wait ${remainingSeconds} seconds before taking another revolutionary action.`,
        "warning"
      );
      return false;
    }

    return true;
  }

  // Execute the coup
  function executeCoup() {
    // Check required conditions
    if (plan.prepLevel < plan.requiredPrep || !plan.leadCity) {
      showToast(
        "Not Ready",
        "The revolution is not ready to be executed yet.",
        "warning"
      );
      return;
    }

    // Calculate success chance based on preparation, security, and global metrics
    const baseChance = plan.prepLevel;
    const securityModifier = plan.securityLevel / 100; // Higher security = better chance
    const solidarityModifier = getMetrics().solidarity / 50; // Higher solidarity = better chance
    const ipiModifier = (100 - getMetrics().ipi) / 50; // Lower IPI = better chance

    const successChance =
      baseChance * securityModifier * solidarityModifier * ipiModifier;

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
    const panel = document.getElementById("coup-planning-panel");
    if (panel) panel.style.display = "none";

    gameLogic.triggerWin("revolution");

    // Reset coup plan
    resetCoupPlan();
  }

  // The revolution fails
  function revolutionFailure() {
    // Hide coup planning panel if open
    const panel = document.getElementById("coup-planning-panel");
    if (panel) panel.style.display = "none";

    gameLogic.triggerLose("revolution_failed");

    // Reset coup plan
    resetCoupPlan();
  }

  // The coup plan is exposed by authorities
  function coupPlanExposed() {
    // Hide coup planning panel if open
    const panel = document.getElementById("coup-planning-panel");
    if (panel) panel.style.display = "none";

    gameLogic.triggerLose("coup_exposed");

    // Reset coup plan
    resetCoupPlan();
  }

  // Cancel coup planning
  function cancelCoupPlanning() {
    // Confirm cancellation
    if (
      !confirm(
        "Are you sure you want to cancel the revolutionary plans? All progress will be lost."
      )
    ) {
      return;
    }

    // Show cancellation message
    showToast(
      "Plans Canceled",
      "Revolutionary plans have been safely canceled and all traces removed."
    );

    // Reset coup plan
    resetCoupPlan();

    // Hide coup planning panel
    const panel = document.getElementById("coup-planning-panel");
    if (panel) panel.remove();
  }

  // Reset the coup plan
  function resetCoupPlan() {
    plan.active = false;
    plan.securityLevel = 100;
    plan.prepLevel = 0;
    plan.cells = [];
    plan.leadCity = null;

    // Update global metrics display
    updateGlobalMetrics();

    // Check if coup planning should be available
    checkCoupPlanningAvailability();
  }

  // Public API
  return {
    initialize,
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
    isActive: () => plan.active,
  };
})();
