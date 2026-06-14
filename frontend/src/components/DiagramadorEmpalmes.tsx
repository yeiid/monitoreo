import React, { useCallback, useState, useEffect, useRef } from 'react';
import { apiFetch } from '../utils/apiFetch';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  type Connection,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Loader2, Activity, X, AlertTriangle } from 'lucide-react';

import {
  FIBER_COLORS,
  FIBER_COLOR_ORDER,
  API_BASE,
  type SyncSplicesRequest,
} from './map/types';

// ── Sub-components & Utils ──
import CableNode from './diagram/CableNode';
import SplitterNode from './diagram/SplitterNode';
import DiagramControls from './diagram/DiagramControls';
import { getPowerColor } from './diagram/DiagramUtils';

// ── Types ──
interface DiagramadorEmpalmesProps {
  node: {
    id: string;
    name: string;
    node_type: string;
  } | null;
  onClose: () => void;
}

interface CableNodeData {
  label: string;
  side: 'input' | 'output';
  buffers: TubeData[];
  routeId: string;
  powers: Record<string, number>;
}

interface TubeData {
  tube_number: number;
  color: string;
  strands: StrandData[];
}

interface StrandData {
  id: string;
  index: number;
  color: string;
  buffer_number: number;
  optical_power_dbm?: number | null;
}

interface SplitterNodeData {
  label: string;
  splitterType: string;
  powers: Record<number, number>;
}

const nodeTypes = {
  cable: CableNode,
  splitter: SplitterNode,
};

