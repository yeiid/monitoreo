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

const TerminationModal: React.FC<TerminationModalProps> = ({
    startType,
    clientForm,
    setClientForm,
    onSelectTarget,
    onCancel,
}) => (
    <div className="info-panel" style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)', width: '380px',
        textAlign: 'center', zIndex: 2000,
        boxShadow: '0 0 50px rgba(0,0,0,0.8)',
        border: '1px solid rgba(139, 92, 246, 0.4)',
        padding: '30px',
    }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>📍</div>
        <h3 style={{ marginBottom: '8px', color: 'white' }}>Final de recorrido</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Cable iniciado en: <strong>{startType}</strong>
            </p>

            {/* OLT → Only ODF */}
            {startType === 'OLT' && (
                <button className="primary-btn" onClick={() => onSelectTarget('ODF')}
                    style={{ background: NODE_CONFIG.ODF.color, padding: '12px', border: '2px solid #9ca3af' }}>
                    🔩 Instalar ODF (Distribuidor)
                </button>
            )}

            {/* ODF → Mufla */}
            {startType === 'ODF' && (
                <button className="primary-btn" onClick={() => onSelectTarget('MUFLA')}
                    style={{ background: NODE_CONFIG.MUFLA.color, padding: '12px' }}>
                    Crear Mufla (Troncal)
                </button>
            )}

            {/* Mufla → Mufla or NAP */}
            {startType === 'MUFLA' && (
                <>
                    <button className="primary-btn" onClick={() => onSelectTarget('MUFLA')}
                        style={{ background: NODE_CONFIG.MUFLA.color, padding: '12px' }}>
                        Crear Mufla (Troncal)
                    </button>
                    <button className="primary-btn" onClick={() => onSelectTarget('CAJA_NAP')}
                        style={{ background: NODE_CONFIG.CAJA_NAP.color, padding: '12px' }}>
                        Crear Caja NAP
                    </button>
                </>
            )}

            {/* NAP → NAP or Cliente */}
            {startType === 'CAJA_NAP' && (
                <>
                    <button className="primary-btn" onClick={() => onSelectTarget('CAJA_NAP')}
                        style={{ background: NODE_CONFIG.CAJA_NAP.color, padding: '12px' }}>
                        Nueva NAP (Distribución)
                    </button>

                    <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
                        <label style={{ display: 'block', textAlign: 'left', fontSize: '0.75rem', marginBottom: '8px', color: 'var(--text-muted)' }}>
                            DATOS DEL CLIENTE
                        </label>
                        <input className="form-input" placeholder="Nombre Completo"
                            value={clientForm.name}
                            onChange={e => setClientForm({ ...clientForm, name: e.target.value })}
                            style={{ marginBottom: '8px' }} />
                        <input className="form-input" placeholder="Contrato / ID"
                            value={clientForm.contract}
                            onChange={e => setClientForm({ ...clientForm, contract: e.target.value })}
                            style={{ marginBottom: '8px' }} />
                        <button disabled={!clientForm.name} className="primary-btn"
                            onClick={() => onSelectTarget('CLIENTE_ONU')}
                            style={{ background: NODE_CONFIG.CLIENTE_ONU.color, width: '100%', opacity: clientForm.name ? 1 : 0.5, padding: '12px' }}>
                            Instalar Cliente (ONU)
                        </button>
                    </div>
                </>
            )}

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: '12px', paddingTop: '16px' }}>
                <button className="secondary-btn" onClick={onCancel} style={{ width: '100%', opacity: 0.7 }}>
                    Cancelar y Borrar Trazo
                </button>
            </div>
        </div>
    </div>
);

export default TerminationModal;
