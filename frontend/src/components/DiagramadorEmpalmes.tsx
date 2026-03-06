import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { apiFetch } from '../utils/apiFetch';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  type Node as RFNode,
  type Edge as RFEdge,
  BackgroundVariant,
  type OnNodesChange,
  type OnEdgesChange,
  type Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { X, Plus, Save, Trash2, Loader2, Info, Activity } from 'lucide-react';

import {
  FIBER_COLORS,
  FIBER_COLOR_ORDER,
  API_BASE,
  type SyncSplicesRequest,
  type SplicePayload,
  type SplitterPayload
} from './map/types';

// ── Types ──
interface DiagramNodeData extends Record<string, any> {
  label: string;
  side?: 'input' | 'output';
  buffers?: any[];
  splitterType?: string;
  powers?: Record<number, number>;
  configuration?: any;
}

type DiagramNode = RFNode<DiagramNodeData>;
type DiagramEdge = RFEdge;

// ── Power Budget Helpers ──
const getPowerColor = (p?: number | null) => {
  if (p === undefined || p === null) return '#94a3b8';
  if (p > -24.0) return '#10b981'; // Green (Excellent) - match PowerBudgetPanel
  if (p > -27.0) return '#f59e0b'; // Amber (Aceptable)
  return '#ef4444'; // Red (Critical)
};

const IntegratedPower = ({ power }: { power?: number | null }) => {
  if (power === undefined || power === null) return null;
  return (
    <span style={{
      fontSize: '0.62rem',
      color: getPowerColor(power),
      fontWeight: 'bold',
      marginLeft: '5px',
      background: `${getPowerColor(power)}18`,
      padding: '1px 5px',
      borderRadius: '4px',
      border: `1px solid ${getPowerColor(power)}33`,
      fontFamily: 'monospace',
      boxShadow: `0 0 10px ${getPowerColor(power)}22`
    }}>
      {Number(power).toFixed(1)} <span style={{ fontSize: '0.5rem', opacity: 0.7 }}>dBm</span>
    </span>
  );
};

