import React from 'react';
import { Plus, X, Server, Layers, Package, User } from 'lucide-react';
import { NODE_CONFIG } from './types';

// ── Add Node Form Modal ──
interface AddNodeFormProps {
    pendingNodeType: string;
    pendingLocation: { lat: number; lng: number } | null;
    formName: string;
    setFormName: (v: string) => void;
    formDescription: string;
    setFormDescription: (v: string) => void;
    formPower: number | undefined;
    setFormPower: (v: number | undefined) => void;
    onSave: () => void;
    onCancel: () => void;
}

export const AddNodeForm: React.FC<AddNodeFormProps> = ({
    pendingNodeType, pendingLocation,
    formName, setFormName,
    formDescription, setFormDescription,
    formPower, setFormPower,
    onSave, onCancel,
}) => {
    const iconMap: Record<string, any> = {
        OLT: <Server size={18} />,
        MUFLA: <Layers size={18} />,
        CAJA_NAP: <Package size={18} />,
        CLIENTE_ONU: <User size={18} />,
    };

    return (
        <div className="info-panel animate-in" style={{ 
            top: '24px', 
            right: '24px', 
            width: '320px',
            border: '1px solid rgba(157, 78, 221, 0.4)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 20px rgba(157, 78, 221, 0.15)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>
                    {iconMap[pendingNodeType] || <Plus size={18} />} Nueva{' '}
                    {NODE_CONFIG[pendingNodeType]?.label || 'Nodo'}
                </h3>
                <button onClick={onCancel} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <X size={18} />
                </button>
            </div>

            <div className="form-group">
                <label>Nombre del Elemento</label>
                <input
                    className="form-input"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder={`Ej. ${NODE_CONFIG[pendingNodeType]?.label} Zona Norte`}
                    autoFocus
                />
            </div>

            {(pendingNodeType === 'MUFLA' || pendingNodeType === 'CAJA_NAP') && (
                <div className="form-group">
                    <label>Potencia de Salida (dBm)</label>
                    <input
                        type="number"
                        step="0.1"
                        className="form-input"
                        value={formPower ?? ''}
                        onChange={(e) => setFormPower(parseFloat(e.target.value))}
                        placeholder="Ej. -18.5"
                    />
                </div>
            )}

            <div className="form-group">
                <label>Descripción / Observaciones</label>
                <input
                    className="form-input"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Detalles adicionales..."
                />
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
                <label>Coordenadas Capturadas</label>
                <div style={{ 
                    fontSize: '0.78rem', 
                    color: 'var(--primary-glow)', 
                    background: 'rgba(157, 78, 221, 0.08)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    marginTop: '4px',
                    border: '1px solid rgba(157, 78, 221, 0.15)'
                }}>
                    {pendingLocation?.lat.toFixed(7)}, {pendingLocation?.lng.toFixed(7)}
                </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                    className="primary-btn" 
                    onClick={onSave}
                    disabled={!formName}
                    style={{ flex: 2 }}
                >
                    <Plus size={16} /> Crear {NODE_CONFIG[pendingNodeType]?.label}
                </button>
                <button 
                    className="secondary-btn" 
                    onClick={onCancel}
                    style={{ flex: 1, padding: '10px' }}
                >
                    Cancelar
                </button>
            </div>
        </div>
    );
};

// ── Cable Name/Type Form Modal ──
interface CableFormProps {
    cableName: string;
    setCableName: (v: string) => void;
    cableType: string;
    setCableType: (v: string) => void;
    cableCapacity: number;
    setCableCapacity: (v: number) => void;
    cablePointCount: number;
    onSave: () => void;
    onCancel: () => void;
}

export const CableForm: React.FC<CableFormProps> = ({
    cableName, setCableName,
    cableType, setCableType,
    cableCapacity, setCableCapacity,
    cablePointCount, onSave, onCancel,
}) => (
    <div className="info-panel animate-in" style={{ 
        top: '24px', 
        right: '24px', 
        width: '320px',
        border: '1px solid rgba(157, 78, 221, 0.4)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 20px rgba(157, 78, 221, 0.15)'
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>
                Cableado Nuevo
            </h3>
            <button onClick={onCancel} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
            </button>
        </div>

        <div className="form-group">
            <label>Identificador del Cable</label>
            <input 
                className="form-input" 
                value={cableName} 
                onChange={(e) => setCableName(e.target.value)} 
                placeholder="Ej. Troncal Principal - Sector A" 
                autoFocus 
            />
        </div>

        <div className="form-group">
            <label>Jerarquía de Red</label>
            <select className="form-input" value={cableType} onChange={(e) => setCableType(e.target.value)}>
                <option value="TRONCAL">Fibra Troncal (Morado)</option>
                <option value="DISTRIBUCION">Fibra de Distribución (Azul)</option>
                <option value="ACOMETIDA">Cables de Acometida (Verde)</option>
            </select>
        </div>

        <div className="form-group">
            <label>Capacidad (Fibras / Hilos)</label>
            <select className="form-input" value={cableCapacity} onChange={(e) => setCableCapacity(Number(e.target.value))}>
                <option value={6}>6 Fibras</option>
                <option value={12}>12 Fibras</option>
                <option value={24}>24 Fibras</option>
                <option value={48}>48 Fibras</option>
                <option value={96}>96 Fibras</option>
                <option value={144}>144 Fibras</option>
            </select>
        </div>

        <div className="form-group" style={{ marginBottom: '24px' }}>
            <label>Geometría</label>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', padding: '4px 0' }}>
                Se han trazado <strong style={{ color: 'white' }}>{cablePointCount} puntos</strong> de referencia.
            </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
            <button 
                className="primary-btn" 
                onClick={onSave}
                disabled={!cableName}
                style={{ flex: 1 }}
            >
                Confirmar Tendido
            </button>
            <button className="secondary-btn" onClick={onCancel} style={{ flex: 1 }}>
                Borrar Trazado
            </button>
        </div>
    </div>
);
