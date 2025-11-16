// Intro and tutorial system for Solidarity Overthrow

// Game state tracking
let gameStarted = false;
let tutorialComplete = false;
let currentSlide = 0;

let onStartCallback = () => {};

export function initializeIntro(startGameCallback) {
  onStartCallback = startGameCallback;

  // Initialize on window load
  const urlParams = new URLSearchParams(window.location.search);
  const skipIntro = urlParams.get("skipIntro");

  if (!skipIntro) {
    // Create splash screen
    createSplashScreen();
  } else {
    onGameStart();
  }

  // Create tutorial slides
  createTutorialSlides();

  // Create help panel
  createHelpPanel();

  // Add help button
  createHelpButton();

  // Load settings from localStorage
  loadSettings();
}

// Create and display the splash screen
function createSplashScreen() {
  const splashScreen = document.createElement("div");
  splashScreen.className = "splash-screen";
  splashScreen.id = "splash-screen";

  const title = document.createElement("h1");
  title.className = "splash-title";
  title.textContent = "S0LIDARITY 0VERTHR0W";

  const subtitle = document.createElement("p");
  subtitle.className = "splash-subtitle typing-text";
  subtitle.textContent =
    "Unite the world against imperialism through collective action and revolutionary planning";

  const buttonsContainer = document.createElement("div");
  buttonsContainer.className = "splash-buttons";

  // Start Game button
  const startButton = document.createElement("button");
  startButton.className = "splash-button";
  startButton.innerHTML =
    '<span class="material-icons">play_arrow</span> Start Game';
  startButton.addEventListener("click", startGame);

  // Tutorial button
  const tutorialButton = document.createElement("button");
  tutorialButton.className = "splash-button";
  tutorialButton.innerHTML =
    '<span class="material-icons">school</span> Tutorial';
  tutorialButton.addEventListener("click", startTutorial);

  // Help button
  const helpButton = document.createElement("button");
  helpButton.className = "splash-button";
  helpButton.innerHTML = '<span class="material-icons">help</span> Game Guide';
  helpButton.addEventListener("click", showHelp);

  // Credits button
  const creditsButton = document.createElement("button");
  creditsButton.className = "splash-button";
  creditsButton.innerHTML = '<span class="material-icons">info</span> Credits';
  creditsButton.addEventListener("click", showCredits);

  // Append all elements
  buttonsContainer.appendChild(startButton);
  buttonsContainer.appendChild(tutorialButton);
  buttonsContainer.appendChild(helpButton);
  buttonsContainer.appendChild(creditsButton);

  splashScreen.appendChild(title);
  splashScreen.appendChild(subtitle);
  splashScreen.appendChild(buttonsContainer);

  document.body.appendChild(splashScreen);

  // Animate entrance
  setTimeout(() => {
    title.classList.add("fade-in");
    setTimeout(() => {
      buttonsContainer.classList.add("fade-in-up");
    }, 500);
  }, 500);
}

// Shared function to initialize the game
function onGameStart() {
  gameStarted = true;

  onStartCallback();

  // If it's first time playing, show a quick tip
  if (!localStorage.getItem("hasPlayedBefore")) {
    setTimeout(showQuickTips, 2000);
    localStorage.setItem("hasPlayedBefore", "true");
  }
}

// Start the game
function startGame() {
  const splashScreen = document.getElementById("splash-screen");
  splashScreen.classList.add("hidden");

  // Remove splash screen after fade out
  setTimeout(() => {
    splashScreen.remove();
  }, 1000);

  onGameStart();
}

// Show quick tips for first-time players
function showQuickTips() {
  const tips = [
    "Click on city markers to view and take actions specific to that city.",
    "Use the 'Actions' panel in the top control bar to affect multiple cities at once.",
    "Build solidarity in cities first before attempting more radical actions.",
    "Watch out for state retaliation when you challenge the imperial power.",
    "Press '?' anytime to view the help panel.",
  ];

  tips.forEach((tip, index) => {
    setTimeout(() => {
      const feedback = document.getElementById("retaliation-feedback");
      if (feedback) {
        feedback.textContent = `TIP: ${tip}`;
        feedback.style.backgroundColor = "rgba(0, 100, 200, 0.8)";
        feedback.style.display = "block";

        // Hide feedback after 4 seconds
        setTimeout(() => (feedback.style.display = "none"), 4000);
      }
    }, index * 4500);
  });
}

