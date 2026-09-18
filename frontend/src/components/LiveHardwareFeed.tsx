import React from 'react';
import { useRealtime } from '../context/RealtimeContext';
import { useAuth } from '../context/AuthContext';
import { Cpu, Radio, ShieldCheck, ArrowUpRight, Zap } from 'lucide-react';

export const LiveHardwareFeed: React.FC = () => {
  const { hardwareLogs, devices } = useRealtime();
  const { user } = useAuth();
  const currency = user?.currency === 'USD' ? '$' : user?.currency === 'EUR' ? '€' : '₹';

  const activeDevice = devices.find(d => d.status === 'online') || devices[0];

  return (
    <div className="glass-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '1rem',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(139, 92, 246, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Radio size={18} color="#a78bfa" />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
              LIVE HARDWARE ACTIVITY
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              Real-time ESP32 IoT Button Stream
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.3rem 0.7rem',
          background: activeDevice?.status === 'online' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          borderRadius: '20px',
          border: `1px solid ${activeDevice?.status === 'online' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          fontSize: '0.75rem',
          fontWeight: 600,
          color: activeDevice?.status === 'online' ? '#34d399' : '#f87171'
        }}>
          <div className="pulse-dot" style={{ backgroundColor: activeDevice?.status === 'online' ? '#34d399' : '#f87171' }} />
          <span>{activeDevice ? `${activeDevice.device_id} Connected` : 'ESP32 Standby'}</span>
        </div>
      </div>

      {/* Logs List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        maxHeight: '380px',
        paddingRight: '0.25rem'
      }}>
        {hardwareLogs.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2.5rem 1rem',
            color: 'var(--text-dim)',
            fontSize: '0.85rem'
          }}>
            <Cpu size={32} color="var(--text-dim)" style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
            No hardware transactions recorded yet.<br />
            Press a button on the ESP32 or use the live simulator!
          </div>
        ) : (
          hardwareLogs.map(log => (
            <div
              key={log.id}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.85rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                borderLeft: `3px solid ${log.expenseType === 'essential' ? '#10b981' : '#f59e0b'}`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: log.expenseType === 'essential' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Zap size={18} color={log.expenseType === 'essential' ? '#34d399' : '#fbbf24'} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>
                      {log.expenseType === 'essential' ? 'Essential Expense' : 'Non-Essential Expense'}
                    </span>
                    <span className="badge badge-hardware" style={{ fontSize: '0.65rem' }}>
                      Hardware
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
                    {log.timestamp} • Device: {log.deviceId}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div className="amount-expense" style={{ fontSize: '1rem' }}>
                  -{currency}{log.amount}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem', justifyContent: 'flex-end' }}>
                  <ShieldCheck size={11} /> Transaction Created
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
