document.addEventListener('DOMContentLoaded', function() {
    // Check for skipIntro parameter
    const urlParams = new URLSearchParams(window.location.search);
    const skipIntro = urlParams.get('skipIntro') === 'true';

    // Combine city data from different files
    mergeAdditionalCities();

    // Initialize the game map
    const map = L.map('map', {
        center: [20, 0],
        zoom: 2,
        minZoom: 2,
        maxZoom: 6,
        worldCopyJump: true,
        attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    }).addTo(map);

    // Initialize various game components
    initializeCityMarkers(map);
    initializeGameLogic(map);
    initializeRandomEvents(map);
    initializeControls(map);

    // Initialize notification and log systems
    window.initializeLog();
    window.initializeProgressTrackers();

    // Start the game, skipping intro if specified
    if (skipIntro) {
        document.getElementById('intro-splash').style.display = 'none';
        startGame(map);
    } else {
        // Event listener for the start button in the intro
        const startButton = document.getElementById('start-game-btn');
        if (startButton) {
            startButton.addEventListener('click', () => {
                document.getElementById('intro-splash').style.display = 'none';
                startGame(map);
            });
        }
    }
});

function mergeAdditionalCities() {
    if (typeof additionalCities !== 'undefined' && Array.isArray(additionalCities)) {
        // Use push to add elements to the existing array, which is more robust
        globalCities.push(...additionalCities);
    }
}

function initializeControls(map) {
    const controlToggles = document.querySelectorAll('.control-toggle');
    let activePanel = null;

    controlToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const targetPanelId = this.getAttribute('data-target');
            const targetPanel = document.getElementById(targetPanelId);

            // Deactivate previously active toggle and hide its panel
            const currentActiveToggle = document.querySelector('.control-toggle.active');
            if (currentActiveToggle && currentActiveToggle !== this) {
                currentActiveToggle.classList.remove('active');
                const currentActivePanelId = currentActiveToggle.getAttribute('data-target');
                document.getElementById(currentActivePanelId).style.display = 'none';
            }

            // Toggle current button and panel
            this.classList.toggle('active');
            if (this.classList.contains('active')) {
                targetPanel.style.display = 'block';
                activePanel = targetPanel;
                // Special handling for panels that need dynamic content
                if (targetPanelId === 'legend-panel') {
                    updateGlobalMetrics();
                }
            } else {
                targetPanel.style.display = 'none';
                activePanel = null;
            }
        });
    });

    // Close panel if clicking outside
    document.addEventListener('click', function(event) {
        if (activePanel && !activePanel.contains(event.target) && !event.target.closest('.control-toggle')) {
            const currentActiveToggle = document.querySelector('.control-toggle.active');
            if (currentActiveToggle) {
                currentActiveToggle.classList.remove('active');
                activePanel.style.display = 'none';
                activePanel = null;
            }
        }
    });

    // Initialize city search
    initializeCitySearch(map);
    // Initialize collective actions
    initializeCollectiveActions(map);
}

function updateGlobalMetrics() {
    const metricsContainer = document.querySelector('#legend-panel .global-metrics');
    if (!metricsContainer) return;

    const ipi = window.totalIPI;
    const propaganda = window.totalPropaganda;
    const solidarity = window.totalSolidarity;

    metricsContainer.innerHTML = `
        <span><span class="material-icons">military_tech</span> IPI: <strong>${ipi.toFixed(2)}%</strong></span>
        <span><span class="material-icons">campaign</span> Propaganda: <strong>${propaganda.toFixed(2)}%</strong></span>
        <span><span class="material-icons">groups</span> Solidarity: <strong>${solidarity.toFixed(2)}%</strong></span>
    `;

    // Update progress trackers
    if (window.updateProgress) {
        window.updateProgress('solidarity', solidarity);
        window.updateProgress('ipi', ipi);
    }
}

function updateSelectedCityMetrics(city) {
    const metricsContainer = document.querySelector('#selected-city-panel .city-metrics');
    if (!metricsContainer) return;

    if (city) {
        metricsContainer.innerHTML = `
            <h4>${city.name}</h4>
            <p>IPI: ${city.ipi.toFixed(2)}%</p>
            <p>Propaganda: ${city.propaganda.toFixed(2)}%</p>
            <p>Solidarity: ${city.solidarity.toFixed(2)}%</p>
        `;
    } else {
        metricsContainer.innerHTML = `<p>No city selected.</p>`;
    }
}

function initializeCitySearch(map) {
    const citySearchInput = document.getElementById('citySearch');
    const searchResultsContainer = document.getElementById('city-search-results');

    citySearchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        searchResultsContainer.innerHTML = ''; // Clear previous results

        if (searchTerm.length === 0) {
            return;
        }

        const filteredCities = globalCities.filter(city => city.name.toLowerCase().includes(searchTerm));

        filteredCities.forEach(city => {
            const resultItem = document.createElement('div');
            resultItem.classList.add('search-result-item');
            resultItem.textContent = city.name;
            resultItem.addEventListener('click', () => {
                map.flyTo([city.lat, city.lon], 6);
                updateSelectedCityMetrics(city);
                this.value = city.name; // Populate input with selected city
                searchResultsContainer.innerHTML = ''; // Clear results
                // Close the panel after selection
                const toggle = document.querySelector('.control-toggle[data-target="city-search-panel"]');
                if (toggle) {
                    toggle.click();
                }
            });
            searchResultsContainer.appendChild(resultItem);
        });
    });
}

function initializeCollectiveActions(map) {
    const dropdown = document.getElementById('collectiveActionsDropdown');
    dropdown.addEventListener('change', function() {
        const action = this.value;
        if (action) {
            performCollectiveAction(action, map);
            this.value = ''; // Reset dropdown
            // Close the panel after selection
            const toggle = document.querySelector('.control-toggle[data-target="do-your-part-panel"]');
            if (toggle) {
                toggle.click();
            }
        }
    });
}

function startGame(map) {
    // This function is called after the intro is dismissed
    console.log("Game has started!");
    // You can trigger any post-intro game mechanics here
    startRandomEvents();
}

// Make key functions globally accessible if they are called from other scripts
window.updateGlobalMetrics = updateGlobalMetrics;
window.updateSelectedCityMetrics = updateSelectedCityMetrics;