# Deployment Guide (Vercel & Supabase)

This guide walks you through deploying the **Serverless Expense Tracker** to production using **Supabase** for database & auth, and **Vercel** for serverless hosting.

---

## 1. Supabase Database & Auth Setup

1. Sign in to [Supabase Console](https://supabase.com) and click **New Project**.
2. Set project name, database password, and region.
3. Once initialized, navigate to the **SQL Editor** tab.
4. Open the migration script located in this repository at:
   `supabase/migrations/20260910000000_initial_schema.sql`
5. Copy all SQL code, paste into Supabase SQL Editor, and click **Run**.
6. Verify that tables (`profiles`, `categories`, `hardware_devices`, `transactions`, `budgets`) are created with Row Level Security (RLS) enabled.
7. Navigate to **Project Settings -> API** and copy:
   - `Project URL`
   - `anon public key`
   - `service_role secret key`

---

## 2. Vercel Serverless Hosting Setup

1. Fork or push this repository to GitHub.
2. Sign in to [Vercel Dashboard](https://vercel.com) and click **Add New -> Project**.
3. Import your GitHub repository.
4. Configure Build Settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `./frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variables in Vercel Project Settings:

| Key | Value | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | Public Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbG...` | Public Anon JWT Key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbG...` | **Server-Only** Service Role Key |

6. Click **Deploy**. Vercel will build the React web app and publish serverless functions under `/api/hardware/expense`.

---

## 3. Connecting ESP32 Hardware to Production

1. Open `hardware/esp32/esp32_expense_tracker.ino`.
2. Update the `API_ENDPOINT` constant with your live Vercel production domain:
   ```cpp
   const char* API_ENDPOINT = "https://your-app.vercel.app/api/hardware/expense";
   ```
3. Flash the firmware onto your ESP32.
4. Press physical Button 1 or Button 2 and observe live updates on your deployed Vercel web app!
