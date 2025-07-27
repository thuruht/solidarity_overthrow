# Solidarity Overthrow

A strategic web-based game where citizens of the world cooperatively end imperialism through collective action and revolutionary planning.

## Game Overview

In Solidarity Overthrow, players work to increase global solidarity and decrease the Imperialist Power Index (IPI) across the world. The game features an interactive world map with cities that can be influenced through various collective actions like protests, strikes, network building, and strategic sabotage.

### Core Mechanics

- **City Management**: Select cities from the dropdown and perform collective actions to change their metrics.
- **Global Metrics**: Track the Imperialist Power Index (IPI), Propaganda Level, and Solidarity Index worldwide.
- **Collective Actions**: Organize protests, strikes, build networks, and perform strategic sabotage.
- **Revolutionary Planning**: Organize a secret coup by establishing revolutionary cells in cities, maintaining secrecy, and preparing for coordinated action.
- **Achievements**: Unlock achievements as you make progress in the revolutionary struggle.

### Win Conditions

1. **IPI Victory**: Reduce the global Imperialist Power Index below 25%
2. **Solidarity Victory**: Increase global solidarity above 75%
3. **Truth Victory**: Reduce global propaganda below 25%
4. **Revolutionary Victory**: Successfully execute a revolutionary coup through careful planning and coordination

### Lose Conditions

1. **Defeat**: IPI rises to 95% while solidarity drops below 10%
2. **Coup Exposed**: Revolutionary network is discovered by authorities
3. **Revolution Failed**: Revolutionary action fails due to inadequate preparation

## Technical Details

- **Map**: Uses Leaflet.js for interactive world map
- **UI**: HTML/CSS with responsive design
- **Animations**: GSAP for marker animations and UI effects
- **Storage**: Browser's localStorage for game state
- **Tutorial**: Interactive introduction and help system

## Game Modules

- **main.js**: Coordinates all game components and manages global state
- **globalCities.js**: Contains data for all cities in the game
- **additionalCities.js**: Additional cities for better global coverage
- **solid0p1.js**: Map initialization and marker setup
- **solid0p2.js**: City selection, marker placement, and city popups
- **solid0p3.js**: Batch city updates and retaliation system
- **gameLogic.js**: Win/lose conditions and achievement system
- **coupPlanner.js**: Revolutionary coup planning system
- **intro.js**: Tutorial and help system

## New User Experience

The game now features a comprehensive introduction system for new players:

1. **Splash Screen**: Players are greeted with a splash screen offering options to start the game, view the tutorial, or access the game guide.
2. **Interactive Tutorial**: A step-by-step walkthrough of game mechanics, with informative slides explaining core concepts.
3. **In-game Help**: An accessible help panel available at any time via the "?" button or by pressing the "?" key.
4. **Quick Tips**: First-time players receive contextual tips as they begin playing.
5. **Action Guidance**: Clear labeling of city-specific vs. collective actions to avoid confusion.

## Revolutionary Coup Planning

The coup planning system allows players to:

1. Establish revolutionary cells in cities with high solidarity
2. Improve security measures to prevent detection
3. Accelerate preparation for the revolutionary action
4. Select a lead city to coordinate the revolution
5. Execute the revolutionary coup when conditions are met

Successful coups require:
- At least 5 established cells
- 95% or higher preparation level
- 80% or higher secrecy level
- A designated lead city

## Getting Started

1. Clone the repository
2. Open index.html in a modern web browser
3. Follow the interactive tutorial to learn the game mechanics
4. Select cities from the dropdown and perform collective actions
5. Monitor global metrics in the top bar
6. When solidarity is high enough, start planning your revolutionary coup
7. Achieve victory through one of the four win conditions

## Credits

Developed as a cooperative simulation to educate about global solidarity movements and collective action.

## Version History

- **1.0.0**: Initial release
- **1.0.1**: Added more cities and fixed map interactions
- **1.0.2**: Implemented coup planning system
- **1.0.3**: Added weather integration and UI improvements
- **1.0.4**: Mobile layout fixes and marker optimizations
- **1.0.5**: Fixed collective action mechanics and improved feedback
- **1.1.0**: Added tutorial, help system, and improved new user experience
