import { Transaction, HardwareDevice, Budget, Category, UserProfile } from '../types';

export const mockUserProfile: UserProfile = {
  id: 'usr-demo-001',
  full_name: 'Alex Mercer',
  email: 'alex.mercer@cloudfinance.io',
  currency: 'INR',
  default_essential_amount: 100,
  default_non_essential_amount: 200,
  created_at: new Date().toISOString(),
};

export const mockDevices: HardwareDevice[] = [
  {
    id: 'dev-001-uuid',
    user_id: 'usr-demo-001',
    device_id: 'ESP32-001',
    device_name: 'Workplace Desk Hardware Box',
    status: 'online',
    default_essential_amount: 100,
    default_non_essential_amount: 200,
    last_seen: new Date(Date.now() - 15000).toISOString(),
    created_at: '2026-09-01T10:00:00Z',
    total_transactions: 24,
  },
  {
    id: 'dev-002-uuid',
    user_id: 'usr-demo-001',
    device_id: 'ESP32-002',
    device_name: 'Kitchen Pantry Button Module',
    status: 'offline',
    default_essential_amount: 150,
    default_non_essential_amount: 300,
    last_seen: new Date(Date.now() - 86400000 * 2).toISOString(),
    created_at: '2026-09-03T14:30:00Z',
    total_transactions: 8,
  }
];

export const mockCategories: Category[] = [
  { id: 'cat-1', name: 'Food & Groceries', type: 'essential', icon: 'Utensils', is_default: true },
  { id: 'cat-2', name: 'House Rent', type: 'essential', icon: 'Home', is_default: true },
  { id: 'cat-3', name: 'Electricity & Utilities', type: 'essential', icon: 'Zap', is_default: true },
  { id: 'cat-4', name: 'Transportation & Fuel', type: 'essential', icon: 'Car', is_default: true },
  { id: 'cat-5', name: 'Medical & Healthcare', type: 'essential', icon: 'Activity', is_default: true },
  { id: 'cat-6', name: 'Entertainment & Movies', type: 'non-essential', icon: 'Film', is_default: true },
  { id: 'cat-7', name: 'Shopping & Clothes', type: 'non-essential', icon: 'ShoppingBag', is_default: true },
  { id: 'cat-8', name: 'Gaming & Gadgets', type: 'non-essential', icon: 'Gamepad2', is_default: true },
  { id: 'cat-9', name: 'Dining Out & Cafes', type: 'non-essential', icon: 'Coffee', is_default: true },
  { id: 'cat-10', name: 'Monthly Salary', type: 'income', icon: 'DollarSign', is_default: true },
  { id: 'cat-11', name: 'Freelance Work', type: 'income', icon: 'Briefcase', is_default: true },
];

const now = new Date();
const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

export const mockBudget: Budget = {
  id: 'bgt-001',
  user_id: 'usr-demo-001',
  month: currentMonthStr,
  total_budget_amount: 50000,
  essential_budget: 30000,
  non_essential_budget: 20000,
  created_at: new Date().toISOString(),
};

export const initialMockTransactions: Transaction[] = [
  {
    id: 'tx-101',
    user_id: 'usr-demo-001',
    amount: 65000,
    transaction_type: 'income',
    category: 'Monthly Salary',
    source: 'web',
    description: 'Tech Lead Monthly Remuneration',
    timestamp: new Date(now.getFullYear(), now.getMonth(), 1, 9, 0).toISOString(),
  },
  {
    id: 'tx-102',
    user_id: 'usr-demo-001',
    amount: 18000,
    transaction_type: 'expense',
    expense_classification: 'essential',
    category: 'House Rent',
    source: 'web',
    description: 'Apartment Monthly Rent Payment',
    timestamp: new Date(now.getFullYear(), now.getMonth(), 2, 11, 30).toISOString(),
  },
  {
    id: 'tx-103',
    user_id: 'usr-demo-001',
    device_id: 'dev-001-uuid',
    amount: 100,
    transaction_type: 'expense',
    expense_classification: 'essential',
    category: 'Essential Hardware',
    source: 'hardware',
    description: 'Triggered via Workplace Desk Hardware Box (ESP32-001) [ESSENTIAL]',
    timestamp: new Date(now.getTime() - 1000 * 60 * 12).toISOString(), // 12 mins ago
  },
  {
    id: 'tx-104',
    user_id: 'usr-demo-001',
    device_id: 'dev-001-uuid',
    amount: 200,
    transaction_type: 'expense',
    expense_classification: 'non-essential',
    category: 'Non-Essential Hardware',
    source: 'hardware',
    description: 'Triggered via Workplace Desk Hardware Box (ESP32-001) [NON-ESSENTIAL]',
    timestamp: new Date(now.getTime() - 1000 * 60 * 35).toISOString(), // 35 mins ago
  },
  {
    id: 'tx-105',
    user_id: 'usr-demo-001',
    amount: 3400,
    transaction_type: 'expense',
    expense_classification: 'essential',
    category: 'Food & Groceries',
    source: 'web',
    description: 'Weekly Organic Grocery Stocking',
    timestamp: new Date(now.getFullYear(), now.getMonth(), 4, 16, 45).toISOString(),
  },
  {
    id: 'tx-106',
    user_id: 'usr-demo-001',
    amount: 2200,
    transaction_type: 'expense',
    expense_classification: 'non-essential',
    category: 'Gaming & Gadgets',
    source: 'web',
    description: 'Steam Summer Game Purchase',
    timestamp: new Date(now.getFullYear(), now.getMonth(), 5, 20, 10).toISOString(),
  },
  {
    id: 'tx-107',
    user_id: 'usr-demo-001',
    device_id: 'dev-001-uuid',
    amount: 100,
    transaction_type: 'expense',
    expense_classification: 'essential',
    category: 'Essential Hardware',
    source: 'hardware',
    description: 'Triggered via Workplace Desk Hardware Box (ESP32-001) [ESSENTIAL]',
    timestamp: new Date(now.getTime() - 1000 * 60 * 180).toISOString(),
  },
  {
    id: 'tx-108',
    user_id: 'usr-demo-001',
    amount: 1500,
    transaction_type: 'expense',
    expense_classification: 'essential',
    category: 'Electricity & Utilities',
    source: 'web',
    description: 'High-speed Fiber Broadband & Power Bill',
    timestamp: new Date(now.getFullYear(), now.getMonth(), 7, 10, 15).toISOString(),
  },
  {
    id: 'tx-109',
    user_id: 'usr-demo-001',
    amount: 1800,
    transaction_type: 'expense',
    expense_classification: 'non-essential',
    category: 'Dining Out & Cafes',
    source: 'web',
    description: 'Weekend Bistro Lunch with Team',
    timestamp: new Date(now.getFullYear(), now.getMonth(), 8, 14, 0).toISOString(),
  }
];
