import React from 'react';
import { X, Cpu, Activity, Info } from 'lucide-react';

interface GestorOLTProps {
    node: {
        id: string;
        name: string;
        hardware_details?: {
            cards: number;
            ports_per_card: number;
        };
    };
    onClose: () => void;
}

const GestorOLT: React.FC<GestorOLTProps> = ({ node, onClose }) => {
    const cards = node.hardware_details?.cards || 5;
    const portsPerCard = node.hardware_details?.ports_per_card || 16;

    // Simulation of connected ports (in production this would be fetched from API routes)
    const connectedPorts = new Set(['0-1', '0-4', '1-8', '2-0', '4-15']);

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content">
                <div className="modal-header">
                    <h2>
                        <span style={{ fontSize: '1.3rem', color: '#ef4444' }}>📡</span>
                        Gestión de OLT — {node.name}
                    </h2>
                    <button className="modal-close-btn" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '24px' }}>
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
                                        background: 'rgba(255,255,255,0.03)',
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
                                                        background: isConnected ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.05)',
                                                        border: isConnected ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '0.6rem',
                                                        color: isConnected ? 'white' : 'var(--text-muted)',
                                                        fontWeight: 'bold',
                                                        boxShadow: isConnected ? '0 0 10px rgba(16, 185, 129, 0.4)' : 'none',
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

                    <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '3px' }}></div>
                            Puerto con Fibra Troncal
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '12px', height: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '3px' }}></div>
                            Puerto Disponible
                        </div>
                    </div>
                </div>

                <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="secondary-btn" onClick={onClose}>Cerrar Vista de Hardware</button>
                </div>
            </div>
        </div>
    );
};

export default GestorOLT;
