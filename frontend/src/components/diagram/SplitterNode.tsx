import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { IntegratedPower } from './DiagramUtils';

interface SplitterNodeProps {
  data: {
    label: string;
    splitterType?: string;
    powers?: Record<number, number>;
  };
}

const SplitterNode: React.FC<SplitterNodeProps> = ({ data }) => {
  const outputCount = parseInt(data.splitterType?.split('x')[1] || '8');

  return (
    <div
      style={{
        padding: '0',
        borderRadius: '20px',
        background: 'linear-gradient(165deg, rgba(88, 28, 135, 0.55), rgba(15, 23, 42, 0.98))',
        border: '1.5px solid rgba(167, 139, 250, 0.6)',
        textAlign: 'center',
        minWidth: '160px',
        backdropFilter: 'blur(30px)',
        boxShadow: '0 16px 64px rgba(0,0,0,0.7)',
        overflow: 'hidden'
      }}
    >
      <div style={{
        padding: '12px',
        background: 'rgba(167, 139, 250, 0.1)',
        borderBottom: '1px solid rgba(167, 139, 250, 0.2)',
      }}>
        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'white', letterSpacing: '0.02em' }}>{data.label}</div>
        <div style={{ fontSize: '0.62rem', color: '#a78bfa', fontWeight: 900, letterSpacing: '0.2em', marginTop: '2px' }}>
          {data.splitterType}
        </div>
      </div>

      <div style={{ padding: '14px', position: 'relative' }}>
        {/* Input Handle Wrapper */}
        <div style={{ position: 'absolute', left: '-1px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
          <div style={{ fontSize: '0.5rem', color: '#a78bfa', fontWeight: 900, transform: 'rotate(-90deg)', marginBottom: '40px', position: 'absolute', left: '12px' }}>IN</div>
          <Handle
            type="target"
            position={Position.Left}
            id="splitter-in"
            style={{
              background: '#a78bfa',
              border: '2px solid white',
              width: '14px',
              height: '14px',
              boxShadow: '0 0 10px rgba(167, 139, 250, 0.6)'
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '4px' }}>
          {Array.from({ length: outputCount }).map((_, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '8px',
                padding: '2px 10px',
                position: 'relative'
              }}
            >
              <span style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 700 }}>P{i + 1}</span>
              <IntegratedPower power={data.powers?.[i]} />
              <Handle
                type="source"
                position={Position.Right}
                id={`out-${i}`}
                style={{
                  background: '#22d3ee',
                  border: '1.5px solid white',
                  width: '10px',
                  height: '10px',
                  top: 'auto',
                  boxShadow: '0 0 8px rgba(34, 211, 238, 0.5)'
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SplitterNode;
