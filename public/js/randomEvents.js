// js/randomEvents.js - Random Events System

const randomEvents = [
    {
        title: "Economic Boom",
        description: "A sudden economic boom in a random city has distracted the populace, slightly reducing solidarity.",
        effect: () => {
            const city = globalCities[Math.floor(Math.random() * globalCities.length)];
            city.solidarity = Math.max(0, city.solidarity - 5);
            showToast("Economic Boom", `A sudden economic boom in ${city.name} has distracted the populace, slightly reducing solidarity.`, "warning");
            updateCityVisuals(city);
        }
    },
    {
        title: "Viral Video",
        description: "A viral video exposing state corruption has boosted solidarity in a random city.",
        effect: () => {
            const city = globalCities[Math.floor(Math.random() * globalCities.length)];
            city.solidarity = Math.min(100, city.solidarity + 5);
            showToast("Viral Video", `A viral video exposing state corruption has boosted solidarity in ${city.name}.`, "info");
            updateCityVisuals(city);
        }
    },
    {
        title: "Successful Propaganda",
        description: "A new state-sponsored propaganda campaign has been unusually effective, increasing global propaganda levels.",
        effect: () => {
            globalMetricsData.propaganda = Math.min(100, globalMetricsData.propaganda + 3);
            showToast("Successful Propaganda", "A new state-sponsored propaganda campaign has been unusually effective, increasing global propaganda levels.", "error");
        }
    },
    {
        title: "International Aid",
        description: "An international aid package has improved conditions in a random city, slightly increasing solidarity.",
        effect: () => {
            const city = globalCities[Math.floor(Math.random() * globalCities.length)];
            city.solidarity = Math.min(100, city.solidarity + 3);
            showToast("International Aid", `An international aid package has improved conditions in ${city.name}, slightly increasing solidarity.`, "info");
            updateCityVisuals(city);
        }
    },
    {
        title: "State Crackdown",
        description: "The state has launched a crackdown on dissent in a high-solidarity city, reducing solidarity and increasing IPI.",
        effect: () => {
            const highSolidarityCities = globalCities.filter(c => c.solidarity > 30);
            if (highSolidarityCities.length > 0) {
                const city = highSolidarityCities[Math.floor(Math.random() * highSolidarityCities.length)];
                city.solidarity = Math.max(0, city.solidarity - 10);
                city.ipi = Math.min(100, city.ipi + 5);
                showToast("State Crackdown", `The state has launched a crackdown on dissent in ${city.name}, reducing solidarity and increasing IPI.`, "error");
                updateCityVisuals(city);
            }
        }
    }
];

function triggerRandomEvent() {
    const event = randomEvents[Math.floor(Math.random() * randomEvents.length)];
    event.effect();
    updateGlobalMetrics();
}

function initRandomEvents() {
    // Trigger a random event every 2 minutes (120000 ms)
    setInterval(triggerRandomEvent, 120000);
    console.log("Random events system initialized.");
}