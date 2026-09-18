import React, { useState } from 'react';
import { useRealtime } from '../context/RealtimeContext';
import { useAuth } from '../context/AuthContext';
import { Cpu, Zap, Play, Settings2, CheckCircle2 } from 'lucide-react';

export const InteractiveHardwareSimulator: React.FC = () => {
  const { devices, triggerHardwareButtonPress } = useRealtime();
  const { user } = useAuth();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(devices[0]?.device_id || 'ESP32-001');
  const [loadingType, setLoadingType] = useState<'essential' | 'non-essential' | null>(null);

  const activeDev = devices.find(d => d.device_id === selectedDeviceId) || devices[0];
  const currency = user?.currency === 'USD' ? '$' : user?.currency === 'EUR' ? '€' : '₹';

  const handlePress = async (type: 'essential' | 'non-essential') => {
    setLoadingType(type);
    await triggerHardwareButtonPress(selectedDeviceId, type);
    setLoadingType(null);
  };

  return (
    <div className="glass-card" style={{
      border: '1px solid rgba(139, 92, 246, 0.3)',
      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(17, 24, 39, 0.8) 100%)'
    }}>
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '1rem',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '1.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
          }}>
            <Cpu size={20} color="#ffffff" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
              HARDWARE TEST SIMULATOR
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#a78bfa', fontWeight: 500 }}>
              Fires real HTTPS requests to Serverless API (/api/hardware/expense)
            </span>
          </div>
        </div>

        <span className="badge badge-hardware" style={{ padding: '0.35rem 0.75rem' }}>
          Test / Demo Input
        </span>
      </div>

      {/* Device Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
            Target ESP32 Device:
          </label>
          <select
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            className="form-control"
            style={{ width: '100%' }}
          >
            {devices.map(dev => (
              <option key={dev.id} value={dev.device_id}>
                {dev.device_name} ({dev.device_id})
              </option>
            ))}
          </select>
        </div>

        <div style={{
          padding: '0.75rem 1rem',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)',
          fontSize: '0.8rem'
        }}>
          <div style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>Configured Values</div>
          <div style={{ color: '#ffffff', fontWeight: 700, marginTop: '0.15rem' }}>
            Essential: <span style={{ color: '#34d399' }}>{currency}{activeDev?.default_essential_amount || 100}</span> | Non-Essential: <span style={{ color: '#fbbf24' }}>{currency}{activeDev?.default_non_essential_amount || 200}</span>
          </div>
        </div>
      </div>

      {/* Simulated Hardware Push Buttons */}
      <div className="grid-2">
        <button
          onClick={() => handlePress('essential')}
          disabled={loadingType !== null}
          className="btn btn-essential"
          style={{
            padding: '1.2rem 1.5rem',
            fontSize: '1rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={20} />
            <span>PRESS ESSENTIAL BUTTON</span>
          </div>
          <span style={{ fontSize: '0.75rem', opacity: 0.9, fontWeight: 400 }}>
            Simulate GPIO 18 Press (-{currency}{activeDev?.default_essential_amount || 100})
          </span>
        </button>

        <button
          onClick={() => handlePress('non-essential')}
          disabled={loadingType !== null}
          className="btn btn-non-essential"
          style={{
            padding: '1.2rem 1.5rem',
            fontSize: '1rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={20} />
            <span>PRESS NON-ESSENTIAL BUTTON</span>
          </div>
          <span style={{ fontSize: '0.75rem', opacity: 0.9, fontWeight: 400 }}>
            Simulate GPIO 19 Press (-{currency}{activeDev?.default_non_essential_amount || 200})
          </span>
        </button>
      </div>
    </div>
  );
};