// Start the tutorial
function startTutorial() {
  const splashScreen = document.getElementById("splash-screen");
  splashScreen.classList.add("hidden");

  const introSlides = document.getElementById("intro-slides");
  introSlides.classList.remove("hidden");

  showSlide(0); // Show first slide
}

// Create tutorial slides
function createTutorialSlides() {
  const slidesContainer = document.createElement("div");
  slidesContainer.className = "intro-slides hidden";
  slidesContainer.id = "intro-slides";

  // Define all tutorial slides
  const slides = [
    {
      title: "Welcome to Solidarity Overthrow",
      content: `
        <p>This game simulates a global movement to overcome imperialism through solidarity and collective action.</p>
        <p>Throughout this tutorial, you'll learn how to:</p>
        <ul>
          <li>Navigate the world map</li>
          <li>Perform city-specific and collective actions</li>
          <li>Build solidarity and decrease imperial power</li>
          <li>Plan and execute a revolutionary coup</li>
        </ul>
      `,
    },
    {
      title: "Understanding the Map",
      content: `
        <p>The interactive world map shows cities where you can build solidarity.</p>
        <p>Each marker represents a city with its own metrics:</p>
        <ul>
          <li><strong>Imperialist Power Index (IPI)</strong>: How much imperial control exists</li>
          <li><strong>Solidarity</strong>: How united the people are against imperialism</li>
          <li><strong>Propaganda</strong>: How effective state propaganda is in the city</li>
        </ul>
        <p>The color of city markers indicates solidarity level:</p>
        <ul>
          <li><span style="color: red">Red</span>: Low solidarity (0-20%)</li>
          <li><span style="color: orange">Orange</span>: Moderate solidarity (20-50%)</li>
          <li><span style="color: gold">Gold</span>: High solidarity (50-80%)</li>
          <li><span style="color: #6B8E23">Green</span>: Very high solidarity (80-100%)</li>
        </ul>
      `,
    },
    {
      title: "City-Specific Actions",
      content: `
        <p>You can take direct action in specific cities:</p>
        <ol>
          <li>Click on any city marker on the map</li>
          <li>A popup will appear with city metrics and weather</li>
          <li>At the bottom of the popup, you'll find action buttons</li>
          <li>Click an action button to affect only that city</li>
        </ol>
        <p>Available actions include:</p>
        <ul>
          <li><strong>Protest</strong>: Decreases IPI and propaganda, increases solidarity</li>
          <li><strong>Strike</strong>: Significantly decreases IPI, increases solidarity</li>
          <li><strong>Network</strong>: Greatly increases solidarity, slightly decreases propaganda</li>
          <li><strong>Sabotage</strong>: Drastically decreases IPI but increases propaganda and decreases solidarity</li>
        </ul>
      `,
    },
    {
      title: "Collective Actions",
      content: `
        <p>Collective actions affect multiple cities at once:</p>
        <ol>
          <li>Open the "Actions" panel in the top control bar.</li>
          <li>Select an action from the "Perform a collective action..." dropdown.</li>
          <li>The action will affect all cities with solidarity above 10%.</li>
        </ol>
        <p>Important notes about collective actions:</p>
        <ul>
          <li>The number of cities affected depends on global solidarity.</li>
          <li>Higher global solidarity means more coordinated action.</li>
          <li>Cities with higher solidarity are prioritized.</li>
          <li>The effectiveness increases with more cities involved.</li>
          <li>Watch for toast notifications showing which cities were affected.</li>
        </ul>
      `,
    },
    {
      title: "State Retaliation",
      content: `
        <p>As you challenge imperial power, the state will fight back:</p>
        <ul>
          <li>Actions that significantly decrease IPI may trigger retaliation</li>
          <li>Retaliation can take various forms: crackdowns, propaganda, arrests, etc.</li>
          <li>The state targets cities with high solidarity</li>
          <li>Retaliation effects vary depending on the type and can decrease solidarity, increase propaganda, or increase IPI</li>
          <li>When IPI is very low, the state may resort to desperate measures like military intervention</li>
        </ul>
        <p>Notifications will appear showing what type of retaliation occurred and which cities were affected.</p>
      `,
    },
    {
      title: "Revolutionary Planning",
      content: `
        <p>To win the game, you must organize a revolutionary coup:</p>
        <ol>
          <li>Build solidarity in multiple cities (ideally above 70%).</li>
          <li>Open the "Actions" panel; the "Plan Revolution" button will appear when conditions are right.</li>
          <li>Establish revolutionary cells in cities with high solidarity.</li>
          <li>Balance preparation speed with maintaining secrecy.</li>
          <li>Designate a lead city to coordinate the revolution.</li>
          <li>Execute the coup when preparation and secrecy are high enough.</li>
        </ol>
        <p>Requirements for a successful coup:</p>
        <ul>
          <li>At least 5 established revolutionary cells</li>
          <li>Preparation level of 95% or higher</li>
          <li>Secrecy level of 80% or higher</li>
          <li>A designated lead city</li>
        </ul>
      `,
    },
    {
      title: "Victory Conditions",
      content: `
        <p>There are multiple ways to win the game:</p>
        <ul>
          <li><strong>IPI Victory</strong>: Reduce global Imperialist Power Index below 25%</li>
          <li><strong>Solidarity Victory</strong>: Increase global solidarity above 75%</li>
          <li><strong>Truth Victory</strong>: Reduce global propaganda below 25%</li>
          <li><strong>Revolutionary Victory</strong>: Successfully execute a revolutionary coup</li>
        </ul>
        <p>The most challenging but rewarding is the Revolutionary Victory.</p>
        <p>You can lose the game if:</p>
        <ul>
          <li>IPI rises to 95% while solidarity drops below 10%</li>
          <li>Your revolutionary network is exposed</li>
          <li>Your revolutionary action fails due to poor preparation</li>
        </ul>
      `,
    },
    {
      title: "Ready to Begin?",
      content: `
        <p>You now understand the basics of Solidarity Overthrow!</p>
        <p>Remember:</p>
        <ul>
          <li>Start by building solidarity in key cities</li>
          <li>Use a mix of city-specific and collective actions</li>
          <li>Watch for and counter state retaliation</li>
          <li>Begin revolutionary planning when global solidarity is high</li>
        </ul>
        <p>Click "Start Game" to begin your revolutionary journey.</p>
        <p>You can access the help guide at any time by clicking the "?" button in the bottom-left corner.</p>
      `,
    },
  ];

  // Create each slide
  slides.forEach((slide, index) => {
    const slideDiv = document.createElement("div");
    slideDiv.className = "slide";
    slideDiv.id = `slide-${index}`;

    const header = document.createElement("h2");
    header.className = "slide-header";
    header.textContent = slide.title;

    const content = document.createElement("div");
    content.className = "slide-content";
    content.innerHTML = slide.content;

    const nav = document.createElement("div");
    nav.className = "slide-nav";

    const prevButton = document.createElement("button");
    prevButton.className = "slide-button prev";
    prevButton.innerHTML =
      '<span class="material-icons">arrow_back</span> Previous';
    prevButton.addEventListener("click", () => showSlide(index - 1));

    const nextButton = document.createElement("button");
    nextButton.className = "slide-button next";
    if (index === slides.length - 1) {
      nextButton.innerHTML =
        'Start Game <span class="material-icons">play_arrow</span>';
      nextButton.addEventListener("click", finishTutorial);
    } else {
      nextButton.innerHTML =
        'Next <span class="material-icons">arrow_forward</span>';
      nextButton.addEventListener("click", () => showSlide(index + 1));
    }

    nav.appendChild(prevButton);
    nav.appendChild(nextButton);

    slideDiv.appendChild(header);
    slideDiv.appendChild(content);
    slideDiv.appendChild(nav);

    slidesContainer.appendChild(slideDiv);
  });

  // Add slide indicators
  const indicators = document.createElement("div");
  indicators.className = "slide-indicator";

  slides.forEach((_, index) => {
    const dot = document.createElement("div");
    dot.className = "slide-dot";
    dot.addEventListener("click", () => showSlide(index));
    indicators.appendChild(dot);
  });

  slidesContainer.appendChild(indicators);
  document.body.appendChild(slidesContainer);
}

