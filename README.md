# Serverless Expense Tracker with Cloud Analytics & ESP32 Hardware Integration

[![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Supabase%20%7C%20Serverless%20%7C%20ESP32-6366f1)](#technology-stack)
[![Hardware](https://img.shields.io/badge/Hardware-ESP32%20%7C%20IoT%20Buttons-10b981)](#hardware-integration)
[![Security](https://img.shields.io/badge/Security-Supabase%20RLS%20%7C%20SHA--256-8b5cf6)](#security--authorization)

A production-ready, portfolio-quality financial management platform that bridges physical hardware inputs (ESP32 push buttons) directly with a cloud-native serverless backend, relational database, real-time sync engine, and interactive financial analytics dashboard.

---

## Key Features & Highlights

- **Physical Hardware Button Inputs**: Two physical push buttons on an ESP32 micro-controller log expenses directly to the cloud backend over HTTPS:
  - **Button 1 (GPIO 18)**: Essential Expenses (Food, Rent, Power, Medical)
  - **Button 2 (GPIO 19)**: Non-Essential Expenses (Shopping, Gaming, Dining out)
- **Serverless API Architecture**: Dedicated `/api/hardware/expense`, `/api/hardware/heartbeat`, and `/api/hardware/status` endpoints authenticate hardware requests and record transactions.
- **Cloud-Based Financial Analytics**: Real-time spending breakdown (Essential vs Non-Essential ratio), monthly spending trends, category velocity, income-to-expense ratio, and monthly budget utilization.
- **Supabase PostgreSQL & RLS Security**: Strict Row Level Security policies guarantee absolute user data isolation. Hardware devices are cryptographically paired using SHA-256 tokens.
- **Real-Time Data Streaming**: Hardware button presses stream immediately to active web dashboard sessions via Supabase Realtime without manual page refreshes.
- **Live Hardware Activity Panel**: Displays an incoming live feed of hardware button triggers with status, timestamps, and amount tags.
- **Interactive Hardware Simulator**: Built-in test widget allows instant hardware endpoint simulation right from the web browser.

---

## 1. End-to-End System Architecture

```
                               ┌──────────────────────────────────┐
                               │    Physical ESP32 Microcontroller │
                               │  - Button 1: Essential Expense   │
                               │  - Button 2: Non-Essential Exp.  │
                               │  - Status LED Feedback           │
                               └────────────────┬─────────────────┘
                                                │
                                                │ HTTPS POST /api/hardware/expense
                                                ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       Vercel / Node Serverless API Layer                        │
│  - SHA-256 Token Verification                                                   │
│  - Idempotency & Debouncing Guard (Request UUID)                                │
│  - User Hardware Settings Lookup (Essential & Non-Essential Default Amounts)   │
└───────────────────────────────────────┬─────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Supabase Cloud PostgreSQL DB                          │
│  - Tables: profiles, categories, hardware_devices, transactions, budgets        │
│  - Row Level Security (RLS) Policies (Strict User Isolation)                   │
│  - Supabase Realtime Engine (Pub/Sub Event Broadcast)                            │
└───────────────────────────────────────┬─────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           React Web Single Page App                             │
│  - Modern Fintech Dark/Glassmorphic Visual Design                               │
│  - Interactive Recharts Cloud Financial Analytics                               │
│  - Real-time Hardware Activity Ticker & Live Interactive Hardware Simulator     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

- **Frontend**: React (TypeScript), Vite, Recharts, Lucide Icons, Supabase JS Client SDK.
- **Backend / Serverless API**: Node.js, Express, TypeScript, Vercel Serverless Functions.
- **Database & Auth**: Supabase PostgreSQL, Supabase Auth, Row Level Security (RLS), Realtime Pub/Sub.
- **Hardware & Firmware**: ESP32 (NodeMCU / ESP-WROOM-32), Arduino C++, PlatformIO, WiFiClientSecure, HTTPClient, ArduinoJson.
- **Styling**: Premium Fintech Dark Mode design system with CSS custom tokens, glassmorphism, HSL color palettes, and micro-animations.

---

## 3. Physical Hardware Configuration (ESP32)

### Pinout Assignment
```
ESP32 Pinout:
 ├── GPIO 18 → Button 1: Essential Expense (Internal Pull-Up -> GND)
 ├── GPIO 19 → Button 2: Non-Essential Expense (Internal Pull-Up -> GND)
 ├── GPIO 2  → Status LED Indicator (Blink feedback)
 └── GND     → Common Push Button Ground
```

### Hardware Status LED Legend
- **Rapid Blink**: Connecting to Wi-Fi network.
- **Solid ON**: Wi-Fi connected and device online.
- **2 Short Blinks**: Transaction successfully recorded in Cloud Database!
- **4 Fast Blinks**: Hardware token rejected or API authorization failure.

---

## 4. Hardware Integration API

### POST `/api/hardware/expense`
Header: `Authorization: Bearer <DEVICE_TOKEN>`

Request Payload:
```json
{
  "deviceId": "ESP32-001",
  "deviceSecret": "YOUR_DEVICE_TOKEN",
  "expenseType": "essential",
  "amount": 100,
  "requestId": "req-987654321"
}
```

Response:
```json
{
  "success": true,
  "message": "ESSENTIAL expense recorded successfully",
  "transaction": {
    "id": "tx-123456789",
    "deviceId": "ESP32-001",
    "expenseType": "essential",
    "amount": 100,
    "category": "Essential Hardware",
    "source": "hardware",
    "timestamp": "2026-09-10T12:00:00Z"
  }
}
```

---

## 5. Directory & Monorepo Structure

```
cloud comp proj/
├── api/                        # Serverless Functions (Hardware API)
│   ├── hardware/
│   │   ├── expense.ts
│   │   ├── heartbeat.ts
│   │   └── status.ts
│   ├── _shared/
│   │   ├── cryptoUtils.ts
│   │   └── supabaseAdmin.ts
│   └── server.ts              # Local Express runner for API
├── frontend/                   # React + Vite Web Application
│   ├── src/
│   │   ├── components/         # Navbar, Sidebar, LiveHardwareFeed, Cards...
│   │   ├── context/            # AuthContext, RealtimeContext
│   │   ├── pages/              # Dashboard, Transactions, Analytics, Devices...
│   │   ├── services/           # supabaseClient.ts, mockData.ts
│   │   ├── styles/             # index.css (Fintech Design System)
│   │   └── App.tsx
│   ├── index.html
│   └── package.json
├── supabase/                   # PostgreSQL Schema & Migrations
│   ├── migrations/
│   │   └── 20260910000000_initial_schema.sql
│   └── seed.sql
├── hardware/                   # ESP32 C++ Code & Wiring
│   └── esp32/
│       ├── esp32_expense_tracker.ino
│       ├── platformio.ini
│       └── README.md
├── docs/                       # Technical Documentation
│   ├── architecture.md
│   ├── hardware.md
│   ├── api.md
│   └── deployment.md
└── package.json                # Root Monorepo Scripts
```

---

## 6. How to Run Locally

### Step 1: Install Dependencies
```bash
# Install frontend dependencies
cd frontend
npm install

# Install root/API dependencies
cd ..
npm install
```

### Step 2: Start Development Servers
```bash
# Terminal 1: Run Frontend Application (http://localhost:3000)
npm run dev:frontend

# Terminal 2: Run Serverless API Server locally (http://localhost:3001)
npm run start:api
```

Open `http://localhost:3000` in your web browser. You can log in using the demo credentials, explore financial analytics, set budgets, and use the **Live Hardware Test Simulator** to simulate ESP32 button presses in real-time!

---

## 7. Technical Verification Checklist

- [x] Web User Authentication & Session Guards
- [x] Income & Expense Recording with Category Tags
- [x] Essential vs. Non-Essential High-Level Classification
- [x] ESP32 C++ Firmware Source Code & Hardware Wiring Guide
- [x] Serverless API Endpoints (`POST /api/hardware/expense`, `POST /api/hardware/heartbeat`)
- [x] Hardware Security (SHA-256 Device Secret Hashing & Token Verification)
- [x] Server-Side Default Amount Configuration (Configurable per device/user)
- [x] Supabase Relational Database Schema & Row Level Security (RLS) Policies
- [x] Real-time Hardware Activity Ticker & Dashboard Sync
- [x] Interactive Hardware Test Simulator for Live Browser Demonstration
- [x] Responsive Fintech Dark/Glassmorphic Visual Interface
- [x] Complete Technical Documentation (`docs/architecture.md`, `docs/hardware.md`, `docs/api.md`, `docs/deployment.md`)

---

## Cloud Computing Concepts Demonstrated

`Serverless Computing` → `Cloud Database` → `Authentication` → `API Communication` → `IoT/Hardware Integration` → `Cloud Analytics` → `Real-Time Data` → `Cloud Deployment` → `Scalable Architecture`
