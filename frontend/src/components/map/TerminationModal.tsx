import React from 'react';
import { NODE_CONFIG } from './types';

interface ClientForm {
    name: string;
    address: string;
    contract: string;
}

interface TerminationModalProps {
    startType: string | undefined;
    clientForm: ClientForm;
    setClientForm: (f: ClientForm) => void;
    onSelectTarget: (type: string) => void;
    onCancel: () => void;
}

interface TargetButton {
    type: string;
    label: string;
    icon: string;
    color: string;
}

const ALLOWED_CHILDREN: Record<string, TargetButton[]> = {
    'OLT': [
        { type: 'MUFLA', label: 'Mufla / Empalme Troncal', icon: '🔗', color: NODE_CONFIG.MUFLA.color },
        { type: 'CAJA_NAP', label: 'Caja NAP (Distribución)', icon: '📦', color: NODE_CONFIG.CAJA_NAP.color },
    ],
    'MUFLA': [
        { type: 'MUFLA', label: 'Nueva Mufla (Troncal)', icon: '🔗', color: NODE_CONFIG.MUFLA.color },
        { type: 'CAJA_NAP', label: 'Caja NAP (Distribución)', icon: '📦', color: NODE_CONFIG.CAJA_NAP.color },
    ],
    'CAJA_NAP': [
        { type: 'CAJA_NAP', label: 'Nueva NAP (Cascada)', icon: '📦', color: NODE_CONFIG.CAJA_NAP.color },
        { type: 'CLIENTE_ONU', label: 'Cliente ONU', icon: '🏠', color: NODE_CONFIG.CLIENTE_ONU.color },
    ],
};

const TerminationModal: React.FC<TerminationModalProps> = ({
    startType,
    clientForm,
    setClientForm,
    onSelectTarget,
    onCancel,
}) => {
    const options = (startType && ALLOWED_CHILDREN[startType]) || [];
    const isClientTarget = options.some(o => o.type === 'CLIENTE_ONU');

    return (
        <div className="info-panel" style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)', width: '400px',
            zIndex: 2000, padding: '32px',
            boxShadow: '0 0 60px rgba(0,0,0,0.9)',
            border: '1px solid var(--primary-glow)',
        }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📍</div>
                <h3 style={{ margin: 0, color: 'white', fontSize: '1.1rem', fontWeight: 700 }}>
                    Final del Trazo de Cable
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    Iniciado en: <strong style={{ color: 'var(--text-secondary)' }}>{startType}</strong>
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {options.filter(o => o.type !== 'CLIENTE_ONU').map(option => (
                    <button
                        key={option.type}
                        className="toolbar-btn"
                        onClick={() => onSelectTarget(option.type)}
                        style={{ padding: '14px', borderColor: `${option.color}44`, justifyContent: 'flex-start', gap: '14px' }}
                    >
                        <span style={{ fontSize: '1.4rem', lineHeight: '1' }}>{option.icon}</span>
                        <span style={{ color: option.color, fontWeight: 700 }}>{option.label}</span>
                    </button>
                ))}

                {/* Client requires form input */}
                {isClientTarget && (
                    <div style={{
                        borderTop: '1px solid var(--border)',
                        paddingTop: '16px', marginTop: '8px',
                        display: 'flex', flexDirection: 'column', gap: '10px'
                    }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
                            Instalar Cliente ONU 🏠
                        </p>
                        <input
                            className="form-input"
                            placeholder="Nombre del cliente"
                            value={clientForm.name}
                            onChange={e => setClientForm({ ...clientForm, name: e.target.value })}
                        />
                        <input
                            className="form-input"
                            placeholder="Número de contrato / ID"
                            value={clientForm.contract}
                            onChange={e => setClientForm({ ...clientForm, contract: e.target.value })}
                        />
                        <button
                            disabled={!clientForm.name}
                            className="toolbar-btn"
                            onClick={() => onSelectTarget('CLIENTE_ONU')}
                            style={{
                                padding: '14px',
                                borderColor: `${NODE_CONFIG.CLIENTE_ONU.color}44`,
                                justifyContent: 'center',
                                opacity: clientForm.name ? 1 : 0.45,
                                color: NODE_CONFIG.CLIENTE_ONU.color,
                                fontWeight: 700,
                            }}
                        >
                            ✓ Confirmar Instalación
                        </button>
                    </div>
                )}

                {options.length === 0 && (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Este nodo no permite conexiones hacia abajo.
                    </p>
                )}

                <div style={{ borderTop: '1px solid var(--border)', marginTop: '8px', paddingTop: '16px' }}>
                    <button
                        className="secondary-btn"
                        onClick={onCancel}
                        style={{ width: '100%', opacity: 0.7 }}
                    >
                        Cancelar y borrar trazo
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TerminationModal;
