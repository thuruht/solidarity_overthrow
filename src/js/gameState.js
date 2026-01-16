import { initialCities } from "./globalCities.js";

let state = {
  cities: [...initialCities],
  metrics: {
    solidarity: 0,
    ipi: 0,
    propaganda: 0,
  },
};

export function getCities() {
  return state.cities;
}

export function getMetrics() {
  return state.metrics;
}

export function setCities(newCities) {
  state.cities = newCities;
}

export function setMetrics(newMetrics) {
  state.metrics = { ...state.metrics, ...newMetrics };
}

export function updateCity(cityName, newCityProperties) {
  const cityIndex = state.cities.findIndex((city) => city.name === cityName);
  if (cityIndex !== -1) {
    state.cities[cityIndex] = { ...state.cities[cityIndex], ...newCityProperties };
  } else {
    console.warn(`City ${cityName} not found`);
  }
}

export function addCity(newCity) {
  state.cities.push(newCity);
}

export function applyLoadedState(loadedState) {
  if (loadedState?.cities && loadedState?.metrics) {
    state.cities = loadedState.cities;
    state.metrics = loadedState.metrics;
    console.log("Game state loaded");
  } else {
    console.error("Invalid loaded state");
  }
}

export function resetGameState() {
  state.cities = [];
  state.metrics = { solidarity: 0, ipi: 0, propaganda: 0 };
  console.log("Game state reset");
}
