import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, DollarSign, Shield, Cpu, Key } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, updateProfileCurrency, logout } = useAuth();

  return (
    <div style={{ maxWidth: '720px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">User Account & Settings</h1>
          <p className="page-subtitle">Manage profile details, security credentials, and preferred currency.</p>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            fontWeight: 800,
            color: '#ffffff',
            boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)'
          }}>
            {user?.full_name?.substring(0, 2).toUpperCase() || 'US'}
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
              {user?.full_name || 'Alex Mercer'}
            </h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {user?.email || 'alex.mercer@cloudfinance.io'}
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>Default Display Currency</label>
          <select
            value={user?.currency || 'INR'}
            onChange={(e) => updateProfileCurrency(e.target.value)}
            className="form-control"
            style={{ maxWidth: '300px' }}
          >
            <option value="INR">Indian Rupee (₹ INR)</option>
            <option value="USD">US Dollar ($ USD)</option>
            <option value="EUR">Euro (€ EUR)</option>
            <option value="GBP">British Pound (£ GBP)</option>
          </select>
        </div>
      </div>

      <div className="glass-card" style={{ border: '1px solid rgba(239, 68, 68, 0.3)' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ef4444', marginBottom: '0.75rem' }}>
          Account Session
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Sign out of your active session on this device.
        </p>
        <button onClick={logout} className="btn btn-danger">
          Sign Out of Account
        </button>
      </div>
    </div>
  );
};
