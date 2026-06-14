import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/apiFetch';
import { API_BASE } from './map/types';
import DiagramadorEmpalmes from './DiagramadorEmpalmes';
import { Loader2, Box, ArrowRight, MapPin } from 'lucide-react';

interface NodeItem {
  id: string;
  name: string;
  node_type: string;
  location: {
    lat: number;
    lng: number;
  };
}

export default function GestorEmpalmesPage() {
  const [nodes, setNodes] = useState<NodeItem[]>([]);
  const [selectedNode, setSelectedNode] = useState<NodeItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load list of nodes and check URL params
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        // Fetch all nodes
        const res = await apiFetch(`${API_BASE}/nodes`);
        if (!res.ok) throw new Error('Error al cargar la lista de nodos');
        const nodesData: NodeItem[] = await res.json();
        setNodes(nodesData);

        // Check if there is a node_id in URL query
        const params = new URLSearchParams(window.location.search);
        const nodeId = params.get('node_id');
        if (nodeId) {
          const matched = nodesData.find(n => n.id === nodeId);
          if (matched) {
            setSelectedNode(matched);
          } else {
            // Fetch single node in case it's not in the general list (e.g., pagination or different scope)
            const nodeRes = await apiFetch(`${API_BASE}/nodes/${nodeId}`);
            if (nodeRes.ok) {
              const nodeData = await nodeRes.json();
              setSelectedNode(nodeData);
            } else {
              setError('No se pudo encontrar el nodo especificado en la URL.');
            }
          }
        }
      } catch (err: any) {
        setError(err.message || 'Error de conexión.');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const handleSelectNode = (node: NodeItem) => {
    setSelectedNode(node);
    // Update URL query without reloading
    const newUrl = `${window.location.pathname}?node_id=${node.id}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };

  const handleCloseDiagram = () => {
    setSelectedNode(null);
    // Remove query param from URL
    window.history.pushState({ path: window.location.pathname }, '', window.location.pathname);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0', gap: '20px' }}>
        <Loader2 className="animate-spin" size={48} color="#a78bfa" />
        <span style={{ color: '#a78bfa', fontWeight: 600, letterSpacing: '0.1em' }}>CARGANDO NODOS...</span>
      </div>
    );
  }

  if (selectedNode) {
    return (
      <div style={{ height: 'calc(100vh - 140px)', position: 'relative' }}>
        <DiagramadorEmpalmes
          node={selectedNode}
          onClose={handleCloseDiagram}
        />
      </div>
    );
  }

  // Filter nodes suitable for splicing (Muflas, ODFs, and Caja NAPs)
  const spliceableNodes = nodes.filter(n => ['MUFLA', 'ODF', 'CAJA_NAP'].includes(n.node_type));

  const nodeIcons: Record<string, string> = {
    OLT: '📡',
    MUFLA: '🔶',
    CAJA_NAP: '📦',
    CLIENTE_ONU: '🏠',
    ODF: '⚙️'
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }} className="animate-in">
      <div className="glass-panel" style={{ padding: '36px', textAlign: 'center' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '20px', display: 'inline-flex', padding: '16px', background: 'rgba(167, 139, 250, 0.1)', borderRadius: '24px' }}>
          <Box size={44} color="#a78bfa" />
        </div>
        <h2 style={{ color: 'white', marginBottom: '12px', fontSize: '1.8rem', fontWeight: 800 }}>
          Selecciona una Mufla u ODF para Empalmar
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto 32px' }}>
          Para ver o editar el diagrama lógico de fusiones e hilos de fibra, elige un nodo del listado inferior.
        </p>

        {error && (
          <div style={{ marginBottom: '24px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '10px', color: '#fca5a5', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left', maxHeight: '400px', overflowY: 'auto', paddingRight: '6px' }}>
          {spliceableNodes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              No se encontraron Muflas, ODFs o Cajas NAP registradas.
            </div>
          ) : (
            spliceableNodes.map(node => (
              <div
                key={node.id}
                onClick={() => handleSelectNode(node)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                className="glass-row-hover"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '1.4rem' }}>{nodeIcons[node.node_type] || '📍'}</span>
                  <div>
                    <div style={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>{node.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <span className={`modern-badge badge-${node.node_type.toLowerCase()}`} style={{ padding: '2px 6px', fontSize: '0.65rem', borderRadius: '4px' }}>
                        {node.node_type}
                      </span>
                      <span>•</span>
                      <MapPin size={10} />
                      <span>{node.location ? `${Number(node.location.lat).toFixed(5)}, ${Number(node.location.lng).toFixed(5)}` : '—'}</span>
                    </div>
                  </div>
                </div>
                <ArrowRight size={18} color="var(--text-muted)" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
