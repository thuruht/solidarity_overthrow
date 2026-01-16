import { getMetrics, getCities, updateCity } from "./gameState.js";
import { updateGlobalMetrics } from "./uiControls.js";
import { showFeedback, updateCityVisuals } from "./cityInteractions.js";

// File: solid0p3.js

// This function will be called by main_new.js to set up collective actions
export function initializeCollectiveActions() {
  const collectiveActionsDropdown = document.getElementById(
    "collectiveActionsDropdown"
  );
  if (collectiveActionsDropdown) {
    collectiveActionsDropdown.addEventListener("change", function () {
      if (this.value) {
        performCollectiveAction(this.value);
        if (typeof gsap !== "undefined") {
          gsap.fromTo(
            this,
            { scale: 1 },
            { scale: 1.2, duration: 0.3, yoyo: true, repeat: 1 }
          );
        }
        this.value = ""; // Reset dropdown
      }
    });
  }
}

// Perform a collective action that affects multiple cities
function performCollectiveAction(actionType) {
  const globalSolidarity = getMetrics().solidarity;
  const potentialCities = getCities().filter((city) => city.solidarity > 10);

  if (potentialCities.length === 0) {
    showFeedback(
      "No cities have enough solidarity (>10%) for collective action!",
      "warning"
    );
    return;
  }

  const maxAffectedPercentage = Math.min(0.6, globalSolidarity / 100);
  const maxAffectableCount = Math.max(
    1,
    Math.floor(potentialCities.length * maxAffectedPercentage)
  );

  const sortedBySolidarity = [...potentialCities].sort(
    (a, b) => b.solidarity - a.solidarity
  );
  const affectedCities = sortedBySolidarity.slice(0, maxAffectableCount);

  const effectiveness =
    0.5 + affectedCities.length / Math.max(1, potentialCities.length);
  let actionFeedback = "";

  affectedCities.forEach((city) => {
    let ipiChange = 0,
      propagandaChange = 0,
      solidarityChange = 0;

    switch (actionType) {
      case "protest":
        ipiChange = -2 * effectiveness;
        propagandaChange = -1 * effectiveness;
        solidarityChange = 1 * effectiveness;
        actionFeedback = `Protests erupted in ${affectedCities.length} cities!`;
        break;
      case "strike":
        ipiChange = -4 * effectiveness;
        solidarityChange = 2 * effectiveness;
        actionFeedback = `Strikes in ${affectedCities.length} cities!`;
        break;
      case "network":
        solidarityChange = 5 * effectiveness;
        propagandaChange = -1 * effectiveness;
        actionFeedback = `Networks strengthened in ${affectedCities.length} cities!`;
        break;
      case "sabotage":
        ipiChange = -8 * effectiveness;
        propagandaChange = 3 * effectiveness;
        solidarityChange = -2 * effectiveness;
        actionFeedback = `Sabotage in ${affectedCities.length} cities!`;
        break;
    }

    const newIpi = Math.max(0, Math.min(100, city.ipi + ipiChange));
    const newPropaganda = Math.max(
      0,
      Math.min(100, city.propaganda + propagandaChange)
    );
    const newSolidarity = Math.max(
      0,
      Math.min(100, city.solidarity + solidarityChange)
    );

    updateCity(city.name, {
      ipi: newIpi,
      propaganda: newPropaganda,
      solidarity: newSolidarity,
    });

    updateCityVisuals(city.name);
  });

  showFeedback(actionFeedback, "success");
  updateGlobalMetrics();
  triggerStateRetaliation(actionType, affectedCities);
}

// Trigger state retaliation in response to collective actions
function triggerStateRetaliation(actionType, affectedCities) {
  const retaliationChance = Math.random() + (0.5 - getMetrics().ipi / 200);
  if (retaliationChance < 0.3) return;

  let retaliationType = "";
  let message = "";

  switch (actionType) {
    case "sabotage":
      retaliationType = "crackdown";
      message = "The state responds with a violent crackdown!";
      break;
    case "protest":
      retaliationType = Math.random() < 0.5 ? "propaganda" : "arrests";
      message =
        retaliationType === "propaganda"
          ? "State propaganda intensifies."
          : "Protest leaders are arrested!";
      break;
    case "strike":
      retaliationType = "economic_sanctions";
      message = "Economic penalties imposed on striking regions.";
      break;
    case "network":
      retaliationType = "surveillance";
      message = "State surveillance on networks increases.";
      break;
  }

  if (getMetrics().ipi < 50 && Math.random() < 0.2) {
    retaliationType = "military_intervention";
    message = "Military forces deployed to maintain control!";
  }

  if (retaliationType) {
    applyRetaliation(retaliationType, message);
  }
}

// Apply the effects of state retaliation
function applyRetaliation(type, message) {
  showFeedback(message, "danger");

  const targetCityCount = Math.floor(Math.random() * 5) + 3;
  const highSolidarityCities = getCities()
    .filter((c) => c.solidarity > 30)
    .sort(() => 0.5 - Math.random())
    .slice(0, targetCityCount);

  highSolidarityCities.forEach((city) => {
    let newIpi = city.ipi;
    let newSolidarity = city.solidarity;
    let newPropaganda = city.propaganda;

    switch (type) {
      case "crackdown":
        newIpi += 2;
        newSolidarity -= 5;
        break;
      case "propaganda":
        newPropaganda += 5;
        newSolidarity -= 1;
        break;
      case "arrests":
        newSolidarity -= 3;
        break;
      case "surveillance":
        newSolidarity -= 2;
        break;
      case "economic_sanctions":
        newSolidarity -= 4;
        newPropaganda += 2;
        break;
      case "military_intervention":
        newIpi += 10;
        newSolidarity -= 8;
        break;
    }

    updateCity(city.name, {
      ipi: newIpi,
      solidarity: newSolidarity,
      propaganda: newPropaganda,
    });

    updateCityVisuals(city.name);
  });

  updateGlobalMetrics();
}
