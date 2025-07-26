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
- **Animations**: GSAP for marker animations
- **Storage**: Browser's localStorage for game state

## Game Modules

- **main.js**: Coordinates all game components and manages global state
- **globalCities.js**: Contains data for all cities in the game
- **solid0p1.js**: Map initialization and marker setup
- **solid0p2.js**: City selection, marker placement, and city popups
- **solid0p3.js**: Batch city updates and retaliation system
- **gameLogic.js**: Win/lose conditions and achievement system
- **coupPlanner.js**: Revolutionary coup planning system

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
3. Select cities from the dropdown and perform collective actions
4. Monitor global metrics in the top bar
5. When solidarity is high enough, start planning your revolutionary coup
6. Achieve victory through one of the four win conditions

## Credits

Developed as a cooperative simulation to educate about global solidarity movements and collective action.
