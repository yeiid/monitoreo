import React from 'react';

// ── Power Budget Helpers ──
export const getPowerColor = (p?: number | null) => {
  if (p === undefined || p === null) return '#94a3b8';
  if (p > -24.0) return '#10b981'; // Green (Excellent)
  if (p > -27.0) return '#f59e0b'; // Amber (Aceptable)
  return '#ef4444'; // Red (Critical)
};

export const IntegratedPower: React.FC<{ power?: number | null }> = ({ power }) => {
  if (power === undefined || power === null) return null;
  return (
    <span style={{
      fontSize: '0.62rem',
      color: getPowerColor(power),
      fontWeight: 'bold',
      marginLeft: '5px',
      background: `${getPowerColor(power)}18`,
      padding: '1px 5px',
      borderRadius: '4px',
      border: `1px solid ${getPowerColor(power)}33`,
      fontFamily: 'monospace',
      boxShadow: `0 0 10px ${getPowerColor(power)}22`
    }}>
      {Number(power).toFixed(1)} <span style={{ fontSize: '0.5rem', opacity: 0.7 }}>dBm</span>
    </span>
  );
};
