// File: solid0p3.js

// This function will be called by main_new.js to set up collective actions
window.setupCollectiveActions = function() {
  const collectiveActionsDropdown = document.getElementById('collectiveActionsDropdown');
  if (collectiveActionsDropdown) {
    collectiveActionsDropdown.addEventListener('change', function () {
      if (this.value) {
        performCollectiveAction(this.value);
        if (typeof gsap !== 'undefined') {
          gsap.fromTo(this, { scale: 1 }, { scale: 1.2, duration: 0.3, yoyo: true, repeat: 1 });
        }
        this.value = ""; // Reset dropdown
      }
    });
  }
};

// Perform a collective action that affects multiple cities
function performCollectiveAction(actionType) {
  const globalSolidarity = window.globalMetricsData.solidarity;
  const potentialCities = globalCities.filter(city => city.solidarity > 10);

  if (potentialCities.length === 0) {
    showNotification("No cities have enough solidarity (>10%) for collective action!", 'warning');
    return;
  }

  const maxAffectedPercentage = Math.min(0.6, globalSolidarity / 100);
  const maxAffectableCount = Math.max(1, Math.floor(potentialCities.length * maxAffectedPercentage));

  const sortedBySolidarity = [...potentialCities].sort((a, b) => b.solidarity - a.solidarity);
  const affectedCities = sortedBySolidarity.slice(0, maxAffectableCount);

  const effectiveness = 0.5 + (affectedCities.length / Math.max(1, potentialCities.length));
  let actionFeedback = '';

  affectedCities.forEach(city => {
    let ipiChange = 0, propagandaChange = 0, solidarityChange = 0;

    switch (actionType) {
      case 'protest':
        ipiChange = -2 * effectiveness; propagandaChange = -1 * effectiveness; solidarityChange = 1 * effectiveness;
        actionFeedback = `Protests erupted in ${affectedCities.length} cities!`;
        break;
      case 'strike':
        ipiChange = -4 * effectiveness; solidarityChange = 2 * effectiveness;
        actionFeedback = `Strikes in ${affectedCities.length} cities!`;
        break;
      case 'network':
        solidarityChange = 5 * effectiveness; propagandaChange = -1 * effectiveness;
        actionFeedback = `Networks strengthened in ${affectedCities.length} cities!`;
        break;
      case 'sabotage':
        ipiChange = -8 * effectiveness; propagandaChange = 3 * effectiveness; solidarityChange = -2 * effectiveness;
        actionFeedback = `Sabotage in ${affectedCities.length} cities!`;
        break;
    }
    
    city.ipi = Math.max(0, Math.min(100, city.ipi + ipiChange));
    city.propaganda = Math.max(0, Math.min(100, city.propaganda + propagandaChange));
    city.solidarity = Math.max(0, Math.min(100, city.solidarity + solidarityChange));

    window.updateCityVisuals(city);
  });

  window.showNotification(actionFeedback, 'success');
  window.updateGlobalMetrics();
  triggerStateRetaliation(actionType, affectedCities);
}

// Trigger state retaliation in response to collective actions
function triggerStateRetaliation(actionType, affectedCities) {
  const retaliationChance = Math.random() + (0.5 - window.globalMetricsData.ipi / 200);
  if (retaliationChance < 0.3) return;

  let retaliationType = '';
  let message = '';

  switch (actionType) {
    case 'sabotage':
      retaliationType = 'crackdown';
      message = 'The state responds with a violent crackdown!';
      break;
    case 'protest':
      retaliationType = Math.random() < 0.5 ? 'propaganda' : 'arrests';
      message = retaliationType === 'propaganda' ? 'State propaganda intensifies.' : 'Protest leaders are arrested!';
      break;
    case 'strike':
      retaliationType = 'economic_sanctions';
      message = 'Economic penalties imposed on striking regions.';
      break;
    case 'network':
      retaliationType = 'surveillance';
      message = 'State surveillance on networks increases.';
      break;
  }

  if (window.globalMetricsData.ipi < 50 && Math.random() < 0.2) {
    retaliationType = 'military_intervention';
    message = 'Military forces deployed to maintain control!';
  }

  if (retaliationType) {
    applyRetaliation(retaliationType, message);
  }
}

// Apply the effects of state retaliation
function applyRetaliation(type, message) {
  showNotification(message, 'danger');

  const targetCityCount = Math.floor(Math.random() * 5) + 3;
  const highSolidarityCities = globalCities.filter(c => c.solidarity > 30)
                                           .sort(() => 0.5 - Math.random())
                                           .slice(0, targetCityCount);

  highSolidarityCities.forEach(city => {
    switch (type) {
      case 'crackdown': city.ipi += 2; city.solidarity -= 5; break;
      case 'propaganda': city.propaganda += 5; city.solidarity -= 1; break;
      case 'arrests': city.solidarity -= 3; break;
      case 'surveillance': city.solidarity -= 2; break;
      case 'economic_sanctions': city.solidarity -= 4; city.propaganda += 2; break;
      case 'military_intervention': city.ipi += 10; city.solidarity -= 8; break;
    }
    window.updateCityVisuals(city);
  });

  window.updateGlobalMetrics();
}