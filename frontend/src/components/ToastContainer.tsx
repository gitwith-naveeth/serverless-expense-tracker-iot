import React from 'react';
import { useRealtime } from '../context/RealtimeContext';
import { Cpu, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useRealtime();

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      right: '1.5rem',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      maxWidth: '420px',
      width: '100%',
      pointerEvents: 'none'
    }}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="glass-card"
          style={{
            pointerEvents: 'auto',
            padding: '1rem 1.2rem',
            borderLeft: `4px solid ${
              toast.type === 'essential' ? '#10b981' :
              toast.type === 'non-essential' ? '#f59e0b' :
              toast.type === 'income' ? '#06b6d4' : '#6366f1'
            }`,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.85rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            animation: 'slideIn 0.3s ease forwards'
          }}
        >
          <div style={{ marginTop: '0.15rem' }}>
            {toast.type === 'essential' ? <Cpu size={20} color="#10b981" /> :
             toast.type === 'non-essential' ? <Cpu size={20} color="#f59e0b" /> :
             toast.type === 'income' ? <CheckCircle2 size={20} color="#06b6d4" /> :
             <Info size={20} color="#6366f1" />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '0.9rem', color: '#ffffff' }}>{toast.title}</strong>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{toast.timestamp}</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {toast.message}
            </p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};
