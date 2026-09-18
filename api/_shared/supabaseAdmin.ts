import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://demo-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'demo-key';

export const isLiveSupabase = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_URL);

let supabaseAdminClient: SupabaseClient | null = null;

if (supabaseUrl && supabaseServiceKey && supabaseUrl !== 'https://demo-project.supabase.co') {
  supabaseAdminClient = createClient(supabaseUrl, supabaseServiceKey);
}

export { supabaseAdminClient };

// In-Memory Mock Store for Development & Demonstration when live Supabase is not attached
export interface MockDevice {
  id: string;
  user_id: string;
  device_id: string;
  device_name: string;
  device_secret_hash: string;
  status: 'online' | 'offline';
  default_essential_amount: number;
  default_non_essential_amount: number;
  last_seen: string | null;
}

export interface MockTransaction {
  id: string;
  user_id: string;
  device_id: string | null;
  amount: number;
  transaction_type: 'income' | 'expense';
  expense_classification: 'essential' | 'non-essential' | null;
  category: string;
  source: 'web' | 'hardware';
  description: string;
  timestamp: string;
  created_at: string;
}

export const inMemoryStore = {
  devices: [
    {
      id: 'dev-001-uuid',
      user_id: 'usr-demo-001',
      device_id: 'ESP32-001',
      device_name: 'Desk Push Button Box',
      device_secret_hash: '900150983cd24fb0d6963f7d28e17f7243c224b7a1f5926ff9841804d9c72e27', // hash of 'esp32_secret_token_12345'
      status: 'online',
      default_essential_amount: 100,
      default_non_essential_amount: 200,
      last_seen: new Date().toISOString(),
    }
  ] as MockDevice[],
  transactions: [] as MockTransaction[],
};
