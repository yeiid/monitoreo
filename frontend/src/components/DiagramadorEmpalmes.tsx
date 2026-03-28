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
  BackgroundVariant,
  type Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Loader2, Activity, X } from 'lucide-react';

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

const nodeTypes = {
  cable: CableNode,
  splitter: SplitterNode,
};

const DiagramadorEmpalmes: React.FC<DiagramadorEmpalmesProps> = ({ node, onClose }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [loading, setLoading] = useState(true);
  const [splitterType, setSplitterType] = useState('1x8');
  const [isSaving, setIsSaving] = useState(false);

  // ── Fetch Data ──
  useEffect(() => {
    const fetchData = async () => {
      if (!node) return;
      setLoading(true);
      try {
        console.log("Fetching diagram data for node:", node.id);
        const [routesRes, splicesRes] = await Promise.all([
          apiFetch(`${API_BASE}/routes/?node_id=${node.id}`),
          apiFetch(`${API_BASE}/nodes/${node.id}/splices`)
        ]);

        if (routesRes.ok && splicesRes.ok) {
          const routesData = await routesRes.json();
          const splicesData = await splicesRes.json();

          // Transform Routes to Nodes
          const newNodes: any[] = [];
          
          // Determine hierarchical default for this node
          const hierarchyDefault = node.node_type === 'CLIENTE_ONU' ? 4 : 16;

          // Manually fetch strands for each route because /routes doesn't include them
          for (let idx = 0; idx < routesData.length; idx++) {
            const route = routesData[idx];
            const isInput = route.end_node_id === node.id;
            
            // Fetch strands
            let buffers: any[] = [];
            try {
              const strandsRes = await apiFetch(`${API_BASE}/fiber/strands?route_id=${route.id}`);
              if (strandsRes.ok) {
                let strandsList = await strandsRes.json();
                
                // Fallback: If no strands exist (legacy route), ask backend to generate them
                // We also override 12 (old default) if we are in a 16-fiber environment
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

                // Group strands into buffers (typically 6 or 12 per buffer)
                // For simplicity assuming 12 strands per buffer tube (standard TIA-598)
                const tubes: Record<number, any> = {};
                strandsList.forEach((st: any) => {
                  const tubeIdx = Math.floor((st.index - 1) / 12) + 1;
                  if (!tubes[tubeIdx]) tubes[tubeIdx] = { tube_number: tubeIdx, color: FIBER_COLORS[FIBER_COLOR_ORDER[(tubeIdx-1)%12]], strands: [] };
                  tubes[tubeIdx].strands.push(st);
                });
                buffers = Object.values(tubes);
              }
            } catch (e) {
              console.error("Failed to fetch strands for route", route.id, e);
            }

            newNodes.push({
              id: route.id,
              type: 'cable',
              position: { x: isInput ? 50 : 850, y: idx * 250 + 50 },
              data: { 
                label: route.name, 
                side: isInput ? 'input' : 'output', 
                buffers: buffers,
                routeId: route.id,
                powers: {} // Will be populated by backend if needed
              }
            });
          }

          // Add Splitters from backend if any
          const splitterNodes: any[] = [];
          (splicesData.splitters || []).forEach((s: any, idx: number) => {
            splitterNodes.push({
              id: s.diagram_id || `splitter-${s.id}`,
              type: 'splitter',
              position: s.position || { x: 450, y: idx * 200 + 100 },
              data: { label: s.name, splitterType: s.splitter_type, powers: s.powers || {} }
            });
          });

          setNodes([...newNodes, ...splitterNodes]);

          // Transform Splices to Edges
          const newEdges = (splicesData.splices || []).map((s: any, idx: number) => ({
            id: `e-${idx}`,
            source: s.source_diagram_id || s.source_id,
            target: s.target_diagram_id || s.target_id,
            sourceHandle: s.source_handle,
            targetHandle: s.target_handle,
            animated: true,
            style: { 
              stroke: s.extra_metadata?.stroke || '#a78bfa', 
              strokeWidth: 3,
              filter: `drop-shadow(0 0 5px ${s.extra_metadata?.stroke || '#a78bfa'}66)`
            }
          }));
          setEdges(newEdges);
        }
      } catch (err) {
        console.error("Failed to fetch diagram data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [node, setNodes, setEdges]);

  // ── Actions ──
  const onConnect = useCallback(
    (params: Connection) => {
      let strokeColor = '#a78bfa';

      // Advanced Color Extraction: Search in nodes for the source strand's color
      const sourceNode = nodes.find(n => n.id === params.source);
      if (sourceNode?.type === 'cable' && params.sourceHandle) {
         // Flatten buffers to find the strand
         const allStrands = (sourceNode.data as any).buffers?.flatMap((b: any) => b.strands) || [];
         const strand = allStrands.find((s: any) => s.id === params.sourceHandle);
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

  const addSplitter = () => {
    const type = prompt("Tipo de Splitter (1x4, 1x8, 1x16):", "1x16");
    if (!type) return;

    const newId = `temp-${Date.now()}`;
    setNodes((nds) => [...nds, {
      id: newId,
      type: 'splitter',
      position: { x: 400, y: nds.filter(n => n.type === 'splitter').length * 150 + 100 },
      data: { label: `Splitter ${nds.filter(n => n.type === 'splitter').length + 1}`, splitterType: type, powers: {} }
    }]);
  };

  const handleSave = async () => {
    if (!node) return;
    setIsSaving(true);
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

        return {
          source_type: sourceNode?.type === 'splitter' ? 'splitter_out' : 'strand',
          source_id: edge.source,
          source_port: edge.sourceHandle?.includes('out-') ? parseInt(edge.sourceHandle.split('-').pop() || '0') : null,
          target_type: targetNode?.type === 'splitter' ? 'splitter_in' : 'strand',
          target_id: edge.target,
          target_port: null,
          extra_metadata: {
            source_handle: edge.sourceHandle,
            target_handle: edge.targetHandle,
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
        alert("✅ Sincronización exitosa.");
        onClose();
      } else {
        const errData = await res.json();
        alert(`❌ Error: ${errData.detail}`);
      }
    } catch (e) {
      alert("⚠️ Error de conexión.");
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

        <DiagramControls 
          splitterType={splitterType}
          setSplitterType={setSplitterType}
          onAddSplitter={addSplitter}
          onClearEdges={() => setEdges([])}
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
