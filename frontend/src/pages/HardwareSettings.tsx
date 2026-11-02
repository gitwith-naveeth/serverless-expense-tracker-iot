import React, { useState } from 'react';
import { useRealtime } from '../context/RealtimeContext';
import { useAuth } from '../context/AuthContext';
import { Settings, Save, Code, Zap, Coffee, Copy, Check } from 'lucide-react';

export const HardwareSettings: React.FC = () => {
  const { devices, updateDeviceSettings } = useRealtime();
  const { user } = useAuth();

  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(devices[0]?.device_id || 'ESP32-001');
  const targetDev = devices.find(d => d.device_id === selectedDeviceId) || devices[0];

  const [essentialAmt, setEssentialAmt] = useState<number>(targetDev?.default_essential_amount || 100);
  const [nonEssentialAmt, setNonEssentialAmt] = useState<number>(targetDev?.default_non_essential_amount || 200);
  const [copied, setCopied] = useState(false);

  const currency = user?.currency === 'USD' ? '$' : user?.currency === 'EUR' ? '€' : '₹';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateDeviceSettings(selectedDeviceId, essentialAmt, nonEssentialAmt);
  };

  const codeSnippet = `// ESP32 Config Header for ${selectedDeviceId}
const char* WIFI_SSID     = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* API_ENDPOINT  = "https://your-domain.vercel.app/api/hardware/expense";
const char* DEVICE_ID     = "${selectedDeviceId}";
const char* DEVICE_TOKEN  = "YOUR_DEVICE_TOKEN"; // Replace with the token generated during pairing.

// Target Default Amounts Configured on Server:
// Essential (Btn 1): ${currency}${essentialAmt}
// Non-Essential (Btn 2): ${currency}${nonEssentialAmt}`;

  const copyCode = () => {
    navigator.clipboard.writeText(codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Hardware Integration Settings</h1>
          <p className="page-subtitle">
            Configure transaction amounts assigned to physical push button presses.
          </p>
        </div>
      </div>

      <div className="grid-2">
        {/* Hardware Amounts Config Form */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={20} color="var(--primary)" />
            Configure Hardware Push Button Amounts
          </h3>

          <form onSubmit={handleSave}>
            <div className="form-group">
              <label>Select Device</label>
              <select
                value={selectedDeviceId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedDeviceId(id);
                  const d = devices.find(x => x.device_id === id);
                  if (d) {
                    setEssentialAmt(d.default_essential_amount);
                    setNonEssentialAmt(d.default_non_essential_amount);
                  }
                }}
                className="form-control"
              >
                {devices.map(d => (
                  <option key={d.id} value={d.device_id}>{d.device_name} ({d.device_id})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#34d399' }}>
                <Zap size={16} /> Essential Button Amount ({currency})
              </label>
              <input
                type="number"
                required
                value={essentialAmt}
                onChange={(e) => setEssentialAmt(Number(e.target.value))}
                className="form-control"
                style={{ fontSize: '1.1rem', fontWeight: 700 }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Amount logged whenever physical Button 1 (GPIO 18) is pressed.
              </span>
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fbbf24' }}>
                <Coffee size={16} /> Non-Essential Button Amount ({currency})
              </label>
              <input
                type="number"
                required
                value={nonEssentialAmt}
                onChange={(e) => setNonEssentialAmt(Number(e.target.value))}
                className="form-control"
                style={{ fontSize: '1.1rem', fontWeight: 700 }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Amount logged whenever physical Button 2 (GPIO 19) is pressed.
              </span>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              <Save size={18} /> Save Hardware Settings
            </button>
          </form>
        </div>

        {/* ESP32 Firmware Config Snippet */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Code size={20} color="#a78bfa" />
              ESP32 C++ Code Header
            </h3>
            <button onClick={copyCode} className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
              {copied ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>

          <pre style={{
            background: '#090d16',
            padding: '1.2rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.82rem',
            color: '#a78bfa',
            overflowX: 'auto',
            lineHeight: 1.6
          }}>
            {codeSnippet}
          </pre>
        </div>
      </div>
    </div>
  );
};
