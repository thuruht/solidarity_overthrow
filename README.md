# S0lidarity 0verthr0w

![Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

**S0lidarity 0verthr0w** is a global revolution simulator. Players take on the role of a revolutionary leader, coordinating actions across the globe to overthrow the existing order through solidarity, strategic actions, and resource management.

## 🌟 Features

*   **Global Map Simulation:** Interactive map powered by Leaflet.js, displaying cities with real-time metrics.
*   **Strategic Actions:** Organize protests, strikes, and networks to increase solidarity.
*   **Dynamic Events:** React to random events like crackdowns, media leaks, and natural disasters.
*   **Multiplayer Elements:** Global chat and leaderboards powered by Cloudflare Durable Objects.
*   **Progression:** Unlock achievements and save your progress.
*   **Authentication:** GitHub OAuth for secure login and profile management.
*   **Cloud Save:** Save your revolution's state to the cloud and resume from any device.

## 🛠 Tech Stack

*   **Frontend:** HTML5, CSS3, JavaScript (Modules), Vite
*   **Mapping:** Leaflet.js
*   **Backend:** Cloudflare Workers, Durable Objects, KV Storage, D1 Database
*   **Authentication:** GitHub OAuth
*   **Animations:** GSAP

## 🚀 Getting Started

### Prerequisites

*   **Node.js** (v18 or later)
*   **npm** (or yarn/pnpm)
*   **Wrangler** (Cloudflare CLI)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/solidarity-overthrow.git
    cd solidarity-overthrow
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment:**
    Create a `.dev.vars` file for local development secrets (do not commit this):
    ```
    GITHUB_CLIENT_ID=your_id
    GITHUB_CLIENT_SECRET=your_secret
    OWM_API_KEY=your_openweathermap_key
    ```

### Running Locally

1.  **Start the development server:**
    ```bash
    npm run dev
    ```
    This starts the Vite dev server and the Wrangler proxy.

2.  **Open your browser:**
    Navigate to `http://localhost:5173` (or the port shown in your terminal).

## 🎮 Gameplay Guide

### Core Metrics
*   **Solidarity:** The unity of the people. High solidarity unlocks powerful collective actions.
*   **IPI (Instability/Pressure Index):** The pressure on the ruling regime. Push this high to force change.
*   **Propaganda:** The regime's control over information. Reduce this to gain more support.

### Actions
*   **Local Actions:** Click on a city to perform specific actions like distributing flyers or organizing local meetings.
*   **Collective Actions:** Use the "Actions" panel to launch global initiatives like General Strikes or sabotage, but beware of retaliation!

### Winning
Maintain high global solidarity and push the IPI to 100% to overthrow the regime. Avoid getting crushed by retaliation or losing all support.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the project.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
