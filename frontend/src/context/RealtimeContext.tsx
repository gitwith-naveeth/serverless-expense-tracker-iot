import React, { createContext, useContext, useState, useEffect } from 'react';
import { Transaction, HardwareDevice, HardwareActivityLog, Budget } from '../types';
import { initialMockTransactions, mockDevices, mockBudget } from '../services/mockData';
import { supabase, isConfigured } from '../services/supabaseClient';

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
  addTransaction: (tx: Omit<Transaction, 'id' | 'user_id' | 'timestamp'>) => void;
  deleteTransaction: (id: string) => void;
  triggerHardwareButtonPress: (deviceId: string, type: 'essential' | 'non-essential', customAmount?: number) => Promise<void>;
  updateDeviceSettings: (deviceId: string, essentialAmt: number, nonEssentialAmt: number) => void;
  registerDevice: (deviceId: string, name: string) => void;
  updateBudget: (total: number, essential: number, nonEssential: number) => void;
  removeToast: (id: string) => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(initialMockTransactions);
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

  // Realtime subscription setup if Supabase live is attached
  useEffect(() => {
    if (isConfigured) {
      const channel = supabase
        .channel('public:transactions')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'transactions' },
          (payload) => {
            const newTx = payload.new as Transaction;
            setTransactions(prev => [newTx, ...prev]);

            if (newTx.source === 'hardware') {
              addToast(
                newTx.expense_classification === 'essential' ? 'essential' : 'non-essential',
                `Hardware Button Pressed!`,
                `${newTx.expense_classification?.toUpperCase()} expense of ₹${newTx.amount} recorded from ${newTx.device_id || 'ESP32'}`
              );

              setHardwareLogs(prev => [
                {
                  id: 'log-' + Date.now(),
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                  deviceId: newTx.device_id || 'ESP32-001',
                  expenseType: (newTx.expense_classification as any) || 'essential',
                  amount: newTx.amount,
                  status: 'created',
                },
                ...prev
              ]);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  const addTransaction = (txData: Omit<Transaction, 'id' | 'user_id' | 'timestamp'>) => {
    const newTx: Transaction = {
      ...txData,
      id: 'tx-' + Date.now(),
      user_id: 'usr-demo-001',
      timestamp: new Date().toISOString(),
    };

    setTransactions(prev => [newTx, ...prev]);
    addToast(
      newTx.transaction_type === 'income' ? 'income' : (newTx.expense_classification || 'essential'),
      'Transaction Recorded',
      `Added ${newTx.category} for ₹${newTx.amount}`
    );
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    addToast('info', 'Transaction Removed', 'Selected transaction was deleted.');
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
