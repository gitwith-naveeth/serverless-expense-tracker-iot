import React, { useState } from 'react';
import { useRealtime } from '../context/RealtimeContext';
import { useAuth } from '../context/AuthContext';
import { InteractiveHardwareSimulator } from '../components/InteractiveHardwareSimulator';
import { supabase } from '../services/supabaseClient';
import { Cpu, Plus, Zap, Coffee, Copy, Check, CheckCircle2, RefreshCw } from 'lucide-react';

export const HardwareDevices: React.FC = () => {
  const { devices, devicesLoading, devicesError, refreshDevices } = useRealtime();
  const { user } = useAuth();

  const [newDeviceName, setNewDeviceName] = useState('');
  const [showRegModal, setShowRegModal] = useState(false);
  const [generatedSecret, setGeneratedSecret] = useState<string | null>(null);
  const [registeredDevice, setRegisteredDevice] = useState<{ deviceName: string; deviceId: string } | null>(null);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const currency = user?.currency === 'USD' ? '$' : user?.currency === 'EUR' ? '€' : '₹';

  const closePairingView = () => {
    setShowRegModal(false);
    setGeneratedSecret(null);
    setRegisteredDevice(null);
    setNewDeviceName('');
    setRegistrationError(null);
    setCopied(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceName.trim()) return;

    setRegistrationLoading(true);
    setRegistrationError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        setRegistrationError('Your session has expired. Please sign in again.');
        return;
      }

      const response = await fetch('/api/hardware/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ deviceName: newDeviceName.trim() })
      });
      const body = await response.json() as {
        device?: { device_name: string; device_id: string };
        deviceSecret?: string;
        error?: string;
      };

      if (!response.ok) {
        setRegistrationError(
          response.status === 401
            ? 'Your session has expired. Please sign in again.'
            : body.error || 'Unable to register this device.'
        );
        return;
      }

      if (!body.device || !body.deviceSecret) {
        setRegistrationError('The registration response was incomplete. Please try again.');
        return;
      }

      setRegisteredDevice({
        deviceName: body.device.device_name,
        deviceId: body.device.device_id
      });
      setGeneratedSecret(body.deviceSecret);
      await refreshDevices();
    } catch (error) {
      setRegistrationError(error instanceof Error ? error.message : 'Unable to register this device.');
    } finally {
      setRegistrationLoading(false);
    }
  };

  const copySecret = async () => {
    if (!generatedSecret) return;
    try {
      await navigator.clipboard.writeText(generatedSecret);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setRegistrationError('Unable to copy the secret. Please select and copy it manually.');
    }
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
              <div className="form-group">
                <label>Friendly Device Name</label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  placeholder="e.g. Office Desk Button Box"
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  className="form-control"
                />
              </div>

              {registrationError && <p style={{ color: '#f87171', fontSize: '0.85rem' }}>{registrationError}</p>}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" disabled={registrationLoading}>
                  {registrationLoading ? 'Registering...' : 'Generate Device Pair Key'}
                </button>
                <button type="button" onClick={closePairingView} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontWeight: 700 }}>
                <CheckCircle2 size={18} /> Device Registered Successfully
              </div>
              <p style={{ fontSize: '0.85rem', color: '#ffffff', marginTop: '0.75rem' }}>
                {registeredDevice?.deviceName} ({registeredDevice?.deviceId})
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Copy and save this secret now. It cannot be retrieved later.
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
                {generatedSecret}
              </div>
              <button type="button" onClick={copySecret} className="btn btn-secondary" style={{ marginTop: '0.75rem' }}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied' : 'Copy Secret'}
              </button>
              <button
                onClick={closePairingView}
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
        Registered Physical Devices ({devices.length})
      </h3>
      <button type="button" onClick={() => refreshDevices()} className="btn btn-secondary" disabled={devicesLoading}>
        <RefreshCw size={16} /> Refresh
      </button>
      </div>

      {devicesError && <p style={{ color: '#f87171', marginBottom: '1rem' }}>{devicesError}</p>}
      {devicesLoading && <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Loading registered devices...</p>}
      {!devicesLoading && !devicesError && devices.length === 0 && (
        <div className="glass-card" style={{ marginBottom: '1rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>No hardware devices are registered yet.</p>
        </div>
      )}

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
                  {dev.total_transactions || 0} Transactions
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
