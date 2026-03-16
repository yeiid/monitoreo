import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../utils/apiFetch';
import { X, Server, CheckCircle, Circle, AlertCircle } from 'lucide-react';

interface GestorODFProps {
    node: {
        id: string;
        name: string;
        hardware_details?: {
            capacity: number;
            used_ports: number;
        };
    };
    onClose: () => void;
}

interface ConnectedRoute {
    id: string;
    name: string;
    start_node_id: string;
    end_node_id: string;
    route_type: string;
    capacity: number;
}

interface NodeInfo {
    id: string;
    name: string;
    node_type: string;
}

import { API_BASE } from './map/types';

const GestorODF: React.FC<GestorODFProps> = ({ node, onClose }) => {
    const capacity = node.hardware_details?.capacity ?? 48;
    const usedPorts = node.hardware_details?.used_ports ?? 0;
    const availablePorts = capacity - usedPorts;

    const [connectedRoutes, setConnectedRoutes] = useState<ConnectedRoute[]>([]);
    const [nodeNames, setNodeNames] = useState<Record<string, NodeInfo>>({});
    const [loading, setLoading] = useState(true);

    // Fetch routes connected to this ODF and the names of their source nodes
    const loadConnections = useCallback(async () => {
        setLoading(true);
        try {
            const routesRes = await apiFetch(`${API_BASE}/routes`);
            if (!routesRes.ok) return;
            const allRoutes: ConnectedRoute[] = await routesRes.json();

            // Only PATCHCORD routes that terminate IN this ODF
            const incoming = allRoutes.filter(
                (r) => r.route_type === 'PATCHCORD' && r.end_node_id === node.id
            );
            setConnectedRoutes(incoming);

            // Fetch source node names (OLT names)
            const uniqueSourceIds = [...new Set(incoming.map((r) => r.start_node_id))];
            const nodeMap: Record<string, NodeInfo> = {};
            await Promise.all(
                uniqueSourceIds.map(async (id) => {
                    try {
                        const res = await apiFetch(`${API_BASE}/nodes/${id}`);
                        if (res.ok) {
                            const n: NodeInfo = await res.json();
                            nodeMap[id] = n;
                        }
                    } catch { }
                })
            );
            setNodeNames(nodeMap);
        } catch { }
        setLoading(false);
    }, [node.id]);

    useEffect(() => {
        loadConnections();
    }, [loadConnections]);

    // Map port index → connected route (patchcords fill sequentially)
    const portToRoute: Record<number, ConnectedRoute> = {};
    connectedRoutes.forEach((r, i) => {
        portToRoute[i] = r;
    });

    // 12 columns = standard fibre tray width
    const COLS = 12;
    const rows = Math.ceil(capacity / COLS);

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content">
                {/* ── Header ── */}
                <div className="modal-header">
                    <h2>
                        <span style={{ fontSize: '1.3rem', marginRight: '8px' }}>🔩</span>
                        ODF — {node.name}
                    </h2>
                    <button className="modal-close-btn" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '24px' }}>
                    {/* ── Stats Row ── */}
                    <div className="stats-grid" style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                        <div className="glass-morphism stat-item" style={{ flex: '1 1 200px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: 'rgba(107, 114, 128, 0.15)', color: '#9ca3af', padding: '10px', borderRadius: '10px' }}>
                                <Server size={20} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Capacidad Total</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>{capacity} puertos</div>
                            </div>
                        </div>
                        <div className="glass-morphism stat-item" style={{ flex: '1 1 200px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#22c55e', padding: '10px', borderRadius: '10px' }}>
                                <CheckCircle size={20} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Puertos Usados</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#22c55e' }}>{usedPorts}</div>
                            </div>
                        </div>
                        <div className="glass-morphism stat-item" style={{ flex: '1 1 200px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                background: availablePorts <= 4 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(6, 182, 212, 0.1)',
                                color: availablePorts <= 4 ? '#f59e0b' : '#06b6d4',
                                padding: '10px', borderRadius: '10px'
                            }}>
                                {availablePorts <= 4 ? <AlertCircle size={20} /> : <Circle size={20} />}
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Disponibles</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: availablePorts <= 4 ? '#f59e0b' : '#06b6d4' }}>
                                    {availablePorts}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Capacity Bar ── */}
                    <div style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                            <span>Ocupación del ODF</span>
                            <span style={{ color: 'white' }}>{Math.round((usedPorts / capacity) * 100)}%</span>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', overflow: 'hidden' }}>
                            <div style={{
                                height: '100%',
                                width: `${(usedPorts / capacity) * 100}%`,
                                background: usedPorts >= capacity * 0.9
                                    ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                                    : 'linear-gradient(90deg, #22c55e, #16a34a)',
                                borderRadius: '6px',
                                transition: 'width 0.4s ease'
                            }} />
                        </div>
                    </div>

                    {/* ── Port Grid ── */}
                    <div className="glass-morphism" style={{ padding: '20px', background: 'rgba(0,0,0,0.25)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
                            Panel de Puertos SC/APC — {capacity} fibras
                        </div>

                        {loading ? (
                            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px' }}>Cargando conexiones...</div>
                        ) : (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: `repeat(${COLS}, 1fr)`,
                                gap: '8px',
                            }}>
                                {Array.from({ length: capacity }).map((_, portIdx) => {
                                    const route = portToRoute[portIdx];
                                    const olt = route ? nodeNames[route.start_node_id] : null;
                                    const isOccupied = !!route;

                                    return (
                                        <div
                                            key={portIdx}
                                            title={isOccupied
                                                ? `Puerto ${portIdx + 1} — Patchcord: ${route.name}${olt ? ` | OLT: ${olt.name}` : ''}`
                                                : `Puerto ${portIdx + 1} — Libre`
                                            }
                                            style={{
                                                aspectRatio: '1',
                                                borderRadius: '50%',
                                                background: isOccupied
                                                    ? 'radial-gradient(circle at 35% 35%, #4ade80, #16a34a)'
                                                    : 'rgba(255,255,255,0.04)',
                                                border: isOccupied
                                                    ? '2px solid #22c55e'
                                                    : '2px solid rgba(255,255,255,0.10)',
                                                cursor: isOccupied ? 'help' : 'default',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '0.55rem',
                                                color: isOccupied ? 'white' : 'rgba(255,255,255,0.25)',
                                                fontWeight: 'bold',
                                                boxShadow: isOccupied
                                                    ? '0 0 10px rgba(34, 197, 94, 0.5), inset 0 1px 2px rgba(255,255,255,0.3)'
                                                    : 'inset 0 1px 2px rgba(0,0,0,0.3)',
                                                transition: 'all 0.2s ease',
                                                position: 'relative',
                                            }}
                                        >
                                            {portIdx + 1}
                                            {/* SC/APC centre hole effect */}
                                            {isOccupied && (
                                                <div style={{
                                                    position: 'absolute',
                                                    width: '35%', height: '35%',
                                                    borderRadius: '50%',
                                                    background: 'rgba(0,0,0,0.5)',
                                                    border: '1px solid rgba(0,0,0,0.7)',
                                                }} />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* ── Legend ── */}
                    <div style={{ marginTop: '16px', display: 'flex', gap: '20px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #4ade80, #16a34a)', border: '2px solid #22c55e' }} />
                            Puerto SC/APC Ocupado
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '2px solid rgba(255,255,255,0.10)' }} />
                            Puerto Disponible
                        </div>
                    </div>

                    {/* ── Capacity warning ── */}
                    {availablePorts <= 4 && (
                        <div style={{
                            marginTop: '16px', padding: '12px 16px',
                            background: 'rgba(245, 158, 11, 0.08)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            borderRadius: '8px', color: '#f59e0b', fontSize: '0.82rem',
                            display: 'flex', gap: '10px', alignItems: 'center'
                        }}>
                            <AlertCircle size={16} />
                            <span>
                                {availablePorts === 0
                                    ? '⚠️ ODF sin puertos disponibles. Amplíe la capacidad o instale una nueva bandeja.'
                                    : `⚠️ Sólo quedan ${availablePorts} puertos libres. Considere expandir capacidad.`}
                            </span>
                        </div>
                    )}
                </div>

                <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="secondary-btn" onClick={onClose}>Cerrar Vista de ODF</button>
                </div>
            </div>
        </div>
    );
};

export default GestorODF;
