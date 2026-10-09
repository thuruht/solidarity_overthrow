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
*   **Authentication:** Local username/password accounts for secure login and profile management.
*   **Cloud Save:** Save your revolution's state to the cloud and resume from any device.
*   **Revolutionary Coup Planning:** Build a secret network of cells across cities, balance preparation against secrecy, and attempt a final coup for the hardest-won victory condition.

## 🛠 Tech Stack

*   **Frontend:** HTML5, CSS3, JavaScript (Modules), Vite
*   **Mapping:** Leaflet.js
*   **Backend:** Cloudflare Workers, Durable Objects, KV Storage, D1 Database
*   **Authentication:** Local accounts (username/password, hashed with PBKDF2 via the Web Crypto API - no third-party auth provider)
*   **Animations:** GSAP

## 🚀 Getting Started

### Prerequisites

*   **Node.js** (v18 or later)
*   **npm** (or yarn/pnpm)
*   **Wrangler** (Cloudflare CLI)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/thuruht/solidarity_overthrow.git
    cd solidarity_overthrow
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment:**
    Create a `.dev.vars` file for local development secrets (do not commit this):
    ```
    OWM_API_KEY=your_openweathermap_key
    ```
    (GitHub OAuth credentials are no longer needed - accounts are handled entirely by the Worker's own `/api/register` and `/api/login` endpoints against the D1 `users` table.)

4.  **Apply the database migrations**, including the `users` table:
    ```bash
    npx wrangler d1 execute solidarity-leaderboard --file=migrations/0002_users.sql
    ```

5.  **Promote your own account to admin** (after registering once in-app):
    ```bash
    npx wrangler d1 execute solidarity-leaderboard --command "UPDATE users SET is_admin = 1 WHERE username = 'yourname';"
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
*   **IPI (Imperialist Power Index):** The strength of the imperial system's control. Reduce this to win - the lower it goes, the closer the regime is to collapse.
*   **Propaganda:** The regime's control over information. Reduce this to gain more support.

### Actions
*   **Local Actions:** Click on a city to perform specific actions like distributing flyers or organizing local meetings.
*   **Collective Actions:** Use the "Actions" panel to launch global initiatives like General Strikes or sabotage, but beware of retaliation!
*   **Revolutionary Coup Planning:** Once global solidarity reaches 25% and IPI drops to 85% or below, a "Plan Revolution" button appears. Establish cells in high-solidarity cities, designate a lead city, and balance preparation against operational security before attempting to execute the revolution. Note that as IPI drops further, a cornered regime grows more desperate and retaliation intensifies - this is intentional, not a bug.

### Winning
There are four ways to win:
1.  **IPI Victory:** Reduce global IPI to 25% or below.
2.  **Solidarity Victory:** Raise global solidarity to 75% or above.
3.  **Truth Victory:** Reduce global propaganda to 25% or below.
4.  **Revolutionary Victory:** Successfully execute a planned coup (see above).

Avoid getting crushed by retaliation (IPI at 95%+ with solidarity at 10% or below ends the game in defeat).

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the project.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
