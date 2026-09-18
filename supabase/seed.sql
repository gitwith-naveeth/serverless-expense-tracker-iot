-- Seed script for Serverless Expense Tracker
-- Note: Replace UUIDs with actual auth user ID when seeding directly in Supabase Studio

-- Sample default hardware device entry demo
-- Device Secret: 'esp32_secret_token_12345' -> SHA256 Hash: '900150983cd24fb0d6963f7d28e17f7243c224b7a1f5926ff9841804d9c72e27'
/*
INSERT INTO public.hardware_devices (
    user_id,
    device_id,
    device_name,
    device_secret_hash,
    status,
    default_essential_amount,
    default_non_essential_amount
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'ESP32-001',
    'Desk Push Button Box',
    '900150983cd24fb0d6963f7d28e17f7243c224b7a1f5926ff9841804d9c72e27',
    'online',
    100.00,
    200.00
);
*/
