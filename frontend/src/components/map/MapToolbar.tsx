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
        <div className="map-toolbar-hud">
            {/* ── SECCIÓN 1: NAVEGACIÓN ── */}
            <div className="toolbar-section">
                <button
                    className={`hud-btn ${activeTool === 'select' ? 'active' : ''}`}
                    onClick={() => setActiveTool('select')}
                    title="Modo Selección"
                >
                    <MousePointer size={18} />
                    <span>Navegar</span>
                </button>

                <button
                    className="hud-btn"
                    onClick={onOpenLocationSelector}
                    title="Cambiar Ubicación"
                >
                    <MapPin size={18} />
                    <span>Lugar</span>
                </button>
            </div>

            <div className="toolbar-divider" />

            {/* ── SECCIÓN 2: INFRAESTRUCTURA ── */}
            <div className="toolbar-section">
                <button
                    className={`hud-btn ${activeTool === 'add_olt' ? 'active' : ''}`}
                    onClick={() => setActiveTool('add_olt')}
                    title="Agregar OLT"
                >
                    <div className="dot-indicator" style={{ background: NODE_CONFIG.OLT.color }} />
                    <span>OLT</span>
                </button>

                <button
                    disabled={!hasOLT}
                    className={`hud-btn ${activeTool === 'draw_cable' ? 'active' : ''} ${!hasOLT ? 'disabled' : ''}`}
                    onClick={() => setActiveTool('draw_cable')}
                    title={hasOLT ? 'Trazar Cableado' : 'Requiere OLT'}
                >
                    <Cable size={18} />
                    <span>Cable</span>
                </button>
            </div>

            {/* ── SECCIÓN 3: ACCIONES DE DIBUJO (CONDICIONAL) ── */}
            {isDrawingCable && (
                <>
                    <div className="toolbar-divider green" />
                    <div className="toolbar-section drawing-actions">
                        <button
                            className="hud-btn success-intent"
                            onClick={onFinishCable}
                            title="Finalizar Trazo"
                        >
                            <Check size={18} />
                            <span>Confirmar ({cablePointCount})</span>
                        </button>

                        <button
                            className="hud-btn danger-intent"
                            onClick={onCancelCable}
                            title="Borrar Trazo"
                        >
                            <X size={18} />
                            <span>Cancelar</span>
                        </button>
                    </div>
                </>
            )}

            {/* ── TIP DISCRETO ── */}
            {!isDrawingCable && hasOLT && (
                <div className="toolbar-hint desktop-only">
                    <span>💡 Doble clic para trazar rápido</span>
                </div>
            )}
        </div>
    );
};

export default MapToolbar;
