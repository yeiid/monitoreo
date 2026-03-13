import React from 'react';
import { Cable, MousePointer, MapPin } from 'lucide-react';
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
            <button
                className={`toolbar-btn ${activeTool === 'select' ? 'active' : ''}`}
                onClick={() => setActiveTool('select')}
            >
                <MousePointer size={16} /> <span className="desktop-only">Seleccionar</span>
            </button>

            <button
                className="toolbar-btn"
                onClick={onOpenLocationSelector}
                title="Cambiar Ubicación"
            >
                <MapPin size={16} /> <span className="desktop-only">Ubicación</span>
            </button>

            <div className="nav-section-title desktop-only" style={{ padding: '10px 4px 4px' }}>
                Nodos Maestros
            </div>

            {/* Only OLT can be added manually as origin point */}
            <button
                className={`toolbar-btn ${activeTool === 'add_olt' ? 'active' : ''}`}
                onClick={() => setActiveTool('add_olt')}
            >
                <span className="dot" style={{ background: NODE_CONFIG.OLT.color }} />
                {NODE_CONFIG.OLT.label}
            </button>

            <div className="nav-section-title desktop-only" style={{ padding: '10px 4px 4px' }}>
                Cables
            </div>

            <button
                disabled={!hasOLT}
                className={`toolbar-btn ${activeTool === 'draw_cable' ? 'active' : ''} ${!hasOLT ? 'disabled' : ''}`}
                onClick={() => setActiveTool('draw_cable')}
            >
                <Cable size={16} /> <span className="desktop-only">Dibujar Cable</span>
            </button>

            {isDrawingCable && (
                <>
                    <button className="toolbar-btn" onClick={onFinishCable}>
                        ✓ Finalizar ({cablePointCount} pts)
                    </button>
                    <button className="toolbar-btn" onClick={onCancelCable}>
                        ✕ Cancelar
                    </button>
                </>
            )}
        </div>
    );
};

export default MapToolbar;
