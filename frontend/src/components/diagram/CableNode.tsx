import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { FIBER_COLORS } from '../map/types';
import { IntegratedPower } from './DiagramUtils';

interface CableNodeProps {
  data: {
    label: string;
    side: 'input' | 'output';
    buffers?: any[];
    powers?: Record<number, number>;
  };
}

const CableNode: React.FC<CableNodeProps> = ({ data }) => {
  const isInput = data.side === 'input';

  return (
    <div
      style={{
        padding: '0',
        borderRadius: '16px',
        background: 'rgba(15, 15, 25, 0.98)',
        border: `1px solid ${isInput ? 'rgba(167, 139, 250, 0.4)' : 'rgba(52, 211, 153, 0.4)'}`,
        minWidth: '220px',
        backdropFilter: 'blur(30px)',
        boxShadow: `0 12px 48px ${isInput ? 'rgba(167, 139, 250, 0.15)' : 'rgba(52, 211, 153, 0.15)'}`,
        overflow: 'hidden'
      }}
    >
      <div style={{
        padding: '10px 14px',
        background: 'transparent',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
      }}>
        <div style={{
          fontSize: '0.5rem',
          fontWeight: 800,
          color: '#94a3b8',
          letterSpacing: '0.15em',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          {isInput ? '— ENTRADA' : 'SALIDA —'}
        </div>
        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'white' }}>{data.label}</div>
      </div>

      <div style={{ padding: '12px', maxHeight: '500px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', overflowX: 'hidden' }}>
        {data.buffers?.map((tube: any, tubeIdx: number) => (
          <div key={tubeIdx} style={{
            display: 'flex', flexDirection: 'column', gap: '4px'
          }}>
            {/* Si quisieras mostrar el buffer, lo activas acá. Por ahora lo removemos para que quede idéntico a la captura que es una lista continua */}
            {tube.strands?.map((strand: any, idx: number) => {
              const bgColor = FIBER_COLORS[strand.color] || strand.color || '#fff';
              return (
                <div
                  key={strand.id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    position: 'relative',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.03)',
                    flexDirection: isInput ? 'row' : 'row'
                  }}
                >
                  <Handle
                    type={isInput ? 'source' : 'target'}
                    position={isInput ? Position.Right : Position.Left}
                    id={strand.id}
                    style={{
                      background: bgColor,
                      width: '12px',
                      height: '12px',
                      border: '2px solid rgba(15, 15, 25, 0.9)',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      [isInput ? 'right' : 'left']: '-6px',
                      zIndex: 10
                    }}
                  />

                  {/* Salida: Mostrar los cuadrados a la izquierda y el texto, Handle a la izquierda */}
                  <div
                    style={{
                      width: '14px',
                      height: '14px',
                      backgroundColor: bgColor,
                      borderRadius: '4px',
                      border: strand.color === 'blanco' ? '1px solid #444' : 'none',
                      flexShrink: 0,
                      boxShadow: `0 0 10px ${bgColor}44`
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                    <span style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 600, textTransform: 'lowercase' }}>
                      #{strand.index || idx + 1} {strand.color}
                    </span>
                    {data.powers && <IntegratedPower power={data.powers[strand.id]} />}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CableNode;
