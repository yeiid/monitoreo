import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../utils/apiFetch';
import { Server, CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { API_BASE } from './map/types';

interface ODFViewProps {
    nodeId: string;
    nodeName: string;
    hardwareDetails?: {
        capacity: number;
        used_ports: number;
    };
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

export const ODFView: React.FC<ODFViewProps> = ({ nodeId, nodeName, hardwareDetails }) => {
    const capacity = hardwareDetails?.capacity ?? 48;
    const usedPorts = hardwareDetails?.used_ports ?? 0;
    const availablePorts = capacity - usedPorts;

    const [connectedRoutes, setConnectedRoutes] = useState<ConnectedRoute[]>([]);
    const [nodeNames, setNodeNames] = useState<Record<string, NodeInfo>>({});
    const [loading, setLoading] = useState(true);

    const loadConnections = useCallback(async () => {
        setLoading(true);
        try {
            const routesRes = await apiFetch(`${API_BASE}/routes`);
            if (!routesRes.ok) return;
            const allRoutes: ConnectedRoute[] = await routesRes.json();

            // Only routes that terminate IN this ODF/OLT (for ODF management)
            const incoming = allRoutes.filter(
                (r) => r.end_node_id === nodeId
            );
            setConnectedRoutes(incoming);

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
    }, [nodeId]);

    useEffect(() => {
        loadConnections();
    }, [loadConnections]);

    const portToRoute: Record<number, ConnectedRoute> = {};
    connectedRoutes.forEach((r, i) => {
        portToRoute[i] = r;
    });

    const COLS = 12;

    return (
        <div className="odf-view-container animate-in">
            <div className="stats-grid" style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <div className="glass-morphism stat-item" style={{ flex: '1 1 200px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: 'rgba(107, 114, 128, 0.15)', color: '#9ca3af', padding: '10px', borderRadius: '10px' }}>
                        <Server size={20} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Capacidad Bandeja</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>{capacity} fibras</div>
                    </div>
                </div>
                <div className="glass-morphism stat-item" style={{ flex: '1 1 200px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#22c55e', padding: '10px', borderRadius: '10px' }}>
                        <CheckCircle size={20} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fibras Conectadas</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#22c55e' }}>{usedPorts}</div>
                    </div>
                </div>
                <div className="glass-morphism stat-item" style={{ flex: '1 1 200px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        background: availablePorts <= 4 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(6, 182, 212, 0.1)',
                        color: availablePorts <= 4 ? '#f59e0b' : '#06b6d4',
                        padding: '10px', borderRadius: '10px'
                    }}>
                        <Circle size={20} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hilos Libres</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: availablePorts <= 4 ? '#f59e0b' : '#06b6d4' }}>
                            {availablePorts}
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-morphism" style={{ padding: '24px', background: 'rgba(0,0,0,0.25)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px', fontWeight: 700 }}>
                    Panel de Terminación Óptica SC/APC
                </div>

                {loading ? (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px' }}>Cargando conexiones...</div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
                        gap: '10px',
                    }}>
                        {Array.from({ length: capacity }).map((_, portIdx) => {
                            const route = portToRoute[portIdx];
                            const olt = route ? nodeNames[route.start_node_id] : null;
                            const isOccupied = !!route;

                            return (
                                <div
                                    key={portIdx}
                                    title={isOccupied
                                        ? `Puerto ${portIdx + 1} — Cable: ${route.name}${olt ? ` | Origen: ${olt.name}` : ''}`
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
                                            : '2px solid rgba(255,255,255,0.15)',
                                        cursor: isOccupied ? 'help' : 'default',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.6rem',
                                        color: isOccupied ? 'white' : 'rgba(255,255,255,0.25)',
                                        fontWeight: 'bold',
                                        boxShadow: isOccupied
                                            ? '0 0 15px rgba(34, 197, 94, 0.4), inset 0 1px 2px rgba(255,255,255,0.3)'
                                            : 'none',
                                        transition: 'all 0.2s ease',
                                        position: 'relative',
                                    }}
                                >
                                    {portIdx + 1}
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

                <div style={{ marginTop: '24px', display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #4ade80, #16a34a)', border: '2px solid #22c55e' }} />
                        Terminación Activa
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '2px solid rgba(255,255,255,0.15)' }} />
                        Módulo DP Libre
                    </div>
                </div>
            </div>
        </div>
    );
};

// Original Modal wrapper for legacy calls (if any)
const GestorODF: React.FC<{node: any, onClose: () => void}> = ({ node, onClose }) => {
    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content">
                <div className="modal-header">
                    <h2>🔩 Gestión de ODF — {node.name}</h2>
                    <button className="modal-close-btn" onClick={onClose}>Cerrar</button>
                </div>
                <div className="modal-body" style={{ padding: '24px' }}>
                    <ODFView nodeId={node.id} nodeName={node.name} hardwareDetails={node.hardware_details} />
                </div>
            </div>
        </div>
    );
};

export default GestorODF;
