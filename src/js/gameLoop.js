// js/gameLoop.js
import { gameLogic } from "./gameLogic.js";
import { triggerRandomEvent } from "./randomEvents.js";
import { globalCities, globalMetricsData } from "./gameState.js";
import { updateGlobalMetrics } from "./main_new.js";

const gameLoopManager = (() => {
  let mainLoopIntervalId = null;
  const TICK_RATE = 1000; // Main game tick every 1 second

  // Timers for less frequent events, counted in ticks
  let randomEventTimer = 120; // 120 seconds
  let achievementCheckTimer = 5; // 5 seconds
  let gameStateCheckTimer = 10; // 10 seconds

  function tick() {
    // --- Every Tick: Calculate Global Metrics ---
    if (globalCities.length > 0) {
      let totalIpi = 0;
      let totalPropaganda = 0;
      let totalSolidarity = 0;

      // Single pass optimization
      for (const city of globalCities) {
        totalIpi += city.ipi;
        totalPropaganda += city.propaganda;
        totalSolidarity += city.solidarity;
      }

      globalMetricsData.ipi = totalIpi / globalCities.length;
      globalMetricsData.propaganda = totalPropaganda / globalCities.length;
      globalMetricsData.solidarity = totalSolidarity / globalCities.length;
    }

    // --- Less Frequent Updates ---

    // Check game state (win/loss)
    gameStateCheckTimer--;
    if (gameStateCheckTimer <= 0) {
      gameLogic.checkGameState();
      gameStateCheckTimer = 10; // Reset timer
    }

    // Check achievements
    achievementCheckTimer--;
    if (achievementCheckTimer <= 0) {
      gameLogic.checkAchievements();
      achievementCheckTimer = 5; // Reset timer
    }

    // Trigger random events
    randomEventTimer--;
    if (randomEventTimer <= 0) {
      triggerRandomEvent();
      randomEventTimer = 120; // Reset timer
    }
  }

  function start() {
    if (mainLoopIntervalId === null) {
      console.log("Starting main game loop...");
      mainLoopIntervalId = setInterval(tick, TICK_RATE);
    }
  }

  function stop() {
    if (mainLoopIntervalId !== null) {
      console.log("Stopping main game loop.");
      clearInterval(mainLoopIntervalId);
      mainLoopIntervalId = null;
    }
  }

  // Expose public methods
  return { start, stop };
})();

export { gameLoopManager };
