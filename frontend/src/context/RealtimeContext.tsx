import React, { createContext, useContext, useState, useEffect } from 'react';
import { Transaction, HardwareDevice, HardwareActivityLog, Budget } from '../types';
import { mockDevices, mockBudget } from '../services/mockData';
import { supabase, isConfigured } from '../services/supabaseClient';
import { useAuth } from './AuthContext';

interface ToastNotification {
  id: string;
  type: 'essential' | 'non-essential' | 'income' | 'info';
  title: string;
  message: string;
  timestamp: string;
}

interface RealtimeContextType {
  transactions: Transaction[];
  devices: HardwareDevice[];
  budget: Budget;
  hardwareLogs: HardwareActivityLog[];
  toasts: ToastNotification[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'user_id' | 'timestamp'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  triggerHardwareButtonPress: (deviceId: string, type: 'essential' | 'non-essential', customAmount?: number) => Promise<void>;
  updateDeviceSettings: (deviceId: string, essentialAmt: number, nonEssentialAmt: number) => void;
  registerDevice: (deviceId: string, name: string) => void;
  updateBudget: (total: number, essential: number, nonEssential: number) => void;
  removeToast: (id: string) => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [devices, setDevices] = useState<HardwareDevice[]>(mockDevices);
  const [budget, setBudget] = useState<Budget>(mockBudget);
  const [hardwareLogs, setHardwareLogs] = useState<HardwareActivityLog[]>([
    {
      id: 'log-1',
      timestamp: new Date(Date.now() - 1000 * 60 * 12).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      deviceId: 'ESP32-001',
      expenseType: 'essential',
      amount: 100,
      status: 'created',
    },
    {
      id: 'log-2',
      timestamp: new Date(Date.now() - 1000 * 60 * 35).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      deviceId: 'ESP32-001',
      expenseType: 'non-essential',
      amount: 200,
      status: 'created',
    }
  ]);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Push Toast notification helper
  const addToast = (type: ToastNotification['type'], title: string, message: string) => {
    const toast: ToastNotification = {
      id: 'toast-' + Date.now(),
      type,
      title,
      message,
      timestamp: new Date().toLocaleTimeString(),
    };
    setToasts(prev => [toast, ...prev].slice(0, 5));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toast.id));
    }, 6000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Load and subscribe to transactions for the logged-in user
  useEffect(() => {
    if (!isConfigured || !user?.id) {
      setTransactions([]);
      return;
    }

    let active = true;

    const loadTransactions = async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false });

      if (!active) return;

      if (error) {
        console.error('Failed to load transactions:', error.message);
        addToast('info', 'Loading Failed', 'Could not load transactions from the database.');
        return;
      }

      setTransactions(data || []);
    };

    const channel = supabase
      .channel(`transactions-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (!active) return;

          const newTx = payload.new as Transaction;

          setTransactions((prev) =>
            prev.some((tx) => tx.id === newTx.id)
              ? prev
              : [newTx, ...prev]
          );
        }
      )
      .subscribe();

    loadTransactions();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const addTransaction = async (
    txData: Omit<Transaction, 'id' | 'user_id' | 'timestamp'>
  ): Promise<void> => {
    if (!user?.id) {
      addToast('info', 'Not Logged In', 'Please log in before adding a transaction.');
      return;
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        amount: txData.amount,
        transaction_type: txData.transaction_type,
        expense_classification: txData.expense_classification ?? null,
        category: txData.category,
        source: txData.source,
        description: txData.description ?? null,
        device_id: txData.device_id ?? null,
        timestamp: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save transaction:', error.message);
      addToast('info', 'Save Failed', error.message);
      return;
    }

    setTransactions(prev =>
      prev.some(tx => tx.id === data.id) ? prev : [data as Transaction, ...prev]
    );

    addToast(
      data.transaction_type === 'income' ? 'income' : (data.expense_classification || 'essential'),
      'Transaction Recorded',
      `Added ${data.category} for ₹${data.amount}`
    );
  };

  const deleteTransaction = async (id: string): Promise<void> => {
    if (!user?.id) {
      addToast('info', 'Not Logged In', 'Please log in first.');
      return;
    }

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Failed to delete transaction:', error.message);
      addToast('info', 'Delete Failed', error.message);
      return;
    }

    setTransactions(prev => prev.filter(t => t.id !== id));
    addToast('info', 'Transaction Removed', 'Transaction deleted successfully.');
  };

  // Hardware Button Trigger Action (used by Live Hardware Simulator & Server API)
  const triggerHardwareButtonPress = async (deviceId: string, type: 'essential' | 'non-essential', customAmount?: number) => {
    const targetDev = devices.find(d => d.device_id === deviceId);
    let amountToUse = customAmount || (type === 'essential' ? (targetDev?.default_essential_amount || 100) : (targetDev?.default_non_essential_amount || 200));

    try {
      const res = await fetch('/api/hardware/expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          expenseType: type,
          amount: customAmount,
          timestamp: new Date().toISOString(),
          requestId: 'req-' + Date.now()
        })
      });
      if (res.ok) {
        const body = await res.json();
        if (body.transaction?.amount) {
          amountToUse = body.transaction.amount;
        }
      }
    } catch {
      // Fallback to local execution if backend API runner is offline
    }

    const createdTx: Transaction = {
      id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      user_id: 'usr-demo-001',
      device_id: deviceId,
      amount: amountToUse,
      transaction_type: 'expense',
      expense_classification: type,
      category: type === 'essential' ? 'Essential Hardware' : 'Non-Essential Hardware',
      source: 'hardware',
      description: `Triggered via ${targetDev?.device_name || deviceId} [${type.toUpperCase()}]`,
      timestamp: new Date().toISOString(),
      hardware_device: {
        device_id: deviceId,
        device_name: targetDev?.device_name || 'ESP32 Device'
      }
    };

    setTransactions(prev => [createdTx, ...prev]);

    // Update Device Last Active & Total
    setDevices(prev => prev.map(d => {
      if (d.device_id === deviceId) {
        return {
          ...d,
          status: 'online',
          last_seen: new Date().toISOString(),
          total_transactions: (d.total_transactions || 0) + 1,
          last_transaction: createdTx,
        };
      }
      return d;
    }));

    // Update Hardware Logs
    setHardwareLogs(prev => [
      {
        id: 'log-' + Date.now(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        deviceId,
        expenseType: type,
        amount: amountToUse,
        status: 'created',
      },
      ...prev
    ]);

    // Trigger Visual Toast Notification
    addToast(
      type === 'essential' ? 'essential' : 'non-essential',
      `Physical Button Triggered (${type.toUpperCase()})`,
      `₹${amountToUse} recorded from ${deviceId} in real-time!`
    );
  };

  const updateDeviceSettings = (deviceId: string, essentialAmt: number, nonEssentialAmt: number) => {
    setDevices(prev => prev.map(d => {
      if (d.device_id === deviceId) {
        return {
          ...d,
          default_essential_amount: essentialAmt,
          default_non_essential_amount: nonEssentialAmt,
        };
      }
      return d;
    }));
    addToast('info', 'Hardware Settings Saved', `Default amounts for ${deviceId} updated.`);
  };

  const registerDevice = (deviceId: string, name: string) => {
    const newDev: HardwareDevice = {
      id: 'dev-' + Date.now(),
      user_id: 'usr-demo-001',
      device_id: deviceId.trim().toUpperCase(),
      device_name: name.trim(),
      status: 'online',
      default_essential_amount: 100,
      default_non_essential_amount: 200,
      last_seen: new Date().toISOString(),
      created_at: new Date().toISOString(),
      total_transactions: 0,
    };
    setDevices(prev => [...prev, newDev]);
    addToast('info', 'New Device Registered', `${newDev.device_name} (${newDev.device_id}) is ready.`);
  };

  const updateBudget = (total: number, essential: number, nonEssential: number) => {
    setBudget(prev => ({
      ...prev,
      total_budget_amount: total,
      essential_budget: essential,
      non_essential_budget: nonEssential,
    }));
    addToast('info', 'Monthly Budget Updated', `New budget target set to ₹${total}`);
  };

  return (
    <RealtimeContext.Provider value={{
      transactions,
      devices,
      budget,
      hardwareLogs,
      toasts,
      addTransaction,
      deleteTransaction,
      triggerHardwareButtonPress,
      updateDeviceSettings,
      registerDevice,
      updateBudget,
      removeToast,
    }}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};
