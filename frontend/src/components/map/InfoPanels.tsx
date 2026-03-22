import React from 'react';
import { Cable, Eye, Trash2, MapPin } from 'lucide-react';
import type { NodeData, RouteData } from './types';
import { NODE_CONFIG, ROUTE_CONFIG } from './types';

// ── Node Info Panel ──
interface NodeInfoPanelProps {
    node: NodeData;
    onClose: () => void;
    onDelete: (id: string) => void;
    onInspect: (node: NodeData) => void;
    onCenter?: (node: NodeData) => void;
    onAddChild?: (node: NodeData, childType: string) => void;
}

const HIERARCHY: Record<string, string> = {
    'OLT': 'MUFLA',
    'MUFLA': 'CAJA_NAP',
    'CAJA_NAP': 'CLIENTE_ONU'
};

export const NodeInfoPanel: React.FC<NodeInfoPanelProps> = ({ node, onClose, onDelete, onInspect, onCenter, onAddChild }) => {
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
                <span className="label">Ubicación</span>
                <span className="value" style={{fontSize: '0.75rem', fontFamily: 'monospace'}}>
                    {node.location.lat.toFixed(5)}, {node.location.lng.toFixed(5)}
                </span>
            </div>

            {(node.node_type === 'MUFLA' || node.node_type === 'CAJA_NAP') && (
                <div className="info-item">
                    <span className="label">Potencia</span>
                    <span className="value" style={{ color: (node.optical_power_dbm ?? 0) < -25 ? 'var(--error)' : 'var(--success)', fontWeight: 'bold' }}>
                        {node.optical_power_dbm != null ? `${node.optical_power_dbm} dBm` : 'No medido'}
                    </span>
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

                <button 
                    className="secondary-btn" 
                    style={{ flex: 1, color: '#60a5fa', borderColor: 'rgba(96, 165, 250, 0.3)' }} 
                    onClick={() => onCenter?.(node)}
                >
                    <MapPin size={14} style={{ marginRight: '6px' }} />
                    Ubicar
                </button>

                {showInspect && (
                    <button className="secondary-btn" style={{ flex: 1 }} onClick={() => onInspect(node)}>
                        <Eye size={14} style={{ marginRight: '6px' }} />
                        Gestionar
                    </button>
                )}
                
                <button className="secondary-btn danger-btn" style={{ flex: 0, padding: '8px' }} onClick={() => onDelete(node.id)}>
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
    onCenter?: (route: RouteData) => void;
}

export const RouteInfoPanel: React.FC<RouteInfoPanelProps> = ({ route, topOffset = '16px', onClose, onDelete, onCenter }) => {
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

            <div className="info-item">
                <span className="label">Longitud</span>
                <span className="value">
                    {route.length_meters && route.length_meters > 1000
                        ? `${(route.length_meters / 1000).toFixed(2)} km`
                        : `${route.length_meters?.toFixed(1) || 0} m`}
                </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button 
                    className="secondary-btn" 
                    style={{ flex: 1, color: '#60a5fa', borderColor: 'rgba(96, 165, 250, 0.3)' }}
                    onClick={() => onCenter?.(route)}
                >
                    <MapPin size={14} style={{ marginRight: '6px' }} />
                    Ubicar Cable
                </button>
                <button className="secondary-btn danger-btn" style={{ flex: 0, padding: '8px' }} onClick={() => onDelete(route.id)}>
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
};
