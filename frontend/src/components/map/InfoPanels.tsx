import React from 'react';
import { Cable, Eye, Trash2 } from 'lucide-react';
import type { NodeData, RouteData } from './types';
import { NODE_CONFIG, ROUTE_CONFIG } from './types';
// ── Node Info Panel ──
interface NodeInfoPanelProps {
    node: NodeData;
    onClose: () => void;
    onDelete: (id: string) => void;
    onInspect: (node: NodeData) => void;
    onAddChild?: (node: NodeData, childType: string) => void;
}

const HIERARCHY: Record<string, string> = {
    'OLT': 'MUFLA',
    'MUFLA': 'CAJA_NAP',
    'CAJA_NAP': 'CLIENTE_ONU'
};

export const NodeInfoPanel: React.FC<NodeInfoPanelProps> = ({ node, onClose, onDelete, onInspect, onAddChild }) => {
    const cfg = NODE_CONFIG[node.node_type];
    const showInspect = ['OLT', 'ODF', 'MUFLA', 'CAJA_NAP'].includes(node.node_type);
    const childType = HIERARCHY[node.node_type];
    const childCfg = childType ? NODE_CONFIG[childType] : null;

    return (
        <div className="info-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {cfg?.iconUrl ? (
                        <img src={cfg.iconUrl} alt={cfg.label} style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={cfg?.color || 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path dangerouslySetInnerHTML={{ __html: cfg?.svgPath || '' }} />
                        </svg>
                    )}
                    {node.name}
                </h3>
                <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }} onClick={onClose}>✕</button>
            </div>

            <div className="info-item">
                <span className="label">Tipo</span>
                <span className="value">{cfg?.label || node.node_type}</span>
            </div>
            <div className="info-item">
                <span className="label">Latitud</span>
                <span className="value">{node.location.lat.toFixed(6)}</span>
            </div>
            <div className="info-item">
                <span className="label">Longitud</span>
                <span className="value">{node.location.lng.toFixed(6)}</span>
            </div>

            {(node.node_type === 'MUFLA' || node.node_type === 'CAJA_NAP') && (
                <div className="info-item">
                    <span className="label">Potencia</span>
                    <span className="value" style={{ color: (node.optical_power_dbm ?? 0) < -25 ? 'var(--error)' : 'var(--success)', fontWeight: 'bold' }}>
                        {node.optical_power_dbm != null ? `${node.optical_power_dbm} dBm` : 'No medido'}
                    </span>
                </div>
            )}

            {node.node_type === 'ODF' && node.hardware_details && (
                <div className="info-item">
                    <span className="label">Puertos</span>
                    <span className="value">
                        {node.hardware_details.used_ports ?? 0} / {node.hardware_details.capacity ?? 48}
                    </span>
                </div>
            )}

            {node.description && (
                <div className="info-item">
                    <span className="label">Desc.</span>
                    <span className="value">{node.description}</span>
                </div>
            )}

            <div className="info-panel-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
                {childType && (
                    <button
                        className="primary-btn"
                        style={{ flex: '1 1 100%', background: childCfg?.color }}
                        onClick={() => onAddChild?.(node, childType)}
                    >
                        <Cable size={14} style={{ marginRight: '6px' }} />
                        Añadir {childCfg?.label}
                    </button>
                )}

                {showInspect && (
                    <button className="secondary-btn" style={{ flex: 1 }} onClick={() => onInspect(node)}>
                        <Eye size={14} style={{ marginRight: '6px' }} />
                        <span className="desktop-only">{node.node_type === 'OLT' ? 'Gestionar OLT' : node.node_type === 'ODF' ? 'Ver ODF' : 'Ver Empalmes'}</span>
                        <span className="mobile-only">Gestionar</span>
                    </button>
                )}
                <button className="danger-btn secondary-btn" style={{ flex: 0 }} onClick={() => onDelete(node.id)}>
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
};

// ── Route Info Panel ──
interface RouteInfoPanelProps {
    route: RouteData;
    topOffset?: string;
    onClose: () => void;
    onDelete: (id: string) => void;
}

export const RouteInfoPanel: React.FC<RouteInfoPanelProps> = ({ route, topOffset = '16px', onClose, onDelete }) => {
    const cfg = ROUTE_CONFIG[route.route_type] || ROUTE_CONFIG.TRONCAL;

    return (
        <div className="info-panel" style={{ top: topOffset }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Cable size={18} color={cfg.color} /> {route.name}
                </h3>
                <button style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }} onClick={onClose}>✕</button>
            </div>

            <div className="info-item">
                <span className="label">Tipo</span>
                <span className="value stat-badge" style={{ background: 'rgba(255,255,255,0.05)', color: cfg.color, border: `1px solid ${cfg.color}33` }}>
                    {cfg.label}
                </span>
            </div>

            <div className="nav-section-title" style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Especificaciones Físicas
            </div>

            <div className="info-item">
                <span className="label">Distancia Total</span>
                <span className="value">
                    {route.length_meters && route.length_meters > 1000
                        ? `${(route.length_meters / 1000).toFixed(2)} km`
                        : `${route.length_meters?.toFixed(1) || 0} m`}
                </span>
            </div>

            <div className="info-item">
                <span className="label">Atenuación Fibra</span>
                <span className="value" style={{ color: '#fbbf24', fontWeight: 'bold' }}>
                    -{((route.length_meters || 0) / 1000 * 0.25).toFixed(2)} dB
                </span>
            </div>

            {route.length_meters && route.length_meters > 2000 && (
                <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px', color: '#f59e0b', fontSize: '0.78rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                    <span><strong>Alerta de Bobina:</strong> Supera 1 bobina estándar.</span>
                </div>
            )}

            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button className="secondary-btn danger-btn" style={{ width: '100%', fontSize: '0.82rem' }} onClick={() => onDelete(route.id)}>
                    Eliminar Cable
                </button>
            </div>
        </div>
    );
};
