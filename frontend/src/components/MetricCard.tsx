import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor: string;
  glowColor?: string;
  badge?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  glowColor,
  badge
}) => {
  return (
    <div className="glass-card" style={{ position: 'relative', overflow: 'hidden' }}>
      {glowColor && (
        <div style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '100px',
          height: '100px',
          background: glowColor,
          filter: 'blur(40px)',
          borderRadius: '50%',
          opacity: 0.4,
          pointerEvents: 'none'
        }} />
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </span>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'rgba(255, 255, 255, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon size={20} color={iconColor} />
        </div>
      </div>

      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
        {value}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.4rem' }}>
        {subtitle && (
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            {subtitle}
          </span>
        )}
        {badge && (
          <span className="badge badge-hardware" style={{ fontSize: '0.65rem' }}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
};
