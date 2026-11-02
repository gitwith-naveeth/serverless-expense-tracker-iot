-- ====================================================================
-- SERVERLESS EXPENSE TRACKER WITH HARDWARE INTEGRATION - INITIAL SCHEMA
-- Migration: 20260910000000_initial_schema.sql
-- Database: Supabase PostgreSQL
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    currency VARCHAR(10) DEFAULT 'INR',
    default_essential_amount NUMERIC(12,2) DEFAULT 100.00,
    default_non_essential_amount NUMERIC(12,2) DEFAULT 200.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. EXPENSE & INCOME CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('essential', 'non-essential', 'income')),
    icon VARCHAR(50) DEFAULT 'Tag',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. HARDWARE DEVICES TABLE
CREATE TABLE IF NOT EXISTS public.hardware_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    device_id VARCHAR(64) UNIQUE NOT NULL, -- e.g. 'ESP32-001'
    device_name VARCHAR(100) NOT NULL DEFAULT 'ESP32 Push Button Box',
    device_secret_hash TEXT NOT NULL, -- SHA-256 hash of device secret token
    status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'error')),
    default_essential_amount NUMERIC(12,2) DEFAULT 100.00,
    default_non_essential_amount NUMERIC(12,2) DEFAULT 200.00,
    last_seen TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    device_id UUID REFERENCES public.hardware_devices(id) ON DELETE SET NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('income', 'expense')),
    expense_classification VARCHAR(20) CHECK (expense_classification IN ('essential', 'non-essential')),
    category VARCHAR(100) NOT NULL,
    source VARCHAR(20) NOT NULL DEFAULT 'web' CHECK (source IN ('web', 'hardware')),
    description TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. MONTHLY BUDGETS TABLE
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    month VARCHAR(7) NOT NULL, -- Format: 'YYYY-MM'
    total_budget_amount NUMERIC(12,2) NOT NULL DEFAULT 30000.00,
    essential_budget NUMERIC(12,2) DEFAULT 20000.00,
    non_essential_budget NUMERIC(12,2) DEFAULT 10000.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, month)
);

-- ====================================================================
-- INDEXES FOR PERFORMANCE
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON public.transactions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_classification ON public.transactions(expense_classification);
CREATE INDEX IF NOT EXISTS idx_transactions_source ON public.transactions(source);
CREATE INDEX IF NOT EXISTS idx_hardware_devices_device_id ON public.hardware_devices(device_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON public.budgets(user_id, month);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hardware_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Categories Policies
CREATE POLICY "Users can view default or own categories"
    ON public.categories FOR SELECT
    USING (
        auth.uid() = user_id
        OR (is_default = true AND user_id IS NULL)
    );

CREATE POLICY "Users can insert own categories" 
    ON public.categories FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" 
    ON public.categories FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" 
    ON public.categories FOR DELETE 
    USING (auth.uid() = user_id);

-- Hardware Devices Policies
CREATE POLICY "Users can view own hardware devices" 
    ON public.hardware_devices FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can register own hardware devices" 
    ON public.hardware_devices FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own hardware devices" 
    ON public.hardware_devices FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own hardware devices" 
    ON public.hardware_devices FOR DELETE 
    USING (auth.uid() = user_id);

-- Transactions Policies
CREATE POLICY "Users can view own transactions" 
    ON public.transactions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" 
    ON public.transactions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" 
    ON public.transactions FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" 
    ON public.transactions FOR DELETE 
    USING (auth.uid() = user_id);

-- Budgets Policies
CREATE POLICY "Users can view own budgets" 
    ON public.budgets FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budgets" 
    ON public.budgets FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets" 
    ON public.budgets FOR UPDATE 
    USING (auth.uid() = user_id);

-- ====================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER ON AUTH USER REGISTRATION
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, currency)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', new.email),
        new.email,
        'INR'
    );
    
    -- Insert Default Categories for New User
    INSERT INTO public.categories (user_id, name, type, icon, is_default) VALUES
    (new.id, 'Food & Groceries', 'essential', 'Utensils', true),
    (new.id, 'House Rent', 'essential', 'Home', true),
    (new.id, 'Electricity & Utilities', 'essential', 'Zap', true),
    (new.id, 'Transportation & Fuel', 'essential', 'Car', true),
    (new.id, 'Education & Tuition', 'essential', 'BookOpen', true),
    (new.id, 'Medical & Healthcare', 'essential', 'Activity', true),
    (new.id, 'Entertainment & Streaming', 'non-essential', 'Film', true),
    (new.id, 'Shopping & Apparel', 'non-essential', 'ShoppingBag', true),
    (new.id, 'Gaming & Tech Gadgets', 'non-essential', 'Gamepad2', true),
    (new.id, 'Dining Out & Cafes', 'non-essential', 'Coffee', true),
    (new.id, 'Salary / Wages', 'income', 'DollarSign', true),
    (new.id, 'Freelance / Projects', 'income', 'Briefcase', true);

    -- Insert Default Initial Budget
    INSERT INTO public.budgets (user_id, month, total_budget_amount, essential_budget, non_essential_budget)
    VALUES (
        new.id,
        to_char(NOW(), 'YYYY-MM'),
        30000.00,
        20000.00,
        10000.00
    );

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- ENABLE REALTIME PUBLICATION FOR HARDWARE TRANSACTIONS
-- ====================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hardware_devices;
