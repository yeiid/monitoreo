import React from 'react';
import { Plus, GitBranch, Search, Layers, MapPin, X, MousePointer, Cable, Menu } from 'lucide-react';

interface MobileToolbarProps {
    onAddOLT: () => void;
    isDrawing: boolean;
    onToggleDrawing: () => void;
    onOpenSearch: () => void;
    onToggleLayers: () => void;
}

const MobileToolbar: React.FC<MobileToolbarProps> = ({
    onAddOLT,
    isDrawing,
    onToggleDrawing,
    onOpenSearch, // Will be wired to Location Selector in FTTHMap
    onToggleLayers
}) => {
    return (
        <div className="map-toolbar-hud mobile-only" style={{ 
            width: '90%', 
            maxWidth: '360px', 
            justifyContent: 'space-around', 
            bottom: '24px' 
        }}>
            
            {/* Lupa / Ubicación */}
            <button
                className="hud-btn"
                onClick={onOpenSearch}
                title="Buscar Ubicación"
            >
                <MapPin size={22} />
                <span style={{ fontSize: '0.6rem' }}>Lugar</span>
            </button>

            <div className="toolbar-divider" />

            {/* Agregar OLT */}
            <button
                className="hud-btn"
                onClick={onAddOLT}
                title="Agregar OLT"
            >
                <div className="dot-indicator" style={{ background: '#ef4444' }} />
                <span style={{ fontSize: '0.6rem' }}>OLT</span>
            </button>

            <div className="toolbar-divider" />

            {/* Trazar Cable */}
            <button
                className={`hud-btn ${isDrawing ? 'active' : ''}`}
                onClick={onToggleDrawing}
                title="Trazar Cable"
            >
                {isDrawing ? <X size={22} /> : <Cable size={22} />}
                <span style={{ fontSize: '0.6rem' }}>{isDrawing ? 'Cancelar' : 'Cable'}</span>
            </button>

            <div className="toolbar-divider" />

            {/* Menú Principal */}
            <button
                className="hud-btn"
                onClick={onToggleLayers}
                title="Menú Principal"
            >
                <Menu size={22} />
                <span style={{ fontSize: '0.6rem' }}>Menú</span>
            </button>

            {isDrawing && (
                <div className="toolbar-hint">
                    <span>📍 DIBUJANDO CABLE...</span>
                </div>
            )}
        </div>
    );
};

export default MobileToolbar;
