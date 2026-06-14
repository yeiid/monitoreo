import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../utils/apiFetch';
import { API_BASE } from './map/types';
import { X, Cpu, Activity, Info, Layout, Layers, Settings, Cable, MapPin } from 'lucide-react';
import { ODFView } from './GestorODF';

interface OltPortUsage {
  card: number;
  port: number;
  route_id: string;
  route_name: string;
  route_type: string;
  capacity: number;
  end_node_id: string;
  end_node_name: string;
  length_meters: number | null;
}

interface OltPortsResponse {
  node_id: string;
  node_name: string;
  cards: number;
  ports_per_card: number;
  used_ports: OltPortUsage[];
  total_used: number;
  total_capacity: number;
}

interface GestorOLTProps {
  node: {
    id: string;
    name: string;
    node_type: string;
    hardware_details?: {
      cards?: number;
      ports_per_card?: number;
      capacity?: number;
      used_ports?: number;
    };
  };
  onClose: () => void;
  onNodeUpdated?: () => void;
}

const GestorOLT: React.FC<GestorOLTProps> = ({ node, onClose, onNodeUpdated }) => {
  const [activeTab, setActiveTab] = useState<'hardware' | 'odf'>('hardware');
  const [oltData, setOltData] = useState<OltPortsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPort, setSelectedPort] = useState<OltPortUsage | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [configCards, setConfigCards] = useState(5);
  const [configPorts, setConfigPorts] = useState(16);
  const [saving, setSaving] = useState(false);

  const loadOltPorts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`${API_BASE}/nodes/${node.id}/olt-ports`);
      if (res.ok) {
        const data: OltPortsResponse = await res.json();
        setOltData(data);
        setConfigCards(data.cards);
        setConfigPorts(data.ports_per_card);
      } else {
        setError('Error al cargar datos del OLT');
      }
    } catch {
      setError('No se pudo conectar al servidor');
    } finally {
      setLoading(false);
    }
  }, [node.id]);

  useEffect(() => {
    loadOltPorts();
  }, [loadOltPorts]);

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const res = await apiFetch(`${API_BASE}/nodes/${node.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hardware_details: { cards: configCards, ports_per_card: configPorts }
        }),
      });
      if (res.ok) {
        setShowConfig(false);
        loadOltPorts();
        onNodeUpdated?.();
      } else {
        setError('Error al guardar configuración');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  // Build a lookup map: "card-port" -> OltPortUsage
  const portMap = new Map<string, OltPortUsage>();
  (oltData?.used_ports || []).forEach(p => {
    portMap.set(`${p.card}-${p.port}`, p);
  });

  const cards = oltData?.cards || node.hardware_details?.cards || 5;
  const portsPerCard = oltData?.ports_per_card || node.hardware_details?.ports_per_card || 16;
  const totalUsed = oltData?.total_used || 0;
  const totalCapacity = oltData?.total_capacity || cards * portsPerCard;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: '900px', width: '95%' }}>
        <div className="modal-header" style={{ padding: '16px 24px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              padding: '10px',
              borderRadius: '12px',
              boxShadow: '0 0 15px rgba(239, 68, 68, 0.2)'
            }}>
              <Layout size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Gestión OLT — {node.name}</h2>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Nodo Maestro de Distribución Óptica
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          padding: '0 24px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.01)',
          gap: '24px'
        }}>
          <button
            onClick={() => setActiveTab('hardware')}
            style={{
              padding: '16px 4px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'hardware' ? '2px solid #ef4444' : '2px solid transparent',
              color: activeTab === 'hardware' ? 'white' : 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: activeTab === 'hardware' ? 700 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <Cpu size={16} /> Chassis & Tarjetas
          </button>
          <button
            onClick={() => setActiveTab('odf')}
            style={{
              padding: '16px 4px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'odf' ? '2px solid #ef4444' : '2px solid transparent',
              color: activeTab === 'odf' ? 'white' : 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: activeTab === 'odf' ? 700 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <Layers size={16} /> Bandeja ODF Integrada
          </button>
        </div>

        <div className="modal-body" style={{ padding: '24px', minHeight: '400px' }}>
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 16px', marginBottom: '16px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '10px', color: '#fca5a5', fontSize: '0.8rem'
            }}>
              <span>{error}</span>
              <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }}>
                <X size={14} />
              </button>
            </div>
          )}

          {activeTab === 'hardware' ? (
            <div className="animate-in">
              {/* Stats */}
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <div className="glass-morphism" style={{ flex: '1 1 180px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', padding: '10px', borderRadius: '10px' }}>
                    <Cpu size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tarjetas</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>{cards}</div>
                  </div>
                </div>
                <div className="glass-morphism" style={{ flex: '1 1 180px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', padding: '10px', borderRadius: '10px' }}>
                    <Activity size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Puertos/Tarjeta</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>{portsPerCard}</div>
                  </div>
                </div>
                <div className="glass-morphism" style={{ flex: '1 1 180px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '10px', borderRadius: '10px' }}>
                    <Info size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Activos</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>{totalUsed} / {totalCapacity}</div>
                  </div>
                </div>
                <button
                  className="glass-morphism"
                  onClick={() => setShowConfig(!showConfig)}
                  style={{
                    flex: '0 0 auto',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Settings size={16} /> Configurar
                </button>
              </div>

              {/* Config Panel */}
              {showConfig && (
                <div style={{
                  marginBottom: '20px',
                  padding: '16px 20px',
                  background: 'rgba(139, 92, 246, 0.08)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  flexWrap: 'wrap'
                }}>
                  <span style={{ fontSize: '0.8rem', color: '#a78bfa', fontWeight: 700 }}>Configurar Chassis:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tarjetas:</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={configCards}
                      onChange={(e) => setConfigCards(parseInt(e.target.value) || 1)}
                      style={{
                        width: '60px', padding: '6px 10px',
                        background: '#0a0a14', border: '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: '6px', color: 'white', fontSize: '0.8rem', fontWeight: 700
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Puertos/Tarjeta:</label>
                    <input
                      type="number"
                      min={1}
                      max={64}
                      value={configPorts}
                      onChange={(e) => setConfigPorts(parseInt(e.target.value) || 1)}
                      style={{
                        width: '60px', padding: '6px 10px',
                        background: '#0a0a14', border: '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: '6px', color: 'white', fontSize: '0.8rem', fontWeight: 700
                      }}
                    />
                  </div>
                  <button
                    onClick={handleSaveConfig}
                    disabled={saving}
                    className="primary-btn"
                    style={{ padding: '6px 16px', fontSize: '0.75rem' }}
                  >
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              )}

              {/* Rack View */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Cargando chassis...</div>
              ) : (
                <div className="olt-rack glass-morphism" style={{ padding: '24px', background: 'rgba(0,0,0,0.2)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {Array.from({ length: cards }).map((_, cardIdx) => (
                      <div key={cardIdx} style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{
                          width: '80px',
                          fontSize: '0.7rem',
                          fontWeight: '800',
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          Slot {cardIdx}
                        </div>
                        <div style={{
                          flex: 1,
                          display: 'grid',
                          gridTemplateColumns: `repeat(auto-fill, minmax(28px, 1fr))`,
                          gap: '6px',
                          background: 'rgba(255,255,255,0.02)',
                          padding: '10px',
                          borderRadius: '8px',
                          border: '1px solid rgba(255,255,255,0.05)',
                          minWidth: '200px'
                        }}>
                          {Array.from({ length: portsPerCard }).map((_, portIdx) => {
                            const portData = portMap.get(`${cardIdx}-${portIdx}`);
                            const isConnected = !!portData;
                            const isSelected = selectedPort?.card === cardIdx && selectedPort?.port === portIdx;

                            return (
                              <div
                                key={portIdx}
                                onClick={() => setSelectedPort(isSelected ? null : portData || null)}
                                style={{
                                  aspectRatio: '1',
                                  borderRadius: '4px',
                                  background: isConnected
                                    ? 'linear-gradient(135deg, #ef4444, #b91c1c)'
                                    : 'rgba(255,255,255,0.05)',
                                  border: isSelected
                                    ? '2px solid #fbbf24'
                                    : isConnected
                                      ? '1px solid #ef4444'
                                      : '1px solid rgba(255,255,255,0.1)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.6rem',
                                  color: isConnected ? 'white' : 'var(--text-muted)',
                                  fontWeight: 'bold',
                                  boxShadow: isConnected ? '0 0 10px rgba(239, 68, 68, 0.4)' : 'none',
                                  transition: 'all 0.15s ease',
                                  transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                                }}
                                title={isConnected
                                  ? `Slot ${cardIdx} Puerto ${portIdx} — ${portData.route_name} → ${portData.end_node_name}`
                                  : `Slot ${cardIdx} Puerto ${portIdx} — Libre`
                                }
                              >
                                {portIdx}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Port Detail */}
              {selectedPort && (
                <div style={{
                  marginTop: '16px',
                  padding: '16px 20px',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  flexWrap: 'wrap',
                  animation: 'fadeIn 0.2s ease'
                }}>
                  <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '10px', borderRadius: '10px' }}>
                    <Cable size={20} color="#ef4444" />
                  </div>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white' }}>
                      Slot {selectedPort.card} — Puerto {selectedPort.port}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#fca5a5', marginTop: '2px' }}>
                      {selectedPort.route_name} → {selectedPort.end_node_name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', gap: '12px' }}>
                      <span>Tipo: {selectedPort.route_type}</span>
                      <span>Capacidad: {selectedPort.capacity}f</span>
                      {selectedPort.length_meters && <span>{selectedPort.length_meters}m</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPort(null)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <ODFView
              nodeId={node.id}
              nodeName={node.name}
              hardwareDetails={{
                capacity: node.hardware_details?.capacity || 48,
                used_ports: node.hardware_details?.used_ports || 0
              }}
            />
          )}
        </div>

        <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="secondary-btn" onClick={onClose}>Cerrar Gestión</button>
        </div>
      </div>
    </div>
  );
};

export default GestorOLT;