// ── Custom Node: Cable/Fiber Bundle ──
const CableNode = ({ data }: { data: DiagramNodeData }) => {
  const isInput = data.side === 'input';

  return (
    <div
      style={{
        padding: '0',
        borderRadius: '16px',
        background: 'rgba(15, 15, 25, 0.98)',
        border: `1px solid ${isInput ? 'rgba(167, 139, 250, 0.4)' : 'rgba(52, 211, 153, 0.4)'}`,
        minWidth: '220px',
        backdropFilter: 'blur(30px)',
        boxShadow: `0 12px 48px ${isInput ? 'rgba(167, 139, 250, 0.15)' : 'rgba(52, 211, 153, 0.15)'}`,
        overflow: 'hidden'
      }}
    >
      <div style={{
        padding: '10px 14px',
        background: 'transparent',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
      }}>
        <div style={{
          fontSize: '0.5rem',
          fontWeight: 800,
          color: '#94a3b8',
          letterSpacing: '0.15em',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          {isInput ? '— ENTRADA' : 'SALIDA —'}
        </div>
        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'white' }}>{data.label}</div>
      </div>

      <div style={{ padding: '12px', maxHeight: '500px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {data.buffers?.map((tube: any, tubeIdx: number) => (
          <div key={tubeIdx} style={{
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '10px',
            padding: '8px',
            background: 'rgba(255,255,255,0.01)'
          }}>
            <div style={{ fontSize: '0.55rem', color: '#64748b', marginBottom: '6px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              BUFFER {tube.number}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {tube.strands.map((strand: any, idx: number) => (
                <div
                  key={strand.id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    position: 'relative',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.02)'
                  }}
                >
                  <div
                    style={{
                      width: '14px',
                      height: '14px',
                      backgroundColor: FIBER_COLORS[strand.color] || strand.color,
                      borderRadius: '4px',
                      border: strand.color === 'blanco' ? '1px solid #444' : 'none',
                      flexShrink: 0,
                      boxShadow: `0 0 12px ${(FIBER_COLORS[strand.color] || strand.color)}55`
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                    <span style={{ fontSize: '0.72rem', color: '#f1f5f9', fontWeight: 600 }}>
                      #{strand.strand_number} <span style={{ opacity: 0.4, fontSize: '0.62rem', fontWeight: 400 }}>{strand.color}</span>
                    </span>
                    <IntegratedPower power={strand.optical_power_dbm} />
                  </div>
                  <Handle
                    type={isInput ? 'source' : 'target'}
                    position={isInput ? Position.Right : Position.Left}
                    id={`strand-${isInput ? 'in' : 'out'}-${data.routeId}-${(strand.strand_number || 1) - 1}`}
                    style={{
                      background: FIBER_COLORS[strand.color] || strand.color,
                      border: '2px solid rgba(255,255,255,0.8)',
                      width: '10px',
                      height: '10px',
                      top: 'auto',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Custom Node: Splitter ──
const SplitterNode = ({ data }: { data: DiagramNodeData }) => {
  const outputCount = parseInt(data.splitterType?.split('x')[1] || '8');

  return (
    <div
      style={{
        padding: '0',
        borderRadius: '20px',
        background: 'linear-gradient(165deg, rgba(88, 28, 135, 0.55), rgba(15, 23, 42, 0.98))',
        border: '1.5px solid rgba(167, 139, 250, 0.6)',
        textAlign: 'center',
        minWidth: '160px',
        backdropFilter: 'blur(30px)',
        boxShadow: '0 16px 64px rgba(0,0,0,0.7)',
        overflow: 'hidden'
      }}
    >
      <div style={{
        padding: '12px',
        background: 'rgba(167, 139, 250, 0.1)',
        borderBottom: '1px solid rgba(167, 139, 250, 0.2)',
      }}>
        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'white', letterSpacing: '0.02em' }}>{data.label}</div>
        <div style={{ fontSize: '0.62rem', color: '#a78bfa', fontWeight: 900, letterSpacing: '0.2em', marginTop: '2px' }}>
          {data.splitterType}
        </div>
      </div>

      <div style={{ padding: '14px', position: 'relative' }}>
        {/* Input Handle Wrapper */}
        <div style={{ position: 'absolute', left: '-1px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
          <div style={{ fontSize: '0.5rem', color: '#a78bfa', fontWeight: 900, transform: 'rotate(-90deg)', marginBottom: '40px', position: 'absolute', left: '12px' }}>IN</div>
          <Handle
            type="target"
            position={Position.Left}
            id="splitter-in"
            style={{
              background: '#a78bfa',
              border: '2px solid white',
              width: '14px',
              height: '14px',
              boxShadow: '0 0 10px rgba(167, 139, 250, 0.6)'
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '4px' }}>
          {Array.from({ length: outputCount }).map((_, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '8px',
                padding: '2px 10px',
                position: 'relative'
              }}
            >
              <span style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 700 }}>P{i + 1}</span>
              <IntegratedPower power={data.powers?.[i]} />
              <Handle
                type="source"
                position={Position.Right}
                id={`out-${i}`}
                style={{
                  background: '#22d3ee',
                  border: '1.5px solid white',
                  width: '10px',
                  height: '10px',
                  top: 'auto',
                  boxShadow: '0 0 8px rgba(34, 211, 238, 0.5)'
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const nodeTypes = {
  cable: CableNode,
  splitter: SplitterNode,
};

// ── Main Component ──
interface DiagramadorEmpalmesProps {
  node: {
    id: string;
    name: string;
    node_type: string;
  };
  onClose: () => void;
}

const DiagramadorEmpalmes: React.FC<DiagramadorEmpalmesProps> = ({ node, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [splitterType, setSplitterType] = useState('1x8');
  const [nodes, setNodes, onNodesChange] = useNodesState<DiagramNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<DiagramEdge>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log("Fetching diagram data for node:", node.id);
        const [rRes, sRes, spRes] = await Promise.all([
          apiFetch(`${API_BASE}/routes/?node_id=${node.id}`),
          apiFetch(`${API_BASE}/fiber/splitters?node_id=${node.id}`),
          apiFetch(`${API_BASE}/fiber/splices?node_id=${node.id}`)
        ]);

        if (!rRes.ok || !sRes.ok || !spRes.ok) throw new Error("Error al cargar datos.");

        const routesRaw = await rRes.json();
        const splittersDB = await sRes.json();
        const splicesDB = await spRes.json();

        const routes = Array.isArray(routesRaw) ? routesRaw : [];
        console.log("Total routes from API:", routes.length);
        routes.forEach(r => console.log(`Route: ${r.name} | Start: ${r.start_node_id} | End: ${r.end_node_id}`));

        // 1. Fetch strands for ALL routes in parallel
        const strandsByRoute: Record<string, any[]> = {};
        await Promise.all(routes.map(async (r: any) => {
          try {
            const stRes = await apiFetch(`${API_BASE}/fiber/strands?route_id=${r.id}`);
            if (stRes.ok) {
              const data = await stRes.json();
              strandsByRoute[r.id] = Array.isArray(data) ? data : [];
            }
          } catch (e) {
            console.error(`Error fetching strands for route ${r.id}`, e);
          }
        }));

        const prepareBuffers = (route: any) => {
          let strands = strandsByRoute[route.id] || [];
          if (strands.length === 0) {
            // Virtual strands if not in DB
            strands = Array.from({ length: route.capacity || 12 }, (_, i) => ({
              id: `virtual-${route.id}-${i + 1}`,
              strand_number: i + 1,
              buffer_number: Math.floor(i / 12) + 1,
              color: FIBER_COLOR_ORDER[i % 12]
            }));
          }
          const buffers: any[] = [];
          strands.forEach((s: any) => {
            let b = buffers.find(x => x.number === s.buffer_number);
            if (!b) { b = { number: s.buffer_number, strands: [] }; buffers.push(b); }
            b.strands.push(s);
          });
          return buffers;
        };

        const initialNodes: DiagramNode[] = [];
        const nodeIdNorm = node.id.toLowerCase();

        // 2. Input Cables (Incoming: end_node_id === node.id)
        // Heuristic: If name says "Salida" but orientation says "End", user intent might be ambiguous.
        // We favor logical orientation but keep it separate.
        const inRoutes = routes.filter((r: any) => r.end_node_id?.toLowerCase() === nodeIdNorm);
        console.log("Input routes identified:", inRoutes.length);

        inRoutes.forEach((r: any, idx: number) => {
          const buffers = prepareBuffers(r);
          // Apply powers to strands from splices
          buffers.forEach(b => b.strands.forEach((s: any) => {
            const splice = splicesDB.find((sp: any) => sp.target_id === s.id && sp.target_type === 'strand');
            if (splice) s.optical_power_dbm = splice.optical_power_dbm;
          }));

          initialNodes.push({
            id: `cable-in-${r.id}`,
            type: 'cable',
            position: { x: 50, y: 50 + (idx * 450) },
            data: { label: `${r.name}`, side: 'input', buffers: buffers, routeId: r.id }
          });
        });

        // 3. Splitters
        splittersDB.forEach((s: any, idx: number) => {
          const splitterPowers: Record<number, number> = {};
          // Find output powers for this splitter from splices
          splicesDB.filter((sp: any) => sp.source_id === s.id && sp.source_type === 'splitter_out').forEach((sp: any) => {
            if (sp.source_port !== null) splitterPowers[sp.source_port] = sp.optical_power_dbm;
          });

          initialNodes.push({
            id: s.id,
            type: 'splitter',
            position: { x: 400, y: 50 + (idx * 350) },
            data: {
              label: s.name,
              splitterType: s.splitter_type,
              configuration: s.configuration,
              powers: splitterPowers
            }
          });
        });

        // 4. Output Cables (Outgoing: start_node_id === node.id)
        const outRoutes = routes.filter((r: any) => r.start_node_id?.toLowerCase() === nodeIdNorm);
        console.log("Output routes identified:", outRoutes.length);

        outRoutes.forEach((r: any, idx: number) => {
          const buffers = prepareBuffers(r);
          // Apply powers to strands from splices
          buffers.forEach(b => b.strands.forEach((s: any) => {
            const splice = splicesDB.find((sp: any) => sp.target_id === s.id && sp.target_type === 'strand');
            if (splice) s.optical_power_dbm = splice.optical_power_dbm;
          }));

          initialNodes.push({
            id: `cable-out-${r.id}`,
            type: 'cable',
            position: { x: 750, y: 50 + (idx * 450) },
            data: { label: `${r.name}`, side: 'output', buffers: buffers, routeId: r.id }
          });
        });

        setNodes(initialNodes);

        // 5. Edges Reconstruction
        const initialEdges: DiagramEdge[] = splicesDB.map((sp: any) => {
          const m = sp.extra_metadata || {};
          let sourceId = sp.source_id;
          let targetId = sp.target_id;

          // Mapping logic for Input Cables
          if (sp.source_type === 'strand') {
            let foundInNode = initialNodes.find(n =>
              n.type === 'cable' &&
              n.data.side === 'input' &&
              n.data.buffers?.some(b => b.strands.some((s: any) => s.id === sp.source_id))
            );

            // Repair: Try to find node by routeId in handle if available
            if (!foundInNode && m.source_handle) {
              const parts = m.source_handle.split('-');
              if (parts.length >= 4) { // strand-in-UUID-idx
                const rid = parts.slice(2, -1).join('-');
                foundInNode = initialNodes.find(n => n.data.routeId === rid);
              }
              // Last resort fallback
              if (!foundInNode) foundInNode = initialNodes.find(n => n.data.side === 'input');
            }
            if (foundInNode) sourceId = foundInNode.id;
          }

          // Mapping logic for Output Cables
          if (sp.target_type === 'strand') {
            let foundOutNode = initialNodes.find(n =>
              n.type === 'cable' &&
              n.data.side === 'output' &&
              n.data.buffers?.some(b => b.strands.some((s: any) => s.id === sp.target_id))
            );

            // Repair: Try to find node by target_route_id or handle
            if (!foundOutNode && m.target_route_id) {
              foundOutNode = initialNodes.find(n => n.id === `cable-out-${m.target_route_id}`);
            }
            if (!foundOutNode && m.target_handle) {
              const parts = m.target_handle.split('-');
              if (parts.length >= 4) {
                const rid = parts.slice(2, -1).join('-');
                foundOutNode = initialNodes.find(n => n.data.routeId === rid);
              }
              if (!foundOutNode) foundOutNode = initialNodes.find(n => n.data.side === 'output');
            }

            if (foundOutNode) targetId = foundOutNode.id;
          }

          // Reparación definitiva de handles NaN
          let cleanSourceHandle = m.source_handle;
          let cleanTargetHandle = m.target_handle;
          if (cleanSourceHandle?.includes('NaN')) cleanSourceHandle = cleanSourceHandle.replace('NaN', '0');
          if (cleanTargetHandle?.includes('NaN')) cleanTargetHandle = cleanTargetHandle.replace('NaN', '0');

          const strokeColor = m.stroke || '#a78bfa';

          return {
            id: sp.id,
            source: sourceId || 'unknown-src',
            target: targetId || 'unknown-tgt',
            sourceHandle: cleanSourceHandle,
            targetHandle: cleanTargetHandle,
            animated: true,
            style: {
              stroke: strokeColor,
              strokeWidth: 3,
              filter: `drop-shadow(0 0 5px ${(strokeColor)}66)`,
            }
          };
        });

        setEdges(initialEdges.filter(e => e.source && e.target && !e.source.includes('unknown') && !e.target.includes('unknown')));

      } catch (err) {
        console.error("Critical error building diagram:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [node.id, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      const alreadyConnected = edges.some(e => e.source === params.source && e.sourceHandle === params.sourceHandle);
      if (alreadyConnected) return;

      let strokeColor = '#a78bfa';

      // Dynamic color based on source handle
      if (params.source?.toString().includes('cable-in') && params.sourceHandle) {
        const handleParts = params.sourceHandle.split('-');
        const lastPart = handleParts.pop() || '0';
        const idx = parseInt(lastPart);
        if (!isNaN(idx)) {
          strokeColor = FIBER_COLORS[FIBER_COLOR_ORDER[idx % 12]] || strokeColor;
        }
      } else if (params.source?.toString().includes('splitter')) {
        strokeColor = '#22d3ee'; // Cyan for splitter out
      }

      setEdges((eds) => addEdge({
        ...params,
        animated: true,
        style: { stroke: strokeColor, strokeWidth: 3, filter: `drop-shadow(0 0 5px ${strokeColor}66)` }
      }, eds));
    },
    [setEdges, edges]
  );

  const addSplitter = () => {
    const newId = `temp-${Date.now()}`;
    setNodes((nds) => [...nds, {
      id: newId,
      type: 'splitter',
      position: { x: 400, y: nds.filter(n => n.type === 'splitter').length * 150 + 100 },
      data: { label: `Splitter ${nds.filter(n => n.type === 'splitter').length + 1}`, splitterType: splitterType, powers: {} }
    }]);
  };

  const handleSave = async () => {
    const payload: SyncSplicesRequest = {
      splitters: nodes
        .filter(n => n.type === 'splitter')
        .map(n => ({
          diagram_id: n.id,
          splitter_type: n.data.splitterType || '1x8',
          name: n.data.label,
          configuration: n.data.configuration || {}
        })),
      splices: edges.map(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);

        // Find strands from the nodes data if it's a cable
        let realSourceId = edge.source;
        let realTargetId = edge.target;
        let targetRouteId = null;

        if (sourceNode?.type === 'cable' && edge.sourceHandle) {
          const handleParts = edge.sourceHandle.split('-');
          const lastPart = handleParts.pop() || '0';
          let strandIndex = parseInt(lastPart);
          if (isNaN(strandIndex)) strandIndex = 0; // Prevent NaN in DB

          const strands = (sourceNode.data.buffers || []).flatMap((b: any) => b.strands);
          const strand = strands[strandIndex];
          if (strand && !String(strand.id).includes('virtual')) realSourceId = strand.id;
        }

        if (targetNode?.type === 'cable' && edge.targetHandle) {
          targetRouteId = targetNode.data.routeId;
          const handleParts = edge.targetHandle.split('-');
          const lastPart = handleParts.pop() || '0';
          let strandIndex = parseInt(lastPart);
          if (isNaN(strandIndex)) strandIndex = 0; // Prevent NaN in DB

          const strands = (targetNode.data.buffers || []).flatMap((b: any) => b.strands);
          const strand = strands[strandIndex];
          if (strand && !String(strand.id).includes('virtual')) realTargetId = strand.id;
        }

        return {
          source_type: sourceNode?.type === 'splitter' ? 'splitter_out' : 'strand',
          source_id: realSourceId,
          source_port: edge.sourceHandle?.includes('out-') ? parseInt(edge.sourceHandle.split('-').pop() || '0') : null,
          target_type: targetNode?.type === 'splitter' ? 'splitter_in' : 'strand',
          target_id: realTargetId,
          target_port: null,
          extra_metadata: {
            source_handle: edge.sourceHandle,
            target_handle: edge.targetHandle,
            target_route_id: targetRouteId,
            stroke: edge.style?.stroke
          }
        };
      })
    };

    try {
      const res = await apiFetch(`${API_BASE}/nodes/${node.id}/sync-splices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("✅ Sincronización exitosa. Los empalmes han sido persistidos.");
        onClose();
      } else {
        const errData = await res.json();
        alert(`❌ Error: ${errData.detail}`);
      }
    } catch (e) {
      alert("⚠️ Error de conexión.");
    }
  };

  if (loading) return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
        <Loader2 className="animate-spin" size={48} color="#a78bfa" />
        <span style={{ color: '#a78bfa', fontWeight: 600, letterSpacing: '0.1em' }}>CARGANDO CONFIGURACIÓN...</span>
      </div>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header" style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ padding: '8px', background: 'rgba(167, 139, 250, 0.1)', borderRadius: '10px' }}>
              <Activity size={18} color="#a78bfa" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#f8fafc' }}>
                <span className="desktop-only">Diagrama de Empalmes — </span><span style={{ color: '#a78bfa' }}>{node.name}</span>
              </h2>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <X size={18} />
          </button>
        </div>

        <div className="splice-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <select className="form-input" style={{ width: '75px', padding: '4px 8px', background: '#0a0a14', fontSize: '0.7rem', fontWeight: 800 }} value={splitterType} onChange={(e) => setSplitterType(e.target.value)}>
              <option value="1x4">1x4</option>
              <option value="1x8">1x8</option>
              <option value="1x16">1x16</option>
            </select>
            <button className="secondary-btn" onClick={addSplitter} style={{ fontSize: '0.65rem', padding: '6px 12px' }}>
              <Plus size={12} /> <span className="desktop-only">Agregar Splitter</span>
            </button>
            <button className="secondary-btn desktop-only" onClick={() => setEdges([])} style={{ fontSize: '0.65rem', padding: '6px 12px' }}>
              <Trash2 size={12} /> Limpiar
            </button>
          </div>
          <div style={{ flex: 1 }} />
          <button className="primary-btn" onClick={handleSave} style={{ padding: '6px 16px', fontSize: '0.7rem', width: 'auto' }}>
            Guardar
          </button>
        </div>

        <div className="modal-body" style={{ flex: 1, position: 'relative' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.1 }}
            onInit={(instance) => setTimeout(() => instance.fitView({ padding: 0.1 }), 100)}
            style={{ background: '#050508' }}
          >
            <Controls />
            <Background variant={BackgroundVariant.Lines} gap={60} size={1} color="rgba(255,255,255,0.03)" />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
};

export default DiagramadorEmpalmes;
