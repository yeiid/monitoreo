import React, { useState } from 'react';
import { Plus, GitBranch, Search, Layers, MapPin, X, MousePointer, Cable, Crosshair, Menu, Wifi, Zap } from 'lucide-react';
import type { DrawingTool } from '../map/types';
import { NODE_CONFIG } from '../map/types';

interface MobileToolbarProps {
    activeTool: DrawingTool;
    setActiveTool: (t: DrawingTool) => void;
    hasOLT: boolean;
    isDrawingCable: boolean;
    cablePointCount: number;
    onFinishCable: () => void;
    onCancelCable: () => void;
    onOpenLocationSelector?: () => void;
    onLocateMe?: () => void;
    onStartCableFromGPS?: () => void;
    hasGPSLocation?: boolean;
    onToggleLayers?: () => void;
}

const MobileToolbar: React.FC<MobileToolbarProps> = ({
    activeTool,
    setActiveTool,
    hasOLT,
    isDrawingCable,
    cablePointCount,
    onFinishCable,
    onCancelCable,
    onOpenLocationSelector,
    onLocateMe,
    onStartCableFromGPS,
    hasGPSLocation,
    onToggleLayers,
}) => {
    const [showNodeTypes, setShowNodeTypes] = useState(false);

    const nodeTypes = [
        { tool: 'add_olt' as DrawingTool, label: 'OLT', icon: '🔴', color: NODE_CONFIG.OLT.color, disabled: false },
        { tool: 'add_mufla' as DrawingTool, label: 'Mufla', icon: '🔗', color: NODE_CONFIG.MUFLA.color, disabled: false },
        { tool: 'add_nap' as DrawingTool, label: 'NAP', icon: '📦', color: NODE_CONFIG.CAJA_NAP.color, disabled: false },
        { tool: 'add_client' as DrawingTool, label: 'Cliente', icon: '🏠', color: NODE_CONFIG.CLIENTE_ONU.color, disabled: false },
    ];

    return (
        <>
            {/* ── MAIN BOTTOM BAR ── */}
            <div className="map-toolbar-hud mobile-only" style={{
                width: '100%',
                maxWidth: '480px',
                justifyContent: 'space-between',
                bottom: '16px',
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '8px 12px',
                flexWrap: 'wrap',
                gap: '8px',
            }}>
                {/* GPS Location */}
                <button
                    className="hud-btn"
                    onClick={onLocateMe}
                    title="Mi Ubicación Actual"
                    style={{ flex: '0 0 auto' }}
                >
                    <Crosshair size={22} />
                    <span style={{ fontSize: '0.6rem' }}>GPS</span>
                </button>

                {/* Search Location */}
                <button
                    className="hud-btn"
                    onClick={onOpenLocationSelector}
                    title="Buscar Ubicación"
                    style={{ flex: '0 0 auto' }}
                >
                    <MapPin size={22} />
                    <span style={{ fontSize: '0.6rem' }}>Lugar</span>
                </button>

                <div className="toolbar-divider" style={{ height: '28px' }} />

                {/* Node Types Dropdown */}
                <div style={{ position: 'relative', flex: '0 0 auto' }}>
                    <button
                        className={`hud-btn ${activeTool !== 'select' && activeTool !== 'draw_cable' ? 'active' : ''}`}
                        onClick={() => setShowNodeTypes(!showNodeTypes)}
                        title="Agregar Nodo"
                        style={{ flex: '0 0 auto' }}
                    >
                        <Plus size={22} />
                        <span style={{ fontSize: '0.6rem' }}>Nodo</span>
                    </button>

                    {showNodeTypes && (
                        <div
                            className="mobile-node-dropdown"
                            style={{
                                position: 'absolute',
                                bottom: '56px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: 'rgba(15, 15, 25, 0.95)',
                                backdropFilter: 'blur(24px)',
                                border: '1px solid rgba(157, 78, 221, 0.25)',
                                borderRadius: '16px',
                                padding: '8px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                                zIndex: 200,
                                boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
                                minWidth: '140px',
                            }}
                        >
                            {nodeTypes.map(({ tool, label, icon, color, disabled }) => (
                                <button
                                    key={tool}
                                    className={`hud-btn ${activeTool === tool ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
                                    onClick={() => {
                                        setActiveTool(tool);
                                        setShowNodeTypes(false);
                                    }}
                                    disabled={disabled}
                                    title={`Agregar ${label}`}
                                    style={{
                                        flexDirection: 'row',
                                        justifyContent: 'flex-start',
                                        gap: '12px',
                                        padding: '10px 14px',
                                        minWidth: '140px',
                                        borderRadius: '12px',
                                    }}
                                >
                                    <span style={{
                                        fontSize: '1.2rem',
                                        lineHeight: 1,
                                        opacity: disabled ? 0.4 : 1,
                                    }}>{icon}</span>
                                    <span style={{
                                        color: disabled ? 'var(--text-muted)' : color,
                                        fontWeight: 700,
                                        fontSize: '0.75rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.02em',
                                    }}>{label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="toolbar-divider" style={{ height: '28px' }} />

                {/* Draw Cable */}
                <button
                    className={`hud-btn ${isDrawingCable ? 'active' : ''}`}
                    onClick={() => {
                        if (isDrawingCable) {
                            onCancelCable();
                        } else {
                            setActiveTool('draw_cable');
                        }
                    }}
                    title={isDrawingCable ? 'Cancelar trazo' : 'Trazar Cable'}
                    style={{ flex: '0 0 auto' }}
                >
                    {isDrawingCable ? <X size={22} /> : <Cable size={22} />}
                    <span style={{ fontSize: '0.6rem' }}>{isDrawingCable ? 'Cancelar' : 'Cable'}</span>
                </button>

                <div className="toolbar-divider" style={{ height: '28px' }} />

                {/* Layers Menu */}
                <button
                    className="hud-btn"
                    onClick={onToggleLayers}
                    title="Menú Principal / Capas"
                    style={{ flex: '0 0 auto' }}
                >
                    <Menu size={22} />
                    <span style={{ fontSize: '0.6rem' }}>Menú</span>
                </button>
            </div>

            {/* ── DRAWING ACTIONS BAR (conditional) ── */}
            {isDrawingCable && (
                <div
                    className="map-toolbar-hud mobile-only"
                    style={{
                        width: '100%',
                        maxWidth: '480px',
                        justifyContent: 'space-around',
                        bottom: '76px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        padding: '8px',
                        borderTop: '1px solid rgba(16, 185, 129, 0.3)',
                    }}
                >
                    <span className="toolbar-hint" style={{
                        position: 'static',
                        transform: 'none',
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#10b981',
                        fontSize: '0.7rem',
                        padding: '6px 14px',
                        borderRadius: '100px',
                        fontWeight: 700,
                    }}>
                        📍 DIBUJANDO CABLE... Puntos: {cablePointCount}
                    </span>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            className="hud-btn danger-intent"
                            onClick={onCancelCable}
                            title="Borrar trazo completo"
                            style={{ padding: '8px 14px' }}
                        >
                            <X size={18} />
                            <span style={{ fontSize: '0.6rem' }}>Cancelar</span>
                        </button>

                        <button
                            className="hud-btn success-intent"
                            onClick={onFinishCable}
                            disabled={cablePointCount < 2}
                            title="Finalizar y guardar cable"
                            style={{ padding: '8px 14px' }}
                        >
                            <Zap size={18} />
                            <span style={{ fontSize: '0.6rem' }}>Confirmar ({cablePointCount})</span>
                        </button>
                    </div>
                </div>
            )}

            {/* ── GPS TRACE BUTTON (conditional) ── */}
            {hasGPSLocation && !isDrawingCable && hasOLT && onStartCableFromGPS && (
                <div
                    className="map-toolbar-hud mobile-only"
                    style={{
                        width: '100%',
                        maxWidth: '480px',
                        justifyContent: 'center',
                        bottom: isDrawingCable ? '136px' : '76px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        padding: '6px',
                    }}
                >
                    <button
                        className="hud-btn gps-trace"
                        onClick={onStartCableFromGPS}
                        title="Iniciar trazado desde mi ubicación"
                        style={{
                            flexDirection: 'row',
                            gap: '8px',
                            padding: '10px 18px',
                            background: 'rgba(59, 130, 246, 0.15)',
                            border: '1px solid rgba(59, 130, 246, 0.4)',
                            color: '#60a5fa',
                            minWidth: 'auto',
                        }}
                    >
                        <Crosshair size={16} />
                        <Cable size={14} />
                        <span style={{ fontWeight: 700, fontSize: '0.75rem' }}>Trazar desde GPS</span>
                    </button>
                </div>
            )}

            <style dangerouslySetInnerHTML={{ __html: `
                .mobile-node-dropdown {
                    animation: slideUp 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateX(-50%) translateY(10px); }
                    to { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
                .mobile-only .hud-btn.active {
                    background: var(--primary-gradient);
                    color: white;
                    box-shadow: 0 4px 15px var(--primary-glow);
                }
                .mobile-only .hud-btn.disabled {
                    opacity: 0.35;
                    cursor: not-allowed;
                }
                .mobile-only .hud-btn.success-intent { color: #10b981; }
                .mobile-only .hud-btn.success-intent:hover:not(:disabled) { background: rgba(16, 185, 129, 0.1); }
                .mobile-only .hud-btn.success-intent:disabled { opacity: 0.4; cursor: not-allowed; }
                .mobile-only .hud-btn.danger-intent { color: #ef4444; }
                .mobile-only .hud-btn.danger-intent:hover { background: rgba(239, 68, 68, 0.1); }
                .mobile-only .hud-btn.gps-trace { font-weight: 700; }
            `}} />
        </>
    );
};

export default MobileToolbar;