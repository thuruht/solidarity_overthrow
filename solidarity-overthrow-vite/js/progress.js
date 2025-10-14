let victoryConditions = {};

export function initializeProgressTrackers() {
  victoryConditions = {
    solidarity: { current: 0, target: 80, label: "Global Solidarity" },
    ipi: { current: 100, target: 20, label: "Weaken IPI" },
    revolution: { current: 0, target: 100, label: "Revolution Readiness" },
  };

  renderProgressTrackers(); // Initial render
}

export function updateProgress(condition, value) {
  if (victoryConditions[condition]) {
    victoryConditions[condition].current = value;
    renderProgressTrackers();
  }
}

function renderProgressTrackers() {
  const container = document.getElementById("progress-trackers");
  if (!container) return;

  let html = "<h4>Victory Progress</h4>";
  for (const key in victoryConditions) {
    const condition = victoryConditions[key];
    let percentage;
    if (key === "ipi") {
      // For IPI, progress is made as the value decreases
      percentage = Math.max(
        0,
        (100 * (100 - condition.current)) / (100 - condition.target)
      );
    } else {
      percentage = Math.min(100, (100 * condition.current) / condition.target);
    }

    html += `
            <div class="progress-bar-container">
                <div class="progress-bar-label">${condition.label}</div>
                <div class="progress-bar">
                    <div class="progress-bar-fill" style="width: ${percentage.toFixed(
                      2
                    )}%;"></div>
                </div>
            </div>
        `;
  }
  container.innerHTML = html;
}
