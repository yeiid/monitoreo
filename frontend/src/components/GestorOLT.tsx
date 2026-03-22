import React, { useState } from 'react';
import { X, Cpu, Activity, Info, Layout, Layers } from 'lucide-react';
import { ODFView } from './GestorODF';

interface GestorOLTProps {
    node: {
        id: string;
        name: string;
        node_type: string;
        hardware_details?: {
            cards?: number;
            ports_per_card?: number;
            capacity?: number;
            used_ports?: number;
        };
    };
    onClose: () => void;
}

const GestorOLT: React.FC<GestorOLTProps> = ({ node, onClose }) => {
    const [activeTab, setActiveTab] = useState<'hardware' | 'odf'>('hardware');
    
    const cards = node.hardware_details?.cards || 5;
    const portsPerCard = node.hardware_details?.ports_per_card || 16;

    // Simulation of connected ports (in production this would be fetched from API routes)
    const connectedPorts = new Set(['0-1', '0-4', '1-8', '2-0', '4-15']);

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content" style={{ maxWidth: '900px', width: '95%' }}>
                <div className="modal-header" style={{ padding: '16px 24px', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                            background: 'rgba(239, 68, 68, 0.1)', 
                            color: '#ef4444', 
                            padding: '10px', 
                            borderRadius: '12px',
                            boxShadow: '0 0 15px rgba(239, 68, 68, 0.2)' 
                        }}>
                             <Layout size={22} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Gestión OLT — {node.name}</h2>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                Nodo Maestro de Distribución Óptica
                            </div>
                        </div>
                    </div>
                    <button className="modal-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* ── Tab Navigation ── */}
                <div style={{ 
                    display: 'flex', 
                    padding: '0 24px', 
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(255,255,255,0.01)',
                    gap: '24px'
                }}>
                    <button 
                        onClick={() => setActiveTab('hardware')}
                        style={{
                            padding: '16px 4px',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'hardware' ? '2px solid #ef4444' : '2px solid transparent',
                            color: activeTab === 'hardware' ? 'white' : 'var(--text-muted)',
                            fontSize: '0.85rem',
                            fontWeight: activeTab === 'hardware' ? 700 : 500,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <Cpu size={16} /> Chassis & Tarjetas
                    </button>
                    <button 
                        onClick={() => setActiveTab('odf')}
                        style={{
                            padding: '16px 4px',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'odf' ? '2px solid #ef4444' : '2px solid transparent',
                            color: activeTab === 'odf' ? 'white' : 'var(--text-muted)',
                            fontSize: '0.85rem',
                            fontWeight: activeTab === 'odf' ? 700 : 500,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <Layers size={16} /> Bandeja ODF Integrada
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '24px', minHeight: '400px' }}>
                    {activeTab === 'hardware' ? (
                        <div className="animate-in">
                            <div className="stats-grid" style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                                <div className="glass-morphism stat-item" style={{ flex: '1 1 200px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', padding: '10px', borderRadius: '10px' }}>
                                        <Cpu size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tarjetas Totales</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>{cards}</div>
                                    </div>
                                </div>
                                <div className="glass-morphism stat-item" style={{ flex: '1 1 200px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', padding: '10px', borderRadius: '10px' }}>
                                        <Activity size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Puertos por Tarjeta</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>{portsPerCard}</div>
                                    </div>
                                </div>
                                <div className="glass-morphism stat-item" style={{ flex: '1 1 200px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '10px', borderRadius: '10px' }}>
                                        <Info size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Puertos Activos</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>{connectedPorts.size} / {cards * portsPerCard}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="olt-rack glass-morphism" style={{ padding: '24px', background: 'rgba(0,0,0,0.2)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {Array.from({ length: cards }).map((_, cardIdx) => (
                                        <div key={cardIdx} className="olt-card-row" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                                            <div style={{
                                                width: '80px',
                                                fontSize: '0.7rem',
                                                fontWeight: '800',
                                                color: 'var(--text-muted)',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em'
                                            }}>
                                                Slot {cardIdx}
                                            </div>
                                            <div style={{
                                                flex: 1,
                                                display: 'grid',
                                                gridTemplateColumns: `repeat(auto-fill, minmax(28px, 1fr))`,
                                                gap: '6px',
                                                background: 'rgba(255,255,255,0.02)',
                                                padding: '10px',
                                                borderRadius: '8px',
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                minWidth: '200px'
                                            }}>
                                                {Array.from({ length: portsPerCard }).map((_, portIdx) => {
                                                    const isConnected = connectedPorts.has(`${cardIdx}-${portIdx}`);
                                                    return (
                                                        <div
                                                            key={portIdx}
                                                            style={{
                                                                aspectRatio: '1',
                                                                borderRadius: '4px',
                                                                background: isConnected ? 'linear-gradient(135deg, #ef4444, #b91c1c)' : 'rgba(255,255,255,0.05)',
                                                                border: isConnected ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '0.6rem',
                                                                color: isConnected ? 'white' : 'var(--text-muted)',
                                                                fontWeight: 'bold',
                                                                boxShadow: isConnected ? '0 0 10px rgba(239, 68, 68, 0.4)' : 'none',
                                                                transition: 'all 0.2s ease'
                                                            }}
                                                            title={isConnected ? `Puerto ${portIdx} - Conectado` : `Puerto ${portIdx} - Libre`}
                                                        >
                                                            {portIdx}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <ODFView 
                            nodeId={node.id} 
                            nodeName={node.name} 
                            hardwareDetails={{
                                capacity: node.hardware_details?.capacity || 48,
                                used_ports: node.hardware_details?.used_ports || 0
                            }} 
                        />
                    )}
                </div>

                <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="secondary-btn" onClick={onClose}>Cerrar Gestión</button>
                </div>
            </div>
        </div>
    );
};

export default GestorOLT;
