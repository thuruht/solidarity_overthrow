import { initialCities } from "./globalCities.js";

let state = {
    cities: [...initialCities],
    metrics: {
        totalSolidarity: 0,
        averageIPI: 0,
        averagePropaganda: 0,
        citiesCount: 0,
        totalPopulation: 0
    }
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
    state.metrics = newMetrics;
}

export function updateCity(cityName, newCityProperties) {
    const currentCities = getCities();
    const cityIndex = currentCities.findIndex(city => city.name === cityName);

    if (cityIndex !== -1) {
        const updatedCity = { ...currentCities[cityIndex], ...newCityProperties };
        const newCities = [...currentCities];
        newCities[cityIndex] = updatedCity;
        setCities(newCities);
    } else {
        console.warn(`City with name ${cityName} not found.`);
    }
}

export function addCity(newCity) {
    const currentCities = getCities();
    const newCities = [...currentCities, newCity];
    setCities(newCities);
}


export function applyLoadedState(loadedState) {
    if (loadedState && loadedState.cities && loadedState.metrics) {
        setCities(loadedState.cities);
        setMetrics(loadedState.metrics);
        console.log("Loaded game state applied.");
    } else {
        console.error("Invalid loaded state provided.");
    }
}

export function resetGameState() {
    setCities([]);
    setMetrics({
        totalSolidarity: 0,
        averageIPI: 0,
        averagePropaganda: 0,
        citiesCount: 0,
        totalPopulation: 0
    });
    console.log("Game state reset.");
}
