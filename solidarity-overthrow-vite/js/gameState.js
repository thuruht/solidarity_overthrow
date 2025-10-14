import { globalCities as initialCities } from "./globalCities.js";
import { additionalCities } from "./additionalCities.js";

function getInitialCities() {
  // Combine city data at initialization
  const allCities = [...initialCities, ...additionalCities];

  // Filter out duplicates by name, keeping the first occurrence
  const uniqueCityNames = new Set();
  return allCities.filter((city) => {
    if (uniqueCityNames.has(city.name)) {
      return false;
    }
    uniqueCityNames.add(city.name);
    return true;
  });
}

function getInitialMetrics() {
  return {
    ipi: 100,
    propaganda: 100,
    solidarity: 0,
  };
}

// These will hold the current, mutable state of the game.
export let globalCities = getInitialCities();
export let globalMetricsData = getInitialMetrics();

export function resetGameState() {
  globalCities = getInitialCities();
  globalMetricsData = getInitialMetrics();
}

export function applyLoadedState(loadedState) {
  // Overwrite the current state with the loaded data
  // A deep copy is important here to avoid reference issues.
  globalCities = JSON.parse(JSON.stringify(loadedState.cities));
  globalMetricsData = JSON.parse(JSON.stringify(loadedState.metrics));
}
