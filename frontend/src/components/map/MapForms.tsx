import React from 'react';
import { Plus } from 'lucide-react';
import L from 'leaflet';
import { NODE_CONFIG } from './types';

// ── Add Node Form Modal ──
interface AddNodeFormProps {
    pendingNodeType: string;
    pendingLocation: L.LatLng | null;
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
}) => (
    <div className="info-panel" style={{ top: '16px', right: '16px' }}>
        <h3>
            <Plus size={18} /> Nuevo{' '}
            {NODE_CONFIG[pendingNodeType]?.label || 'Nodo'}
        </h3>

        <div className="form-group">
            <label>Nombre</label>
            <input
                className="form-input"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={`Ej. ${NODE_CONFIG[pendingNodeType]?.label} Parque Central`}
                autoFocus
            />
        </div>

        {(pendingNodeType === 'MUFLA' || pendingNodeType === 'CAJA_NAP') && (
            <div className="form-group">
                <label>Potencia Óptica (dBm)</label>
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
            <label>Descripción</label>
            <input
                className="form-input"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Opcional..."
            />
        </div>

        <div className="form-group">
            <label>Ubicación</label>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {pendingLocation?.lat.toFixed(6)}, {pendingLocation?.lng.toFixed(6)}
            </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
            <button className="primary-btn" onClick={onSave}>Guardar</button>
            <button className="secondary-btn" onClick={onCancel}>Cancelar</button>
        </div>
    </div>
);

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
    <div className="info-panel" style={{ top: '16px', right: '16px' }}>
        <h3>Nuevo Cable</h3>

        <div className="form-group">
            <label>Nombre</label>
            <input className="form-input" value={cableName} onChange={(e) => setCableName(e.target.value)} placeholder="Ej. Troncal Calle 10" autoFocus />
        </div>

        <div className="form-group">
            <label>Tipo de Cable</label>
            <select className="form-input" value={cableType} onChange={(e) => setCableType(e.target.value)}>
                <option value="TRONCAL">Troncal (Morado)</option>
                <option value="DISTRIBUCION">Distribución (Azul)</option>
                <option value="ACOMETIDA">Acometida / Drop (Verde)</option>
            </select>
        </div>

        <div className="form-group">
            <label>Hilos (Capacidad)</label>
            <select className="form-input" value={cableCapacity} onChange={(e) => setCableCapacity(Number(e.target.value))}>
                <option value={6}>6 hilos</option>
                <option value={12}>12 hilos</option>
                <option value={24}>24 hilos</option>
                <option value={48}>48 hilos</option>
                <option value={96}>96 hilos</option>
            </select>
        </div>

        <div className="form-group">
            <label>Puntos</label>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{cablePointCount} puntos dibujados</div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
            <button className="primary-btn" onClick={onSave}>Guardar Cable</button>
            <button className="secondary-btn" onClick={onCancel}>Cancelar</button>
        </div>
    </div>
);
