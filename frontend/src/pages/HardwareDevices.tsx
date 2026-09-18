import React, { useState } from 'react';
import { useRealtime } from '../context/RealtimeContext';
import { useAuth } from '../context/AuthContext';
import { InteractiveHardwareSimulator } from '../components/InteractiveHardwareSimulator';
import { Cpu, Plus, Wifi, Zap, Coffee, ShieldCheck, Key, RefreshCw, CheckCircle2 } from 'lucide-react';

export const HardwareDevices: React.FC = () => {
  const { devices, registerDevice } = useRealtime();
  const { user } = useAuth();

  const [newDeviceId, setNewDeviceId] = useState('');
  const [newDeviceName, setNewDeviceName] = useState('');
  const [showRegModal, setShowRegModal] = useState(false);
  const [generatedSecret, setGeneratedSecret] = useState<string | null>(null);

  const currency = user?.currency === 'USD' ? '$' : user?.currency === 'EUR' ? '€' : '₹';

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceId.trim() || !newDeviceName.trim()) return;

    registerDevice(newDeviceId, newDeviceName);
    const secret = 'esp32_sec_' + Math.random().toString(36).substr(2, 16);
    setGeneratedSecret(secret);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Hardware Devices Hub</h1>
          <p className="page-subtitle">
            Manage your physical ESP32 microcontrollers, device tokens, and real-time push button inputs.
          </p>
        </div>

        <button onClick={() => setShowRegModal(!showRegModal)} className="btn btn-primary">
          <Plus size={18} /> Register New ESP32 Device
        </button>
      </div>

      {/* Device Registration Form Modal */}
      {showRegModal && (
        <div className="glass-card" style={{ marginBottom: '2rem', border: '1px solid var(--primary-glow)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '1rem' }}>
            Register ESP32 Hardware Unit
          </h3>

          {!generatedSecret ? (
            <form onSubmit={handleRegister}>
              <div className="grid-2">
                <div className="form-group">
                  <label>Hardware Device ID (Unique identifier)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ESP32-003"
                    value={newDeviceId}
                    onChange={(e) => setNewDeviceId(e.target.value)}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label>Friendly Device Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Office Desk Button Box"
                    value={newDeviceName}
                    onChange={(e) => setNewDeviceName(e.target.value)}
                    className="form-control"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary">
                  Generate Device Pair Key
                </button>
                <button type="button" onClick={() => setShowRegModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontWeight: 700 }}>
                <CheckCircle2 size={18} /> Device Registered Successfully!
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Copy the secret token below into your ESP32 C++ firmware code:
              </p>
              <div style={{
                background: '#000000',
                padding: '0.75rem',
                borderRadius: '6px',
                fontFamily: 'var(--font-mono)',
                color: '#fbbf24',
                fontSize: '0.9rem',
                marginTop: '0.5rem',
                userSelect: 'all'
              }}>
                const char* DEVICE_TOKEN = "{generatedSecret}";
              </div>
              <button
                onClick={() => { setShowRegModal(false); setGeneratedSecret(null); setNewDeviceId(''); setNewDeviceName(''); }}
                className="btn btn-secondary"
                style={{ marginTop: '1rem' }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      )}

      {/* Embedded Live Test Simulator */}
      <div style={{ marginBottom: '2rem' }}>
        <InteractiveHardwareSimulator />
      </div>

      {/* Devices Grid */}
      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '1rem' }}>
        Registered Physical Devices ({devices.length})
      </h3>

      <div className="grid-2">
        {devices.map(dev => (
          <div
            key={dev.id}
            className="glass-card"
            style={{
              border: dev.status === 'online' ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid var(--border-color)',
              position: 'relative'
            }}
          >
            {/* Top row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: dev.status === 'online' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Cpu size={24} color={dev.status === 'online' ? '#34d399' : '#9ca3af'} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>{dev.device_name}</h4>
                  <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: '#a78bfa' }}>
                    ID: {dev.device_id}
                  </div>
                </div>
              </div>

              <span className={dev.status === 'online' ? 'badge badge-online' : 'badge badge-offline'}>
                <div className="pulse-dot" style={{ backgroundColor: dev.status === 'online' ? '#34d399' : '#f87171' }} />
                {dev.status.toUpperCase()}
              </span>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid-2" style={{ gap: '0.75rem', marginBottom: '1rem', background: 'rgba(0, 0, 0, 0.25)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Last Activity</span>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff' }}>
                  {dev.last_seen ? new Date(dev.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Never'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Total Button Presses</span>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399' }}>
                  {dev.total_transactions || 24} Transactions
                </div>
              </div>
            </div>

            {/* Button Configuration Status */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div style={{
                flex: 1,
                padding: '0.65rem 0.85rem',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#34d399', fontWeight: 700 }}>
                  <Zap size={14} /> Essential Button (GPIO 18)
                </div>
                <div style={{ color: 'var(--text-muted)', marginTop: '0.2rem', fontSize: '0.75rem' }}>
                  Default Amount: {currency}{dev.default_essential_amount}
                </div>
              </div>

              <div style={{
                flex: 1,
                padding: '0.65rem 0.85rem',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#fbbf24', fontWeight: 700 }}>
                  <Coffee size={14} /> Non-Essential Button (GPIO 19)
                </div>
                <div style={{ color: 'var(--text-muted)', marginTop: '0.2rem', fontSize: '0.75rem' }}>
                  Default Amount: {currency}{dev.default_non_essential_amount}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
