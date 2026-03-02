// js/gameLoop.js
import { gameLogic } from "./gameLogic.js";
import { triggerRandomEvent } from "./randomEvents.js";
import { getCities, getMetrics, setMetrics } from "./gameState.js";

const gameLoopManager = (() => {
  let mainLoopIntervalId = null;
  const TICK_RATE = 1000;

  let randomEventTimer = 120;
  let achievementCheckTimer = 5;
  let gameStateCheckTimer = 10;

  function tick() {
    const cities = getCities();
    if (cities.length === 0) return;

    // Calculate metrics in single pass
    let totalIpi = 0;
    let totalPropaganda = 0;
    let totalSolidarity = 0;

    // Gradual change per tick for all cities (passive progression/regression)
    // Make IPI naturally increase slowly, Solidarity decay if not maintained, Propaganda slightly decay
    const passiveIpiIncrease = 0.05;
    const passiveSolidarityDecay = 0.02;
    const passivePropagandaDecay = 0.01;

    for (const city of cities) {
      // Apply passive changes
      city.ipi = Math.max(0, Math.min(100, (city.ipi || 0) + passiveIpiIncrease));
      city.solidarity = Math.max(0, Math.min(100, (city.solidarity || 0) - passiveSolidarityDecay));
      city.propaganda = Math.max(0, Math.min(100, (city.propaganda || 0) - passivePropagandaDecay));

      totalIpi += city.ipi;
      totalPropaganda += city.propaganda;
      totalSolidarity += city.solidarity;
    }

    const count = cities.length;
    setMetrics({
      ipi: totalIpi / count,
      propaganda: totalPropaganda / count,
      solidarity: totalSolidarity / count,
    });

    // Periodic checks
    if (--gameStateCheckTimer <= 0) {
      gameLogic.checkGameState();
      gameStateCheckTimer = 10;
    }

    if (--achievementCheckTimer <= 0) {
      gameLogic.checkAchievements();
      achievementCheckTimer = 5;
    }

    if (--randomEventTimer <= 0) {
      triggerRandomEvent();
      randomEventTimer = 120;
    }
  }

  function start() {
    if (mainLoopIntervalId === null) {
      console.log("Starting game loop");
      mainLoopIntervalId = setInterval(tick, TICK_RATE);
    }
  }

  function stop() {
    if (mainLoopIntervalId !== null) {
      console.log("Stopping game loop");
      clearInterval(mainLoopIntervalId);
      mainLoopIntervalId = null;
    }
  }

  return { start, stop };
})();

export { gameLoopManager };
