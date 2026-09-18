import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import { Cpu, PlusCircle, Bell, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, updateProfileCurrency } = useAuth();
  const { devices, transactions } = useRealtime();
  const navigate = useNavigate();

  const activeDevice = devices.find(d => d.status === 'online');
  const currencySymbol = user?.currency === 'USD' ? '$' : user?.currency === 'EUR' ? '€' : '₹';

  return (
    <header style={{
      height: '70px',
      borderBottom: '1px solid var(--border-color)',
      background: 'rgba(11, 15, 25, 0.8)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Hardware Online Status Indicator */}
        <div 
          onClick={() => navigate('/hardware/devices')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.4rem 0.8rem',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '0.8rem'
          }}
        >
          <div className="pulse-dot" style={{ backgroundColor: activeDevice ? '#34d399' : '#f87171' }} />
          <Cpu size={15} color={activeDevice ? '#a78bfa' : '#9ca3af'} />
          <span style={{ fontWeight: 600, color: activeDevice ? '#ffffff' : 'var(--text-muted)' }}>
            {activeDevice ? `Hardware: ${activeDevice.device_id}` : 'Hardware Offline'}
          </span>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <RefreshCw size={12} className="spin-slow" />
          <span>Realtime Serverless Sync Active</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Currency Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Currency:</span>
          <select
            value={user?.currency || 'INR'}
            onChange={(e) => updateProfileCurrency(e.target.value)}
            className="form-control"
            style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', width: 'auto' }}
          >
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </div>

        {/* Quick Add Expense Action */}
        <button
          onClick={() => navigate('/add-transaction')}
          className="btn btn-primary"
          style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
        >
          <PlusCircle size={16} />
          <span>Add Transaction</span>
        </button>
      </div>
    </header>
  );
};