const DiagramadorEmpalmes: React.FC<DiagramadorEmpalmesProps> = ({ node, onClose }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<CableNodeData | SplitterNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [splitterType, setSplitterType] = useState('1x8');
  const [isSaving, setIsSaving] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // ── Fetch Data with AbortController ──
  useEffect(() => {
    if (!node) return;

    // Cancel any in-flight request from previous node
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [routesRes, splicesRes] = await Promise.all([
          apiFetch(`${API_BASE}/routes?node_id=${node.id}`),
          apiFetch(`${API_BASE}/nodes/${node.id}/splices`)
        ]);

        if (controller.signal.aborted) return;

        if (!routesRes.ok || !splicesRes.ok) {
          setError('Error al cargar la configuración del nodo.');
          setLoading(false);
          return;
        }

        const routesData = await routesRes.json();
        const splicesData = await splicesRes.json();

        const hierarchyDefault = node.node_type === 'CLIENTE_ONU' ? 4 : 16;

        // Fetch ALL strands in parallel (fix N+1 query)
        const strandResults = await Promise.all(
          routesData.map(async (route: any) => {
            try {
              let strandsList: StrandData[] = [];
              const strandsRes = await apiFetch(`${API_BASE}/fiber/strands?route_id=${route.id}`);
              if (strandsRes.ok) {
                strandsList = await strandsRes.json();
              }

              // Auto-generate if empty or mismatched capacity
              if (strandsList.length === 0 || (strandsList.length === 12 && hierarchyDefault === 16)) {
                const genRes = await apiFetch(`${API_BASE}/fiber/strands/generate`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ route_id: route.id, capacity: hierarchyDefault })
                });
                if (genRes.ok) {
                  strandsList = await genRes.json();
                }
              }

              return { route, strands: strandsList };
            } catch (e) {
              console.error("Failed to fetch strands for route", route.id, e);
              return { route, strands: [] };
            }
          })
        );

        if (controller.signal.aborted) return;

        // Build cable nodes from routes + strands
        const newNodes: Node<CableNodeData>[] = strandResults.map(({ route, strands }, idx) => {
          const isInput = route.end_node_id === node.id;

          // Group strands by buffer_number (matches backend: 6 strands/tube)
          const tubes: Record<number, TubeData> = {};
          strands.forEach((st) => {
            const tubeIdx = st.buffer_number || 1;
            if (!tubes[tubeIdx]) {
              tubes[tubeIdx] = {
                tube_number: tubeIdx,
                color: FIBER_COLORS[FIBER_COLOR_ORDER[(tubeIdx - 1) % 12]] || '#666',
                strands: []
              };
            }
            tubes[tubeIdx].strands.push(st);
          });

          return {
            id: route.id,
            type: 'cable',
            position: { x: isInput ? 50 : 850, y: idx * 250 + 50 },
            data: {
              label: route.name,
              side: isInput ? 'input' : 'output',
              buffers: Object.values(tubes),
              routeId: route.id,
              powers: {}
            }
          };
        });

        // Build splitter nodes
        const splitterNodes: Node<SplitterNodeData>[] = (splicesData.splitters || []).map((s: any, idx: number) => ({
          id: s.diagram_id || `splitter-${s.id}`,
          type: 'splitter',
          position: s.position || { x: 450, y: idx * 200 + 100 },
          data: { label: s.name, splitterType: s.splitter_type, powers: s.powers || {} }
        }));

        setNodes([...newNodes, ...splitterNodes]);

        // Build reverse maps for edge reconstruction
        // strandUUID → routeUUID (to find which ReactFlow node contains a strand)
        const strandToRoute: Record<string, string> = {};
        strandResults.forEach(({ route, strands }) => {
          strands.forEach(s => { strandToRoute[s.id] = route.id; });
        });

        // splitterDBuuid → diagram_id (to find ReactFlow node ID for a splitter)
        const splitterDbToDiagram: Record<string, string> = {};
        (splicesData.splitters || []).forEach((s: any) => {
          if (s.diagram_id) splitterDbToDiagram[s.id] = s.diagram_id;
        });

        // Build edges from splices (deterministic IDs)
        const newEdges: Edge[] = (splicesData.splices || []).map((s: any) => {
          // Determine ReactFlow source node ID
          let sourceNodeId: string;
          if (s.source_type === 'strand') {
            sourceNodeId = strandToRoute[s.source_id] || s.source_id;
          } else {
            // splitter_in or splitter_out: resolve DB UUID → diagram_id
            sourceNodeId = splitterDbToDiagram[s.source_id] || `splitter-${s.source_id}`;
          }

          // Determine ReactFlow target node ID
          let targetNodeId: string;
          if (s.target_type === 'strand') {
            targetNodeId = strandToRoute[s.target_id] || s.target_id;
          } else {
            targetNodeId = splitterDbToDiagram[s.target_id] || `splitter-${s.target_id}`;
          }

          return {
            id: `splice-${s.source_id}-${s.source_port}-${s.target_id}-${s.target_port}`,
            source: sourceNodeId,
            target: targetNodeId,
            sourceHandle: s.extra_metadata?.source_handle || s.source_id,
            targetHandle: s.extra_metadata?.target_handle || s.target_id,
            animated: true,
            style: {
              stroke: s.extra_metadata?.stroke || '#a78bfa',
              strokeWidth: 3,
              filter: `drop-shadow(0 0 5px ${s.extra_metadata?.stroke || '#a78bfa'}66)`
            }
          };
        });
        setEdges(newEdges);

      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Failed to fetch diagram data", err);
          setError('No se pudo conectar al servidor. Verifica que la API esté disponible.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      controller.abort();
    };
  }, [node?.id, setNodes, setEdges]);

  // ── Connection Handler ──
  const onConnect = useCallback(
    (params: Connection) => {
      let strokeColor = '#a78bfa';

      const sourceNode = nodes.find(n => n.id === params.source);
      if (sourceNode?.type === 'cable' && params.sourceHandle) {
        const allStrands = (sourceNode.data as CableNodeData).buffers?.flatMap(b => b.strands) || [];
        const strand = allStrands.find(s => s.id === params.sourceHandle);
        if (strand) {
          strokeColor = FIBER_COLORS[strand.color] || strokeColor;
        }
      } else if (params.source?.toString().includes('splitter')) {
        strokeColor = '#22d3ee';
      }

      setEdges((eds) => addEdge({
        ...params,
        animated: true,
        style: {
          stroke: strokeColor,
          strokeWidth: 3,
          filter: `drop-shadow(0 0 5px ${strokeColor}66)`
        }
      } as any, eds));
    },
    [nodes, setEdges]
  );

  // ── Add Splitter (uses dropdown type, no prompt) ──
  const addSplitter = useCallback(() => {
    const newId = `temp-${Date.now()}`;
    const splitterCount = nodes.filter(n => n.type === 'splitter').length;

    setNodes((nds) => [...nds, {
      id: newId,
      type: 'splitter',
      position: { x: 400, y: splitterCount * 150 + 100 },
      data: {
        label: `Splitter ${splitterCount + 1}`,
        splitterType: splitterType,
        powers: {}
      }
    }]);
  }, [nodes, splitterType, setNodes]);

  // ── Clear Edges with confirmation ──
  const handleClearEdges = useCallback(() => {
    if (edges.length === 0) return;
    if (window.confirm(`¿Eliminar las ${edges.length} conexiones?`)) {
      setEdges([]);
    }
  }, [edges.length, setEdges]);

  // ── Save ──
  const handleSave = async () => {
    if (!node) return;
    setIsSaving(true);
    setError(null);

    const payload: SyncSplicesRequest = {
      splitters: nodes
        .filter(n => n.type === 'splitter')
        .map(n => ({
          diagram_id: n.id,
          splitter_type: (n.data as SplitterNodeData).splitterType || '1x8',
          name: (n.data as SplitterNodeData).label,
          configuration: {}
        })),
      splices: edges.map(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        const isSourceSplitter = sourceNode?.type === 'splitter';
        const isTargetSplitter = targetNode?.type === 'splitter';

        return {
          source_type: isSourceSplitter ? 'splitter_out' : 'strand',
          // For strands: use handle ID (strand UUID). For splitters: use diagram_id (resolved by backend)
          source_id: (isSourceSplitter ? edge.source : edge.sourceHandle) ?? null,
          source_port: isSourceSplitter && edge.sourceHandle?.startsWith('out-')
            ? parseInt(edge.sourceHandle.split('-')[1])
            : null,
          target_type: isTargetSplitter ? 'splitter_in' : 'strand',
          // For strands: use handle ID (strand UUID). For splitters: use diagram_id (resolved by backend)
          target_id: (isTargetSplitter ? edge.target : edge.targetHandle) ?? null,
          target_port: null,
          extra_metadata: {
            source_handle: edge.sourceHandle ?? null,
            target_handle: edge.targetHandle ?? null,
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
        onClose();
      } else {
        const errData = await res.json();
        setError(`Error al guardar: ${errData.detail}`);
      }
    } catch (e) {
      setError('Error de conexión al guardar.');
    } finally {
      setIsSaving(false);
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

  if (!node) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: '1200px', width: '95%', height: '85vh', minHeight: '600px' }}>
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
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 20px', margin: '0 24px', marginTop: '12px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '10px', color: '#fca5a5', fontSize: '0.8rem'
          }}>
            <AlertTriangle size={16} />
            <span>{error}</span>
            <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }}>
              <X size={14} />
            </button>
          </div>
        )}

        <DiagramControls
          splitterType={splitterType}
          setSplitterType={setSplitterType}
          onAddSplitter={addSplitter}
          onClearEdges={handleClearEdges}
          onSave={handleSave}
          isSaving={isSaving}
        />

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
