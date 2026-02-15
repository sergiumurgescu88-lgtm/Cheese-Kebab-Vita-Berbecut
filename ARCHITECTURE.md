# 🏛️ SMART HELIOS: Solar AI Architecture Blueprint

> **Version:** 2.1 Enterprise
> **Scope:** Multi-Agent System for Solar Portfolio Management (661 MW RO / 50 Parks US)
> **Core:** 47 Intelligence Modules

---

## 1. 📂 Logical Project Structure

This structure organizes the application into a GPS-centric, Multi-Agent architecture.

```
Cheese-Kebab-Vita-Berbecut/
│
├── backend/                    # Server-side Logic & Agent Runtime
│   ├── agents/                # AI Agent Implementations
│   │   ├── FusionSolarAgent.ts  # Weather & Forecasting
│   │   ├── OmniScadaAgent.ts    # Operations & Monitoring
│   │   ├── VoltaAgent.ts        # PPC & Grid Control
│   │   ├── MercuriaAgent.ts     # Trading & Financials
│   │   ├── SolarAIArchitect.ts  # General Architecture (Helios)
│   │   ├── HelioAgent.ts        # HG 907/2016 Feasibility
│   │   └── AtlasAgent.ts        # API & Tech Orchestration
│   │
│   ├── orchestrator/          # Routing Logic
│   │   ├── AgentRouter.ts     # Intent classification -> Agent
│   │   ├── MessageBroker.ts   # Inter-agent pub/sub
│   │   └── ContextManager.ts  # GPS-based context hydration
│   │
│   ├── integrations/          # External APIs (The "Synapse")
│   │   ├── WeatherAPI.ts      # OpenWeather / Solcast
│   │   ├── FusionSolarAPI.ts  # Huawei Northbound Interface
│   │   ├── PlanetLabsAPI.ts   # Satellite Imagery
│   │   ├── ScadaAPI.ts        # Modbus/OPC-UA Collectors
│   │   └── TradingAPI.ts      # OPCOM / Spot Market
│   │
│   └── database/              # Persistence Layer
│       ├── models/
│       │   ├── Plant.ts       # Physical Assets
│       │   ├── Module.ts      # The 47 Logic Modules
│       │   └── Telemetry.ts   # Time-series data
│       └── repositories/
│
├── components/                # React UI Components
│   ├── agents/                # Agent-Specific Interfaces
│   │   ├── ChatInterface.tsx
│   │   └── AgentSwitcher.tsx
│   │
│   ├── dashboards/            # Module Visualization
│   │   ├── FusionSolarDashboard.tsx
│   │   ├── OmniScadaSection.tsx
│   │   ├── VoltaSection.tsx
│   │   └── MercuriaSection.tsx
│   │
│   └── modules/               # The 47 Modules Inventory
│       ├── ModulesInventory.tsx
│       ├── ModuleCard.tsx
│       └── ModuleDetail.tsx
│
├── data/                      # Static Data & Configurations
│   ├── modules.ts             # Registry of all 47 Modules
│   ├── knowledgeBase.ts       # RAG Context for Agents
│   └── pricing-zones.json     # Energy market definitions
│
└── services/                  # Frontend Business Logic
    ├── geminiService.ts       # AI Connectivity
    └── weatherService.ts      # Forecasting Logic
```

---

## 2. 🧠 The 6 Core Agents (The "Brain")

The system is orchestrated by **ATLAS**, who routes requests to specialized agents based on **GPS Context**.

| Agent | Role | Focus Area | Key API Integrations |
| :--- | :--- | :--- | :--- |
| **ATLAS** | **Orchestrator** | System Architecture, API Routing, Error Handling | Internal Router, All APIs |
| **HELIOS** | **Architect** | General Q&A, Portfolio Overview, Funding (PTJ) | Knowledge Base, MapBox |
| **HELIO (SF)** | **Legal Expert** | Feasibility Studies (HG 907/2016), Law, Permits | Law Database, CAD exports |
| **FUSION** | **Meteorologist** | Weather, Irradiance, Production Forecasting | OpenWeather, Solcast |
| **OMNI** | **Operator** | SCADA, Alarms, Maintenance, Ticketing | Huawei FusionSolar, Planet Labs |
| **VOLTA** | **Controller** | PPC, Grid Compliance, Curtailment Mgmt | Modbus TCP, Grid Analyzers |
| **MERCURIA** | **Trader** | Spot Market, Arbitrage, Financial Reporting | OPCOM, EEX |

