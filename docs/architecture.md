# Cloud & System Architecture Documentation

The **Serverless Expense Tracker with Cloud Analytics & Hardware Integration** is designed around a modern cloud-native, event-driven architecture combining physical IoT input, serverless compute functions, relational database storage with Row Level Security (RLS), and real-time frontend data synchronization.

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

## 2. Key Architecture Concepts & Cloud Principles

1. **Serverless Compute**:
   - The backend API routes (`/api/hardware/expense`, `/api/hardware/heartbeat`, `/api/hardware/status`) run as stateless serverless functions.
   - Zero idle server costs, instant auto-scaling to handle high button press traffic.

2. **Cloud Analytics**:
   - Dynamic real-time calculation of essential vs. non-essential spending split, income-to-expense ratio, category velocity, and monthly budget utilization.
   - Cloud database triggers auto-summarize financial metrics.

3. **IoT & Edge Hardware Integration**:
   - Edge micro-controllers (ESP32) communicate directly with cloud serverless endpoints over HTTPS.
   - Amounts are configured on the server, ensuring physical buttons remain lightweight, tamper-resistant, and secure.

4. **Security & Authentication Model**:
   - Client Web Users: Authenticated via **Supabase Auth** JWT tokens.
   - ESP32 Hardware: Authenticated via **Device ID** and **SHA-256 Hashed Secret Tokens**.
   - Database Isolation: **Row Level Security (RLS)** guarantees that users can access only their own transactions, budgets, and hardware devices.

5. **Real-time Data Sync**:
   - Supabase Realtime web-sockets broadcast new hardware transactions directly to open web dashboard sessions without requiring manual page refresh.