// Show a specific slide
function showSlide(index) {
  const slides = document.querySelectorAll(".slide");
  const dots = document.querySelectorAll(".slide-dot");

  // Validate index
  if (index < 0) index = 0;
  if (index >= slides.length) index = slides.length - 1;

  // Update current slide
  currentSlide = index;

  // Hide all slides
  slides.forEach((slide) => {
    slide.classList.remove("active");
  });

  // Show current slide
  slides[index].classList.add("active");

  // Update indicators
  dots.forEach((dot, i) => {
    dot.classList.toggle("active", i === index);
  });

  // Hide prev button on first slide
  const prevButton = slides[index].querySelector(".prev");
  if (prevButton) {
    prevButton.style.visibility = index === 0 ? "hidden" : "visible";
  }
}

// Finish tutorial and start game
function finishTutorial() {
  const introSlides = document.getElementById("intro-slides");
  introSlides.classList.add("hidden");

  setTimeout(() => {
    introSlides.remove();
    tutorialComplete = true;
  }, 500);
  onGameStart();
}

// Create help panel
function createHelpPanel() {
  const helpPanel = document.createElement("div");
  helpPanel.className = "help-panel";
  helpPanel.id = "help-panel";

  const header = document.createElement("div");
  header.className = "help-header";

  const title = document.createElement("h2");
  title.className = "help-title";
  title.textContent = "Game Guide";

  const closeButton = document.createElement("button");
  closeButton.className = "help-close";
  closeButton.innerHTML = "&times;";
  closeButton.addEventListener("click", hideHelp);

  header.appendChild(title);
  header.appendChild(closeButton);

  const tabs = document.createElement("div");
  tabs.className = "help-tabs";

  const tabTitles = ["Basics", "Actions", "Revolution", "Strategy", "About"];

  tabTitles.forEach((tabTitle, index) => {
    const tab = document.createElement("button");
    tab.className = "help-tab";
    if (index === 0) tab.classList.add("active");
    tab.textContent = tabTitle;
    tab.dataset.tab = `tab-${index}`;
    tab.addEventListener("click", (e) => {
      document
        .querySelectorAll(".help-tab")
        .forEach((t) => t.classList.remove("active"));
      document
        .querySelectorAll(".help-content")
        .forEach((c) => c.classList.remove("active"));
      e.target.classList.add("active");
      document
        .getElementById(`help-content-${e.target.dataset.tab}`)
        .classList.add("active");
    });
    tabs.appendChild(tab);
  });

  // Tab contents
  const contents = document.createElement("div");

  // Basics tab
  const basicsContent = document.createElement("div");
  basicsContent.className = "help-content active";
  basicsContent.id = "help-content-tab-0";
  basicsContent.innerHTML = `
    <h3>Game Overview</h3>
    <p>Solidarity Overthrow is a strategic game where you work to end imperialism through collective action and revolutionary planning.</p>
    
    <h3>Core Metrics</h3>
    <ul>
      <li><strong>Imperialist Power Index (IPI)</strong>: Represents the strength of imperial control. Your goal is to reduce this.</li>
      <li><strong>Solidarity</strong>: Represents the unity of people against imperialism. Higher solidarity enables more effective actions.</li>
      <li><strong>Propaganda</strong>: Represents the effectiveness of state misinformation. Reduces solidarity and increases IPI.</li>
    </ul>
    
    <h3>Map Navigation</h3>
    <ul>
      <li>Click and drag to move the map</li>
      <li>Use the zoom controls or mouse wheel to zoom in/out</li>
      <li>Click on city markers to view detailed information and take city-specific actions</li>
    </ul>
    
    <h3>City Selection</h3>
    <ul>
      <li>Open the "Search" panel in the top control bar.</li>
      <li>Type a city name to see a live list of results.</li>
      <li>Click a city to fly to it on the map.</li>
      <li>Selected city metrics appear in the "Selected City" panel.</li>
    </ul>
  `;

  // Actions tab
  const actionsContent = document.createElement("div");
  actionsContent.className = "help-content";
  actionsContent.id = "help-content-tab-1";
  actionsContent.innerHTML = `
    <h3>City-Specific Actions</h3>
    <p>These actions affect only one city and are accessed by clicking on a city marker:</p>
    <ul>
      <li><strong>Protest</strong>: -3 IPI, -2 Propaganda, +2 Solidarity</li>
      <li><strong>Strike</strong>: -5 IPI, +3 Solidarity</li>
      <li><strong>Network</strong>: +7 Solidarity, -1 Propaganda</li>
      <li><strong>Sabotage</strong>: -10 IPI, +4 Propaganda, -3 Solidarity</li>
    </ul>
    
    <h3>Collective Actions</h3>
    <p>These actions affect multiple cities and are accessed from the "Actions" panel in the top control bar:</p>
    <ul>
      <li><strong>Protest</strong>: Affects cities with solidarity > 10%</li>
      <li><strong>Strike</strong>: More effective with higher global solidarity</li>
      <li><strong>Network</strong>: Strengthens solidarity across many cities</li>
      <li><strong>Sabotage</strong>: Powerful but has negative side effects</li>
    </ul>
    <p>The number of cities affected depends on global solidarity levels.</p>
    
    <h3>State Retaliation</h3>
    <p>When you challenge imperial power, the state may retaliate:</p>
    <ul>
      <li><strong>Crackdown</strong>: Increases IPI, decreases solidarity</li>
      <li><strong>Propaganda</strong>: Increases propaganda levels</li>
      <li><strong>Arrests</strong>: Significantly decreases solidarity</li>
      <li><strong>Surveillance</strong>: Slightly increases IPI, decreases solidarity</li>
      <li><strong>Economic Sanctions</strong>: Decreases solidarity, increases propaganda</li>
      <li><strong>Military Intervention</strong>: Severely increases IPI, drastically decreases solidarity</li>
    </ul>
  `;

  // Revolution tab
  const revolutionContent = document.createElement("div");
  revolutionContent.className = "help-content";
  revolutionContent.id = "help-content-tab-2";
  revolutionContent.innerHTML = `
    <h3>Revolutionary Planning</h3>
    <p>To achieve a Revolutionary Victory, you must plan and execute a successful coup:</p>
    
    <h3>Establishing Revolutionary Cells</h3>
    <ul>
      <li>Select cities with high solidarity (preferably 70%+) to establish cells</li>
      <li>Each cell contributes to the revolution's strength</li>
      <li>You need at least 5 cells for a viable revolution</li>
    </ul>
    
    <h3>Preparation vs. Secrecy</h3>
    <ul>
      <li>Faster preparation increases the risk of detection</li>
      <li>Higher secrecy slows down preparation</li>
      <li>Balance both metrics for success</li>
      <li>You need 95%+ preparation and 80%+ secrecy to succeed</li>
    </ul>
    
    <h3>Lead City</h3>
    <ul>
      <li>Designate one city as the lead coordinator for the revolution</li>
      <li>The lead city should have very high solidarity (85%+)</li>
      <li>A strong lead city increases chances of success</li>
    </ul>
    
    <h3>Executing the Revolution</h3>
    <ul>
      <li>When preparation and secrecy are sufficient, execute the revolution</li>
      <li>Success depends on global solidarity, preparation level, and secrecy level</li>
      <li>A successful revolution achieves an immediate victory</li>
      <li>A failed attempt can lead to severe retaliation</li>
    </ul>
  `;

  // Strategy tab
  const strategyContent = document.createElement("div");
  strategyContent.className = "help-content";
  strategyContent.id = "help-content-tab-3";
  strategyContent.innerHTML = `
    <h3>Effective Strategies</h3>
    
    <h3>Early Game</h3>
    <ul>
      <li>Focus on building solidarity in key cities first</li>
      <li>Use Network actions to quickly increase solidarity</li>
      <li>Avoid Sabotage actions until solidarity is high</li>
      <li>Counter propaganda in cities before it becomes overwhelming</li>
    </ul>
    
    <h3>Mid Game</h3>
    <ul>
      <li>Begin using collective actions when many cities have solidarity > 30%</li>
      <li>Target cities with high IPI for protests and strikes</li>
      <li>Create a balanced approach across regions</li>
      <li>Be prepared for increasing state retaliation</li>
    </ul>
    
    <h3>Late Game</h3>
    <ul>
      <li>Start revolutionary planning when global solidarity reaches 50%+</li>
      <li>Ensure at least 8-10 cities have solidarity above 70%</li>
      <li>Prioritize secrecy over preparation speed initially</li>
      <li>Accelerate preparation only when secrecy is secure</li>
      <li>Execute the revolution when fully prepared, or pursue alternative victory conditions</li>
    </ul>
    
    <h3>Countering Retaliation</h3>
    <ul>
      <li>After major retaliation, focus on rebuilding solidarity in affected cities</li>
      <li>Use Network actions to counter propaganda increases</li>
      <li>If military intervention occurs, focus on other regions temporarily</li>
    </ul>
  `;

  // About tab
  const aboutContent = document.createElement("div");
  aboutContent.className = "help-content";
  aboutContent.id = "help-content-tab-4";
  aboutContent.innerHTML = `
    <h3>About Solidarity Overthrow</h3>
    <p>Solidarity Overthrow is a strategic web-based game where citizens of the world cooperatively end imperialism through collective action and revolutionary planning.</p>
    
    <h3>Game Concept</h3>
    <p>This game simulates the power of global solidarity movements in challenging imperial structures through various forms of resistance and organization.</p>
    
    <h3>Victory Conditions</h3>
    <ul>
      <li><strong>IPI Victory</strong>: Reduce global Imperialist Power Index below 25%</li>
      <li><strong>Solidarity Victory</strong>: Increase global solidarity above 75%</li>
      <li><strong>Truth Victory</strong>: Reduce global propaganda below 25%</li>
      <li><strong>Revolutionary Victory</strong>: Successfully execute a revolutionary coup</li>
    </ul>
    
    <h3>Credits</h3>
    <p>Developed as a cooperative simulation to educate about global solidarity movements and collective action.</p>
    
    <h3>Version</h3>
    <p>1.0.5</p>
  `;

  contents.appendChild(basicsContent);
  contents.appendChild(actionsContent);
  contents.appendChild(revolutionContent);
  contents.appendChild(strategyContent);
  contents.appendChild(aboutContent);

  helpPanel.appendChild(header);
  helpPanel.appendChild(tabs);
  helpPanel.appendChild(contents);

  document.body.appendChild(helpPanel);
}