---

## 3. 🔄 Data Flow: The "GPS-First" Protocol

1.  **Input:** User provides coordinates (e.g., `44.4268, 26.1025`) or selects a Park ID.
2.  **Context Hydration:**
    *   System identifies the **Plant** at that location.
    *   Fetches **Live Weather** (OpenWeather).
    *   Fetches **Grid Status** (FusionSolar).
    *   Fetches **Market Price** (Mercuria).
3.  **Intent Analysis:** Atlas determines if the user wants *Status*, *Prediction*, *Trading*, or *Legal Advice*.
4.  **Agent Activation:** The specific agent receives the full context and processes the query.
5.  **Response:** Structured JSON + Natural Language.

---

## 4. 📦 The 47 Intelligence Modules Inventory

Organized by implementation phase and priority.

### **Phase 1: Critical (0-3 Months) - "The Backbone"**
*Grid & Trading, Basic O&M*
*   **MOD-01:** Virtual Power Plant (VPP) Orchestrator
*   **MOD-02:** Frequency Regulation (Ancillary Services)
*   **MOD-03:** Thermal Anomaly Detection (Drone/IR)
*   **MOD-04:** Satellite Soiling Analysis (Planet Labs)
*   **MOD-05:** AI Production Anomaly Detection
*   **MOD-06:** Adaptive Weather Forecasting
*   **MOD-07:** Green Hydrogen Integration
*   **MOD-08:** AI Data Center Power Supply
*   **MOD-09:** Long-Duration Energy Storage (LDES)
*   **MOD-10:** Precise Degradation Tracking

### **Phase 2: Essential (3-6 Months) - "Optimization"**
*Advanced O&M, Digital Twins*
*   **MOD-11:** Performance Benchmarking
*   **MOD-12:** Predictive Fault Prediction (90-day horizon)
*   **MOD-13:** Spare Parts Optimizer
*   **MOD-14:** Carbon Footprint & ESG Reporting
*   **MOD-15:** Biodiversity Monitoring (NDVI)
*   **MOD-16:** Digital Twin Simulation
*   **MOD-17:** Federated Learning (Inter-park)
*   **MOD-18:** Real-Time Energy Arbitrage
*   **MOD-19:** Corporate PPA Matchmaker
*   **MOD-20:** Agrivoltaic Optimization

### **Phase 3: Advanced (6-12 Months) - "Resilience"**
*Security, Robotics, Deep Tech*
*   **MOD-21:** Fire Risk Prediction
*   **MOD-22:** Flood Resilience Monitoring
*   **MOD-23:** Robotic Maintenance Integration
*   **MOD-24:** Panel DNA / Anti-Fraud Analysis
*   **MOD-25:** Islanded Microgrid Operation
*   **MOD-26:** Acoustic Monitoring (Inverters/Transformers)
*   **MOD-27:** Solar Spectrum Optimizer
*   **MOD-28:** EMI Mapping
*   **MOD-29:** Intelligent Cleaning Scheduler
*   **MOD-30:** Gamified O&M Performance

### **Phase 4: Innovative & Future (12-24 Months)**
*Next-Gen Tech, Experimental*
*   **MOD-31 to MOD-40:** Grid-Forming Inverters, Seawater Electrolysis, Perovskite Support, Hyperspectral Diagnostics, Crypto Mining Optimization.
*   **MOD-41 to MOD-47:** Edge Computing, Fast Frequency Response, V2G Fleet Integration, Blockchain Trading, Quantum Optimization, AI Self-Improvement.

---

## 5. 🗄️ Database Schema (Conceptual)

### `Plant`
```typescript
interface Plant {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  capacityMW: number;
  modulesActive: string[]; // ['m1', 'm4', 'm6']
  gridConnection: { point: string; voltage: number };
}
```

### `Telemetry`
```typescript
interface Telemetry {
  plantId: string;
  timestamp: Date;
  activePower: number; // kW
  irradiance: number; // W/m2
  temperature: number; // C
  status: 'NORMAL' | 'ALARM' | 'OFFLINE';
}
```

---

## 6. 🚀 Getting Started

1.  **Clone:** `git clone <repo>`
2.  **Install:** `npm install`
3.  **Config:** Create `.env.local` with:
    *   `VITE_OPENWEATHER_API_KEY`
    *   `API_KEY` (Gemini)
4.  **Run:** `npm run dev`
