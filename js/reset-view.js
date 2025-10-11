document.addEventListener('DOMContentLoaded', () => {
    const resetViewButton = document.querySelector('.reset-view-button');

    if (resetViewButton) {
        resetViewButton.addEventListener('click', () => {
            if (window.map) {
                window.map.setView([20, 0], 2);
            }
        });
    }
});