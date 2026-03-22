import React from 'react';
import { Cable, MousePointer, MapPin, Check, X } from 'lucide-react';
import type { DrawingTool } from './types';
import { NODE_CONFIG } from './types';

interface MapToolbarProps {
    activeTool: DrawingTool;
    setActiveTool: (t: DrawingTool) => void;
    hasOLT: boolean;
    isDrawingCable: boolean;
    cablePointCount: number;
    onFinishCable: () => void;
    onCancelCable: () => void;
    onOpenLocationSelector?: () => void;
}

const MapToolbar: React.FC<MapToolbarProps> = ({
    activeTool,
    setActiveTool,
    hasOLT,
    isDrawingCable,
    cablePointCount,
    onFinishCable,
    onCancelCable,
    onOpenLocationSelector,
}) => {
    return (
        <div className="map-toolbar">

            {/* ── Herramientas básicas ── */}
            <button
                className={`toolbar-btn ${activeTool === 'select' ? 'active' : ''}`}
                onClick={() => setActiveTool('select')}
                title="Seleccionar nodo o cable"
            >
                <MousePointer size={16} strokeWidth={2.5} />
                <span>Seleccionar</span>
            </button>

            <button
                className="toolbar-btn"
                onClick={onOpenLocationSelector}
                title="Cambiar ubicación del mapa"
            >
                <MapPin size={16} strokeWidth={2.5} />
                <span>Ubicación</span>
            </button>

            {/* ── Nodo raíz ── */}
            <div className="nav-section-title" style={{ padding: '12px 4px 4px' }}>
                Nodo Raíz
            </div>

            <button
                className={`toolbar-btn ${activeTool === 'add_olt' ? 'active' : ''}`}
                onClick={() => setActiveTool('add_olt')}
                title="Colocar una OLT en el mapa"
            >
                <span className="dot" style={{ background: NODE_CONFIG.OLT.color }} />
                <span>Agregar OLT</span>
            </button>

            {/* ── Cableado ── */}
            <div className="nav-section-title" style={{ padding: '12px 4px 4px' }}>
                Cableado
            </div>

            <button
                disabled={!hasOLT}
                className={`toolbar-btn ${activeTool === 'draw_cable' ? 'active' : ''} ${!hasOLT ? 'disabled' : ''}`}
                onClick={() => setActiveTool('draw_cable')}
                title={hasOLT ? 'Dibujar un cable desde un nodo' : 'Primero debes agregar una OLT'}
            >
                <Cable size={16} strokeWidth={2.5} />
                <span>Dibujar Cable</span>
            </button>

            {/* ── Controles de dibujo activo ── */}
            {isDrawingCable && (
                <>
                    <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />

                    <button
                        className="toolbar-btn"
                        onClick={onFinishCable}
                        style={{ color: 'var(--success)', borderColor: 'rgba(16,185,129,0.3)' }}
                        title="Finalizar y guardar el cable"
                    >
                        <Check size={16} strokeWidth={3} />
                        <span>Finalizar ({cablePointCount} pts)</span>
                    </button>

                    <button
                        className="toolbar-btn"
                        onClick={onCancelCable}
                        style={{ color: 'var(--error)', borderColor: 'rgba(239,68,68,0.3)' }}
                        title="Cancelar el trazo actual"
                    >
                        <X size={16} strokeWidth={3} />
                        <span>Cancelar</span>
                    </button>
                </>
            )}

            {/* ── Tip de flujo ── */}
            {!isDrawingCable && hasOLT && (
                <p style={{
                    fontSize: '0.72rem', color: 'var(--text-muted)',
                    padding: '12px 4px 0', lineHeight: '1.45'
                }}>
                    💡 Haz <strong style={{ color: 'var(--text-secondary)' }}>doble clic</strong> sobre un nodo para trazar un cable y crear conexiones.
                </p>
            )}
        </div>
    );
};

export default MapToolbar;
