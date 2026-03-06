/**
 * FTTHMap.tsx — FTTH Network Map Orchestrator
 * ─────────────────────────────────────────────
 * This component handles state and logic only.
 * All UI is delegated to /map sub-components.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../utils/apiFetch';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import type { NodeData, RouteData, DrawingTool } from './map/types';
import { NODE_CONFIG, ROUTE_CONFIG, API_BASE, MAP_TILE_URL, TILES_ATTRIBUTION } from './map/types';
import { createNodeIcon, CABLE_POINT_ICON } from './map/leafletUtils';
import MapToolbar from './map/MapToolbar';
import FloatingStats from './map/FloatingStats';
import { NodeInfoPanel, RouteInfoPanel } from './map/InfoPanels';
import { AddNodeForm, CableForm } from './map/MapForms';
import TerminationModal from './map/TerminationModal';
import { PowerBadgeInline, PowerBudgetPanel } from './map/PowerBudgetPanel';

// ── Map helpers (must live inside MapContainer) ──
function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
    const map = useMap();
    useEffect(() => { map.setView(center, zoom); }, [center, zoom, map]);
    return null;
}

function MapClickHandler({ tool, onMapClick, onCablePoint }: {
    tool: DrawingTool;
    onMapClick: (latlng: L.LatLng) => void;
    onCablePoint: (latlng: L.LatLng) => void;
}) {
    useMapEvents({
        click(e) {
            if (tool === 'draw_cable') onCablePoint(e.latlng);
            else if (['add_olt', 'add_mufla', 'add_nap', 'add_client'].includes(tool)) onMapClick(e.latlng);
        },
    });
    return null;
}

// ── Snapping constant ──
const SNAP_DISTANCE = 0.0003;

// ── Main Component ──
interface FTTHMapProps {
    center: [number, number];
    zoom: number;
    onNodeDoubleClick?: (node: NodeData) => void;
    onOpenLocationSelector?: () => void;
}

const FTTHMap: React.FC<FTTHMapProps> = ({ center, zoom, onNodeDoubleClick, onOpenLocationSelector }) => {
    // ── State ──
    const [nodes, setNodes] = useState<NodeData[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('ftth_nodes');
            return saved ? JSON.parse(saved) : [];
        }
        return [];
    });
    const [routes, setRoutes] = useState<RouteData[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('ftth_routes');
            return saved ? JSON.parse(saved) : [];
        }
        return [];
    });
    const [activeTool, setActiveTool] = useState<DrawingTool>('select');
    const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
    const [selectedRoute, setSelectedRoute] = useState<RouteData | null>(null);

    // Add node form
    const [showAddForm, setShowAddForm] = useState(false);
    const [pendingLocation, setPendingLocation] = useState<L.LatLng | null>(null);
    const [pendingNodeType, setPendingNodeType] = useState('');
    const [formName, setFormName] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formPower, setFormPower] = useState<number | undefined>(undefined);

    // Cable drawing
    const [cablePoints, setCablePoints] = useState<L.LatLng[]>([]);
    const [isDrawingCable, setIsDrawingCable] = useState(false);
    const [cableName, setCableName] = useState('');
    const [cableType, setCableType] = useState('TRONCAL');
    const [cableCapacity, setCableCapacity] = useState(12);
    const [showCableForm, setShowCableForm] = useState(false);
    const [showTerminationModal, setShowTerminationModal] = useState(false);
    const [clientForm, setClientForm] = useState({ name: '', address: '', contract: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);

    // ── Data fetching ──
    const fetchNodes = useCallback(async () => {
        try {
            console.log(`[Nodes] Fetching from ${API_BASE}/nodes...`);
            const res = await apiFetch(`${API_BASE}/nodes`);
            if (res.ok) {
                const data = await res.json();
                setNodes(data);
                localStorage.setItem('ftth_nodes', JSON.stringify(data));
            } else {
                console.warn(`[Nodes] API Error: ${res.status}`);
            }
        } catch (err) {
            console.error(`[Nodes] Connection Failed: ${err}`);
        }
    }, []);

    const fetchRoutes = useCallback(async () => {
        try {
            console.log(`[Routes] Fetching from ${API_BASE}/routes...`);
            const res = await apiFetch(`${API_BASE}/routes`);
            if (res.ok) {
                const data = await res.json();
                setRoutes(data);
                localStorage.setItem('ftth_routes', JSON.stringify(data));
            } else {
                console.warn(`[Routes] API Error: ${res.status}`);
            }
        } catch (err) {
            console.error(`[Routes] Connection Failed: ${err}`);
        }
    }, []);

    useEffect(() => { fetchNodes(); fetchRoutes(); }, [fetchNodes, fetchRoutes]);

    // Track local changes to nodes/routes to keep localStorage in sync even on optimistic updates
    useEffect(() => {
        localStorage.setItem('ftth_nodes', JSON.stringify(nodes));
    }, [nodes]);

    useEffect(() => {
        localStorage.setItem('ftth_routes', JSON.stringify(routes));
    }, [routes]);

    // ── Tool → NodeType mapping ──
    const toolToNodeType: Record<string, string> = {
        add_olt: 'OLT', add_mufla: 'MUFLA', add_nap: 'CAJA_NAP', add_client: 'CLIENTE_ONU',
    };

    // ── Map click → open add-node form ──
    const handleMapClick = (latlng: L.LatLng) => {
        const nodeType = toolToNodeType[activeTool];
        if (!nodeType) return;
        setPendingLocation(latlng);
        setPendingNodeType(nodeType);
        setFormName(''); setFormDescription(''); setFormPower(undefined);
        setShowAddForm(true);
    };

    // ── Save new node ──
    const handleSaveNode = async () => {
        if (!pendingLocation || !formName) return;
        const payload = {
            name: formName, node_type: pendingNodeType,
            description: formDescription,
            optical_power_dbm: ['MUFLA', 'CAJA_NAP'].includes(pendingNodeType) ? formPower : undefined,
            location: { lat: pendingLocation.lat, lng: pendingLocation.lng },
        };
        try {
            const res = await apiFetch(`${API_BASE}/nodes`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                const data = await res.json();
                setNodes(prev => [...prev, data]);
            } else {
                setNodes(prev => [...prev, { id: crypto.randomUUID(), ...payload } as NodeData]);
            }
        } catch {
            setNodes(prev => [...prev, { id: crypto.randomUUID(), ...payload } as NodeData]);
        }
        setShowAddForm(false); setPendingLocation(null); setActiveTool('select');
    };

    // ── Hierarchy Validation ──
    const isValidConnection = (startType: string, endType: string): boolean => {
        const rules: Record<string, string[]> = {
            'OLT': ['ODF', 'MUFLA'],
            'ODF': ['MUFLA'],
            'MUFLA': ['MUFLA', 'CAJA_NAP'],
            'CAJA_NAP': ['CLIENTE_ONU'],
            'CLIENTE_ONU': []
        };
        return rules[startType]?.includes(endType) || false;
    };

    // ── Long Press Logic ──
    const handleNodePressStart = (node: NodeData, latlng: L.LatLng) => {
        if (node.node_type === 'CLIENTE_ONU' || activeTool !== 'select') return;
        const timer = setTimeout(() => {
            setActiveTool('draw_cable');
            setCablePoints([L.latLng(node.location.lat, node.location.lng)]);
            setIsDrawingCable(true);
            if (window.navigator?.vibrate) window.navigator.vibrate(50);
        }, 500);
        setPressTimer(timer);
    };

    const handleNodePressEnd = () => {
        if (pressTimer) {
            clearTimeout(pressTimer);
            setPressTimer(null);
        }
    };

    // ── Cable drawing helpers ──
    const snapToNode = (latlng: L.LatLng): { latlng: L.LatLng; node?: NodeData } => {
        const nearest = nodes.find(n => {
            const d = Math.sqrt(Math.pow(n.location.lat - latlng.lat, 2) + Math.pow(n.location.lng - latlng.lng, 2));
            return d < SNAP_DISTANCE;
        });
        return nearest
            ? { latlng: L.latLng(nearest.location.lat, nearest.location.lng), node: nearest }
            : { latlng };
    };

    const handleCablePoint = (latlng: L.LatLng) => {
        const { latlng: snapped, node: nearest } = snapToNode(latlng);

        if (cablePoints.length === 0) {
            if (!nearest) { alert('❌ Los cables deben originarse desde un nodo existente.'); return; }
            if (nearest.node_type === 'CLIENTE_ONU') { alert('❌ No se puede extender la red desde un cliente.'); return; }
            if (routes.length === 0 && nearest.node_type !== 'OLT') { alert('⚠️ El primer cable de la red debe nacer en la OLT.'); return; }
        }

        setCablePoints(prev => [...prev, snapped]);
        if (!isDrawingCable) setIsDrawingCable(true);
    };

    const getStartNode = () => {
        if (!cablePoints.length) return null;
        const sp = cablePoints[0];
        return nodes.find(n => Math.sqrt(Math.pow(n.location.lat - sp.lat, 2) + Math.pow(n.location.lng - sp.lng, 2)) < 0.0002);
    };

    const finishCable = () => {
        if (cablePoints.length < 2) return;
        const lastPt = cablePoints[cablePoints.length - 1];
        const endNode = nodes.find(n => Math.sqrt(Math.pow(n.location.lat - lastPt.lat, 2) + Math.pow(n.location.lng - lastPt.lng, 2)) < 0.0001);

        const startNode = getStartNode();
        if (startNode && endNode) {
            if (!isValidConnection(startNode.node_type, endNode.node_type)) {
                alert(`❌ Jerarquía inválida: No se puede conectar un ${startNode.node_type} hacia un ${endNode.node_type}.`);
                return;
            }
            setShowCableForm(true);
        } else {
            setShowTerminationModal(true);
        }
    };

    const cancelCable = () => { setCablePoints([]); setIsDrawingCable(false); setShowCableForm(false); setActiveTool('select'); };

    // ── Classify cable type ──
    const classifyRoute = (startType: string, targetType: string): string => {
        if (startType === 'OLT' && targetType === 'ODF') return 'PATCHCORD';
        if (startType === 'ODF' && targetType === 'MUFLA') return 'TRONCAL';
        if (startType === 'OLT' || (startType === 'MUFLA' && targetType === 'MUFLA')) return 'TRONCAL';
        if (targetType === 'CLIENTE_ONU') return 'ACOMETIDA';
        return 'DISTRIBUCION';
    };

    // ── Continuous trace (node + cable in one shot) ──
    const handleSaveContinuousTrace = async (targetType: string) => {
        if (cablePoints.length < 2) return;
        const startNode = getStartNode();
        if (!startNode) return alert('❌ El cable debe nacer desde un nodo existente.');

        if (!isValidConnection(startNode.node_type, targetType)) {
            return alert(`❌ Jerarquía inválida: No se puede conectar un ${startNode.node_type} hacia un ${targetType}.`);
        }

        const routeType = classifyRoute(startNode.node_type, targetType);
        const nodeName = targetType === 'CLIENTE_ONU'
            ? clientForm.name
            : `${targetType.replace('_', ' ')} ${nodes.length + 1}`;
        const nodeDesc = targetType === 'CLIENTE_ONU'
            ? `Dir: ${clientForm.address} | Contrato: ${clientForm.contract}`
            : 'Auto-generado vía trazo continuo';

        const payload = {
            path: { coordinates: cablePoints.map(p => [p.lng, p.lat]) },
            start_node_id: startNode.id,
            node_data: { name: nodeName, node_type: targetType, description: nodeDesc },
            route_data: { name: `Cable a ${nodeName}`, route_type: routeType, capacity: targetType === 'CLIENTE_ONU' ? 2 : 12 },
        };

        setIsSaving(true);
        try {
            const res = await apiFetch(`${API_BASE}/continuous-trace`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                const data = await res.json();
                setNodes(prev => [...prev, data.node]);
                setRoutes(prev => [...prev, data.route]);
            } else {
                const err = await res.json().catch(() => ({ detail: 'Error desconocido' }));
                alert(`❌ Error al guardar: ${JSON.stringify(err.detail || err)}`);
            }
        } catch {
            alert('❌ Error de conexión con el servidor.');
        } finally {
            setIsSaving(false);
            setCablePoints([]); setIsDrawingCable(false);
            setShowTerminationModal(false); setShowCableForm(false);
            setClientForm({ name: '', address: '', contract: '' });
            setActiveTool('select');
        }
    };

    // ── Save existing-node-to-existing-node cable ──
    const handleSaveCable = async () => {
        if (cablePoints.length < 2 || !cableName) return;
        const sp = cablePoints[0]; const lp = cablePoints[cablePoints.length - 1];

        // Use a small tolerance instead of exact equality for floating point coordinates
        const findNodeByPos = (pos: L.LatLng) => nodes.find(n => {
            const dist = Math.sqrt(Math.pow(n.location.lat - pos.lat, 2) + Math.pow(n.location.lng - pos.lng, 2));
            return dist < 0.00005;
        });

        const startNode = findNodeByPos(sp);
        const endNode = findNodeByPos(lp);
        const payload = {
            name: cableName, route_type: cableType, capacity: cableCapacity,
            start_node_id: startNode?.id, end_node_id: endNode?.id,
            path: { coordinates: cablePoints.map(p => [p.lng, p.lat]) },
        };
        try {
            const res = await apiFetch(`${API_BASE}/routes`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                const data = await res.json();
                setRoutes(prev => [...prev, data]);
            } else {
                setRoutes(prev => [...prev, { id: crypto.randomUUID(), ...payload } as RouteData]);
            }
        } catch {
            setRoutes(prev => [...prev, { id: crypto.randomUUID(), ...payload } as RouteData]);
        }
        cancelCable(); setCableName(''); setCableType('TRONCAL'); setCableCapacity(12);
    };

    // ── Delete ──
    const handleDeleteNode = async (nodeId: string) => {
        try { await apiFetch(`${API_BASE}/nodes/${nodeId}`, { method: 'DELETE' }); } catch { }
        setNodes(prev => prev.filter(n => n.id !== nodeId));
        setRoutes(prev => prev.filter(r => r.start_node_id !== nodeId && r.end_node_id !== nodeId));
        setSelectedNode(null);
    };

    const handleDeleteRoute = async (routeId: string) => {
        try { await apiFetch(`${API_BASE}/routes/${routeId}`, { method: 'DELETE' }); } catch { }
        setRoutes(prev => prev.filter(r => r.id !== routeId));
        setSelectedRoute(null);
    };

    // ── Cursor ──
    const cursorStyle = activeTool !== 'select' && activeTool !== 'delete' ? 'crosshair'
        : activeTool === 'delete' ? 'not-allowed' : 'grab';

    // ── Render ──
    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            {/* Toolbar */}
            <MapToolbar
                activeTool={activeTool}
                setActiveTool={(t) => { setActiveTool(t); if (t === 'draw_cable') setCablePoints([]); }}
                hasOLT={nodes.some(n => n.node_type === 'OLT')}
                isDrawingCable={isDrawingCable}
                cablePointCount={cablePoints.length}
                onFinishCable={finishCable}
                onCancelCable={cancelCable}
                onOpenLocationSelector={onOpenLocationSelector}
            />

            {/* Stats */}
            <FloatingStats nodes={nodes} routes={routes} />

            {/* Node info panel */}
            {selectedNode && (
                <NodeInfoPanel
                    node={selectedNode}
                    onClose={() => setSelectedNode(null)}
                    onDelete={handleDeleteNode}
                    onInspect={(n) => onNodeDoubleClick?.(n)}
                />
            )}

            {/* Power Budget Panel — shows for MUFLA, NAP, Cliente */}
            {selectedNode && ['MUFLA', 'CAJA_NAP', 'CLIENTE_ONU'].includes(selectedNode.node_type) && (
                <PowerBudgetPanel
                    nodeId={selectedNode.id}
                    nodeName={selectedNode.name}
                    onClose={() => setSelectedNode(null)}
                />
            )}

            {/* Route info panel */}
            {selectedRoute && (
                <RouteInfoPanel
                    route={selectedRoute}
                    topOffset={selectedNode ? '490px' : '16px'}
                    onClose={() => setSelectedRoute(null)}
                    onDelete={handleDeleteRoute}
                />
            )}

            {/* Termination Modal */}
            {showTerminationModal && (
                <TerminationModal
                    startType={getStartNode()?.node_type}
                    clientForm={clientForm}
                    setClientForm={setClientForm}
                    onSelectTarget={handleSaveContinuousTrace}
                    onCancel={() => { setShowTerminationModal(false); setCablePoints([]); setIsDrawingCable(false); }}
                />
            )}

            {/* Add Node Form */}
            {showAddForm && (
                <AddNodeForm
                    pendingNodeType={pendingNodeType}
                    pendingLocation={pendingLocation}
                    formName={formName} setFormName={setFormName}
                    formDescription={formDescription} setFormDescription={setFormDescription}
                    formPower={formPower} setFormPower={setFormPower}
                    onSave={handleSaveNode}
                    onCancel={() => { setShowAddForm(false); setActiveTool('select'); }}
                />
            )}

            {/* Cable Form */}
            {showCableForm && (
                <CableForm
                    cableName={cableName} setCableName={setCableName}
                    cableType={cableType} setCableType={setCableType}
                    cableCapacity={cableCapacity} setCableCapacity={setCableCapacity}
                    cablePointCount={cablePoints.length}
                    onSave={handleSaveCable}
                    onCancel={cancelCable}
                />
            )}

            {/* Leaflet Map */}
            <MapContainer
                center={center} zoom={zoom}
                style={{ width: '100%', height: '100%', cursor: cursorStyle }}
            >
                <MapUpdater center={center} zoom={zoom} />
                <TileLayer
                    url={MAP_TILE_URL}
                    attribution={TILES_ATTRIBUTION}
                />
                <MapClickHandler tool={activeTool} onMapClick={handleMapClick} onCablePoint={handleCablePoint} />

                {/* Nodes */}
                {nodes.map(node => (
                    <Marker
                        key={node.id}
                        position={[node.location.lat, node.location.lng]}
                        icon={createNodeIcon(node.node_type)}
                        eventHandlers={{
                            mousedown: (e) => handleNodePressStart(node, e.latlng),
                            mouseup: handleNodePressEnd,
                            mouseout: handleNodePressEnd,
                            touchstart: (e) => handleNodePressStart(node, e.latlng),
                            touchend: handleNodePressEnd,
                            touchcancel: handleNodePressEnd,
                            click: () => {
                                handleNodePressEnd();
                                setSelectedNode(node);
                            },
                            dblclick: () => {
                                handleNodePressEnd();
                                if (['OLT', 'ODF', 'MUFLA', 'CAJA_NAP'].includes(node.node_type))
                                    onNodeDoubleClick?.(node);
                            },
                        }}
                    >
                        <Popup>
                            <div style={{ minWidth: '140px' }}>
                                <strong>{node.name}</strong><br />
                                <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{NODE_CONFIG[node.node_type]?.label}</span>
                                {node.optical_power_dbm !== undefined && (
                                    <div style={{ marginTop: '4px', fontWeight: 'bold', color: node.optical_power_dbm < -25 ? '#ef4444' : '#10b981' }}>
                                        Luz: {node.optical_power_dbm} dBm
                                    </div>
                                )}
                                <div style={{ marginTop: '6px' }}>
                                    <PowerBadgeInline nodeId={node.id} nodeType={node.node_type} />
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Routes */}
                {routes.map(route => {
                    const cfg = ROUTE_CONFIG[route.route_type] || ROUTE_CONFIG.TRONCAL;
                    return (
                        <Polyline
                            key={route.id}
                            positions={route.path.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number])}
                            eventHandlers={{ click: () => setSelectedRoute(route) }}
                            pathOptions={{ color: cfg.color, weight: cfg.weight, opacity: cfg.opacity, dashArray: cfg.dash }}
                        >
                            <Popup>
                                <div>
                                    <strong>{route.name}</strong><br />
                                    <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{cfg.label} — {route.capacity} hilos</span>
                                </div>
                            </Popup>
                        </Polyline>
                    );
                })}

                {/* Cable being drawn */}
                {cablePoints.length >= 2 && (
                    <Polyline
                        positions={cablePoints.map(p => [p.lat, p.lng] as [number, number])}
                        pathOptions={{ color: '#facc15', weight: 3, opacity: 0.9, dashArray: '10, 8' }}
                    />
                )}

                {/* Cable drawing vertices */}
                {cablePoints.map((p, i) => (
                    <Marker key={`cp-${i}`} position={[p.lat, p.lng]} icon={CABLE_POINT_ICON} />
                ))}
            </MapContainer>
        </div>
    );
};

export default FTTHMap;
