# SMART HELIOS | Solar Intelligence Dashboard

**SMART HELIOS** is a next-generation Solar Energy Management System (SEMS) designed to orchestrate a portfolio of 25+ solar parks in Romania and 50 in the US. 

It utilizes a **Multi-Agent AI Architecture** to manage 47 critical operational modules, ranging from VPP Orchestration to Satellite Soiling Analysis.

![Status](https://img.shields.io/badge/Status-Phase%201%20Critical-emerald)
![Modules](https://img.shields.io/badge/Modules-47%20Total-blue)
![Stack](https://img.shields.io/badge/Stack-React%20%7C%20Gemini%20%7C%20Tailwind-orange)

## 📚 Documentation

**👉 [VIEW FULL ARCHITECTURE & MODULES DOCUMENTATION](./ARCHITECTURE.md)**

Please refer to `ARCHITECTURE.md` for:
- Detailed breakdown of all **47 Modules**.
- The **Multi-Agent System** design (Atlas, Helios, Volta, etc.).
- Data flow diagrams and folder structure.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- OpenWeatherMap API Key
- Google Gemini API Key

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-org/smart-helios.git
    cd smart-helios
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment:**
    Create a `.env.local` file in the root directory:
    ```bash
    VITE_OPENWEATHER_API_KEY=your_openweather_key
    API_KEY=your_gemini_key
    ```

4.  **Run Development Server:**
    ```bash
    npm run dev
    ```

## 🧩 Key Features

-   **Dashboard:** Real-time visualization of VPP capacity and Financial NPV.
-   **Modules Inventory:** Searchable database of all 47 technical modules.
-   **FusionSolar Integration:** Live telemetry from Huawei inverters.
-   **Weather Forecast:** Solar-specific metrics (GHI, DNI, Efficiency).
-   **AI Agents:**
    -   **SolarAI Architect:** General portfolio advice.
    -   **Helio (SF Expert):** HG 907/2016 Feasibility Studies.
    -   **Atlas:** Technical API implementation.
    -   **Volta:** Grid control & PPC.
    -   **Mercuria:** Energy trading.

## 🏗️ Project Structure

The project follows a modular architecture described in `ARCHITECTURE.md`.

-   `/components`: UI Elements and Dashboard Widgets.
-   `/services`: API Connectors (Weather, Gemini, FusionSolar, Planet).
-   `/data`: Static Definitions (Modules, Knowledge Base).
-   `/backend`: Proxy server for handling CORS and secure API requests.

---

*Powered by Smart Helios R&D*
