# Deployment Guide (Vercel & Supabase)

This guide walks you through deploying the **Serverless Expense Tracker** to production using **Supabase** for database & auth, and **Vercel** for serverless hosting.

---

## 1. Supabase Database & Auth Setup

1. Sign in to [Supabase Console](https://supabase.com) and click **New Project**.
2. Set project name, database password, and region.
3. Once initialized, navigate to the **SQL Editor** tab.
4. Run both migration scripts in order:
   - `supabase/migrations/20260910000000_initial_schema.sql`
   - `supabase/migrations/20261102000000_cloud_analytics.sql`
5. Copy the SQL code into the Supabase SQL Editor and run it.
6. Verify that tables (`profiles`, `categories`, `hardware_devices`, `transactions`, `budgets`) are created with Row Level Security (RLS) enabled and that `get_expense_analytics` exists under Database -> Functions.
7. Navigate to **Project Settings -> API** and copy:
   - `Project URL`
   - `anon public key`
   - `service_role secret key`

---

## 2. Vercel Serverless Hosting Setup

1. Fork or push this repository to GitHub.
2. Sign in to [Vercel Dashboard](https://vercel.com) and click **Add New -> Project**.
3. Import your GitHub repository. Keep the repository root as the Vercel project root so `/api/analytics/overview` is deployed.
4. Configure Build Settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `frontend/dist`
5. Add Environment Variables in Vercel Project Settings:

| Key | Value | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | Public Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbG...` | Public Anon JWT Key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbG...` | **Server-Only** Service Role Key |

6. Click **Deploy**. Vercel will build the React web app and publish serverless functions under `/api/analytics/overview` and `/api/hardware/*`.
7. Never put `SUPABASE_SERVICE_ROLE_KEY` in a `VITE_` variable or in `frontend/.env`; it must remain a server-only Vercel variable.

The analytics dashboard calls `GET /api/analytics/overview` with the signed-in user's Supabase access token. PostgreSQL performs the aggregation through `get_expense_analytics`; the browser only renders the returned JSON.

---

## 3. Connecting ESP32 Hardware to Production

1. Open `hardware/esp32/esp32_expense_tracker.ino`.
2. Update the `API_ENDPOINT` constant with your live Vercel production domain:
   ```cpp
   const char* API_ENDPOINT = "https://your-app.vercel.app/api/hardware/expense";
   ```
3. Flash the firmware onto your ESP32.
4. Press physical Button 1 or Button 2 and observe live updates on your deployed Vercel web app!
