import React from 'react';
import { Plus, GitBranch, Search, Layers, MapPin, X } from 'lucide-react';

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
    onOpenSearch,
    onToggleLayers
}) => {
    return (
        <div className="mobile-only" style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            width: 'calc(100% - 40px)',
            maxWidth: '380px'
        }}>
            <div className="glass-morphism" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 20px',
                borderRadius: '24px',
                background: 'rgba(15, 15, 25, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(20px)'
            }}>
                {/* Search */}
                <button 
                    onClick={onOpenSearch}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        padding: '10px'
                    }}
                >
                    <Search size={22} />
                </button>

                {/* Add OLT */}
                <button 
                    onClick={onAddOLT}
                    style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '2px solid rgba(239, 68, 68, 0.3)',
                        color: '#ef4444',
                        padding: '10px',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <MapPin size={22} fill="currentColor" fillOpacity={0.2} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>+ OLT</span>
                </button>

                {/* Draw Cable Toggle */}
                <button 
                    onClick={onToggleDrawing}
                    style={{
                        background: isDrawing ? 'rgba(167, 139, 250, 0.2)' : 'none',
                        border: isDrawing ? '2px solid #a78bfa' : 'none',
                        color: isDrawing ? '#a78bfa' : '#94a3b8',
                        padding: isDrawing ? '8px' : '10px',
                        borderRadius: '16px',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                >
                    {isDrawing ? <X size={22} /> : <GitBranch size={22} />}
                    {isDrawing && <div style={{ position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)', background: '#a78bfa', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 800, whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(167, 139, 250, 0.4)' }}>DIBUJANDO CABLE...</div>}
                </button>

                {/* Layers */}
                <button 
                    onClick={onToggleLayers}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        padding: '10px'
                    }}
                >
                    <Layers size={22} />
                </button>
            </div>
        </div>
    );
};

export default MobileToolbar;
