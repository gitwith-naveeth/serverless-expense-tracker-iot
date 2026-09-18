export type ExpenseClassification = 'essential' | 'non-essential';
export type TransactionType = 'income' | 'expense';
export type TransactionSource = 'web' | 'hardware';
export type DeviceStatus = 'online' | 'offline' | 'error';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  currency: string;
  default_essential_amount: number;
  default_non_essential_amount: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  device_id?: string | null;
  amount: number;
  transaction_type: TransactionType;
  expense_classification?: ExpenseClassification | null;
  category: string;
  source: TransactionSource;
  description?: string | null;
  timestamp: string;
  created_at?: string;
  hardware_device?: {
    device_id: string;
    device_name: string;
  } | null;
}

export interface HardwareDevice {
  id: string;
  user_id: string;
  device_id: string;
  device_name: string;
  status: DeviceStatus;
  default_essential_amount: number;
  default_non_essential_amount: number;
  last_seen: string | null;
  created_at: string;
  total_transactions?: number;
  last_transaction?: Transaction | null;
}

export interface Budget {
  id: string;
  user_id: string;
  month: string; // 'YYYY-MM'
  total_budget_amount: number;
  essential_budget: number;
  non_essential_budget: number;
  created_at: string;
}

export interface Category {
  id: string;
  user_id?: string;
  name: string;
  type: 'essential' | 'non-essential' | 'income';
  icon: string;
  is_default: boolean;
}

export interface HardwareActivityLog {
  id: string;
  timestamp: string;
  deviceId: string;
  expenseType: ExpenseClassification;
  amount: number;
  status: 'created' | 'pending' | 'error';
}