// Create always-visible help button
function createHelpButton() {
  const helpButton = document.createElement("button");
  helpButton.className = "help-button";
  helpButton.id = "help-button";
  helpButton.innerHTML = "?";
  helpButton.title = "Show Game Guide";
  helpButton.addEventListener("click", showHelp);

  // Add keyboard shortcut
  document.addEventListener("keydown", (e) => {
    if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
      showHelp();
    }
  });

  document.body.appendChild(helpButton);
}

// Show help panel
function showHelp() {
  const helpPanel = document.getElementById("help-panel");
  helpPanel.style.display = "block";
}

// Hide help panel
function hideHelp() {
  const helpPanel = document.getElementById("help-panel");
  helpPanel.style.display = "none";
}

// Show credits
function showCredits() {
  const helpPanel = document.getElementById("help-panel");
  helpPanel.style.display = "block";

  // Switch to About tab
  document
    .querySelectorAll(".help-tab")
    .forEach((t) => t.classList.remove("active"));
  document
    .querySelectorAll(".help-content")
    .forEach((c) => c.classList.remove("active"));

  const aboutTab = document.querySelector('.help-tab[data-tab="tab-4"]');
  if (aboutTab) {
    aboutTab.classList.add("active");
    document.getElementById("help-content-tab-4").classList.add("active");
  }
}

// Load settings from localStorage
function loadSettings() {
  // Check if tutorial has been completed before
  if (localStorage.getItem("tutorialComplete") === "true") {
    tutorialComplete = true;
  }
}

// Save settings to localStorage
function saveSettings() {
  if (tutorialComplete) {
    localStorage.setItem("tutorialComplete", "true");
  }
}
