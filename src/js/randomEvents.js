// js/randomEvents.js - Random Events System
import { getCities, getMetrics, setCities, setMetrics, updateCity } from "./gameState.js";
import { showToast } from "./notifications.js";
import { updateCityVisuals } from "./cityInteractions.js";

const randomEvents = [
  {
    title: "Economic Boom",
    description:
      "A sudden economic boom in a random city has distracted the populace, slightly reducing solidarity.",
    effect: () => {
      const city =
        getCities()[Math.floor(Math.random() * getCities().length)];
      const newSolidarity = Math.max(0, city.solidarity - 5);
      updateCity(city.name, { solidarity: newSolidarity });
      showToast(
        "Economic Boom",
        `A sudden economic boom in ${city.name} has distracted the populace, slightly reducing solidarity.`,
        "warning"
      );
      updateCityVisuals(city.name);
    },
  },
  {
    title: "Viral Video",
    description:
      "A viral video exposing state corruption has boosted solidarity in a random city.",
    effect: () => {
      const city =
        getCities()[Math.floor(Math.random() * getCities().length)];
      const newSolidarity = Math.min(100, city.solidarity + 5);
      updateCity(city.name, { solidarity: newSolidarity });
      showToast(
        "Viral Video",
        `A viral video exposing state corruption has boosted solidarity in ${city.name}.`,
        "info"
      );
      updateCityVisuals(city.name);
    },
  },
  {
    title: "Successful Propaganda",
    description:
      "A new state-sponsored propaganda campaign has been unusually effective, increasing global propaganda levels.",
    effect: () => {
      // Affect 3 to 5 random cities to make the effect persistent
      const affectedCities = [];
      const currentCities = getCities(); // Get current state cities once
      for (let i = 0; i < Math.floor(Math.random() * 3) + 3; i++) {
        const city =
          currentCities[Math.floor(Math.random() * currentCities.length)];
        const newPropaganda = Math.min(100, city.propaganda + 5);
        updateCity(city.name, { propaganda: newPropaganda });
        updateCityVisuals(city.name);
        affectedCities.push(city.name);
      }
      showToast(
        "Successful Propaganda",
        `A new state propaganda campaign has been effective in: ${affectedCities
          .slice(0, 2)
          .join(", ")}...`,
        "error"
      );
    },
  },
  {
    title: "International Aid",
    description:
      "An international aid package has improved conditions in a random city, slightly increasing solidarity.",
    effect: () => {
      const city =
        getCities()[Math.floor(Math.random() * getCities().length)];
      const newSolidarity = Math.min(100, city.solidarity + 3);
      updateCity(city.name, { solidarity: newSolidarity });
      showToast(
        "International Aid",
        `An international aid package has improved conditions in ${city.name}, slightly increasing solidarity.`,
        "info"
      );
      updateCityVisuals(city.name);
    },
  },
  {
    title: "State Crackdown",
    description:
      "The state has launched a crackdown on dissent in a high-solidarity city, reducing solidarity and increasing IPI.",
    effect: () => {
      const highSolidarityCities = getCities().filter(
        (c) => c.solidarity > 30
      );
      if (highSolidarityCities.length > 0) {
        const city =
          highSolidarityCities[
            Math.floor(Math.random() * highSolidarityCities.length)
          ];
        const newSolidarity = Math.max(0, city.solidarity - 10);
        const newIpi = Math.min(100, city.ipi + 5);
        updateCity(city.name, { solidarity: newSolidarity, ipi: newIpi });
        showToast(
          "State Crackdown",
          `The state has launched a crackdown on dissent in ${city.name}, reducing solidarity and increasing IPI.`,
          "error"
        );
        updateCityVisuals(city.name);
      }
    },
  },
];

export function triggerRandomEvent() {
  const event = randomEvents[Math.floor(Math.random() * randomEvents.length)];
  event.effect();
}

export function initRandomEvents() {
  // This function is now just a placeholder. The game loop handles timing.
  console.log("Random events system initialized.");
}
