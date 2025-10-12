document.addEventListener('DOMContentLoaded', () => {
  const controlToggles = document.querySelectorAll('.control-toggle');
  const controlPanels = document.querySelectorAll('.control-panel');

  controlToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const targetPanelId = toggle.getAttribute('data-target');
      const targetPanel = document.getElementById(targetPanelId);

      // Close all other panels
      controlPanels.forEach(panel => {
        if (panel.id !== targetPanelId) {
          panel.classList.remove('active');
        }
      });

      // Toggle the target panel
      if (targetPanel) {
        targetPanel.classList.toggle('active');
      }
    });
  });

  // Close panels if user clicks outside
  window.addEventListener('click', (e) => {
    if (!e.target.closest('.control-block')) {
      controlPanels.forEach(panel => {
        panel.classList.remove('active');
      });
    }
  });
});