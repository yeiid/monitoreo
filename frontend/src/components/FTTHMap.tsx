import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '../utils/apiFetch';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import type { NodeData, RouteData, DrawingTool } from './map/types';
import { NODE_CONFIG, ROUTE_CONFIG, API_BASE, MAP_TILE_URL } from './map/types';
import { createNodeElement, toMapLibreCoord, CABLE_LAYER_STYLE } from './map/maplibreUtils';
import MapToolbar from './map/MapToolbar';
import MobileToolbar from './mobile/MobileToolbar';
import MobileHUD from './mobile/MobileHUD';
import FloatingStats from './map/FloatingStats';
import { NodeInfoPanel, RouteInfoPanel } from './map/InfoPanels';
import { AddNodeForm, CableForm } from './map/MapForms';
import TerminationModal from './map/TerminationModal';
import { PowerBudgetPanel } from './map/PowerBudgetPanel';

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
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const markers = useRef<Record<string, maplibregl.Marker>>({});

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
    const [selectedNode, setSelectedNode] = useState<NodeData|null>(null);
    const [selectedRoute, setSelectedRoute] = useState<RouteData | null>(null);

    // Forms & Modals
    const [showAddForm, setShowAddForm] = useState(false);
    const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [pendingNodeType, setPendingNodeType] = useState('');
    const [formName, setFormName] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formPower, setFormPower] = useState<number | undefined>(undefined);

    const [cablePoints, setCablePoints] = useState<[number, number][]>([]);
    const [isDrawingCable, setIsDrawingCable] = useState(false);
    const [cableName, setCableName] = useState('');
    const [cableType, setCableType] = useState('TRONCAL');
    const [cableCapacity, setCableCapacity] = useState(12);
    const [showCableForm, setShowCableForm] = useState(false);
    const [showTerminationModal, setShowTerminationModal] = useState(false);
    const [clientForm, setClientForm] = useState({ name: '', address: '', contract: '' });
    const [isSaving, setIsSaving] = useState(false);

    // ── Refs for Event Listeners (Preventing Stale Closures) ──
    const activeToolRef = useRef<DrawingTool>(activeTool);
    const nodesRef = useRef<NodeData[]>(nodes);
    const routesRef = useRef<RouteData[]>(routes);
    const cablePointsRef = useRef<[number, number][]>(cablePoints);

    useEffect(() => { activeToolRef.current = activeTool; }, [activeTool]);
    useEffect(() => { nodesRef.current = nodes; }, [nodes]);
    useEffect(() => { routesRef.current = routes; }, [routes]);
    useEffect(() => { cablePointsRef.current = cablePoints; }, [cablePoints]);

    // ── Persistent markers storage for long-press ──
    const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Initialize Map ──
    useEffect(() => {
        if (map.current || !mapContainer.current) return;

        let styleUrl = '';
        if (MAP_TILE_URL.endsWith('.json')) {
            styleUrl = MAP_TILE_URL;
        } else {
            styleUrl = `${MAP_TILE_URL.replace(/\/$/, '')}/styles/basic/style.json`;
        }

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: styleUrl,
            center: [center[1], center[0]],
            zoom: zoom,
            maxZoom: 22,
            transformRequest: (url, resourceType) => {
                let transformedUrl = url;
                if (!transformedUrl.startsWith('http://localhost') &&
                    !transformedUrl.startsWith('http://127.0.0.1') &&
                    !transformedUrl.startsWith('http://192.168.')) {
                    transformedUrl = transformedUrl.replace('http://', 'https://');
                }

                if (resourceType === 'Glyphs' && transformedUrl.includes('/fonts/')) {
                    return {
                        url: transformedUrl.replace(/^.*?\/fonts\//, 'https://demotiles.maplibre.org/font/')
                    };
                }
                return { url: transformedUrl };
            }
        });

        const m = map.current;

        m.on('load', () => {
            m.addSource('routes', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
            m.addSource('pending-cable', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });

            m.addLayer({
                id: 'routes-layer',
                type: 'line',
                source: 'routes',
                paint: {
                    'line-color': ['get', 'color'],
                    'line-width': ['get', 'weight'],
                    'line-opacity': ['get', 'opacity'],
                }
            });

            m.addLayer({
                id: 'pending-cable-layer',
                type: 'line',
                source: 'pending-cable',
                paint: {
                    'line-color': '#facc15',
                    'line-width': 3,
                    'line-dasharray': [2, 2],
                }
            });

            m.on('click', (e) => {
                const { lng, lat } = e.lngLat;
                const tool = activeToolRef.current;
                if (['add_olt', 'add_mufla', 'add_nap', 'add_client'].includes(tool)) {
                    handleMapClick(lat, lng);
                } else if (tool === 'draw_cable') {
                    handleCablePoint(lat, lng);
                }
            });

            m.on('click', 'routes-layer', (e) => {
                if (activeToolRef.current === 'select' && e.features?.[0]) {
                    const routeId = e.features[0].properties?.id;
                    const r = routesRef.current.find(rt => rt.id === routeId);
                    if (r) setSelectedRoute(r);
                }
            });
        });

        return () => m.remove();
    }, []);

    const routeGeoJSON = React.useMemo(() => ({
        type: 'FeatureCollection' as const,
        features: routes.map(r => {
            const cfg = ROUTE_CONFIG[r.route_type] || ROUTE_CONFIG.TRONCAL;
            return {
                type: 'Feature' as const,
                geometry: {
                    type: 'LineString' as const,
                    coordinates: (() => {
                        const path = r.path as any;
                        if (path.coordinates) return path.coordinates;
                        if (Array.isArray(path)) return path;
                        return [];
                    })() as [number, number][]
                },
                properties: {
                    id: r.id,
                    color: cfg.color,
                    weight: cfg.weight,
                    opacity: cfg.opacity
                }
            };
        })
    }), [routes]);

    useEffect(() => {
        if (!map.current) return;
        const source = map.current.getSource('routes') as maplibregl.GeoJSONSource;
        if (source) source.setData(routeGeoJSON);
    }, [routeGeoJSON]);

    useEffect(() => {
        if (!map.current) return;
        const m = map.current;

        nodes.forEach(node => {
            if (!markers.current[node.id]) {
                const el = createNodeElement(node.node_type, node.status as any);
                const marker = new maplibregl.Marker({ element: el })
                    .setLngLat([node.location.lng, node.location.lat])
                    .addTo(m);

                el.addEventListener('mousedown', () => handleNodePressStart(node));
                el.addEventListener('mouseup', handleNodePressEnd);
                el.addEventListener('mouseleave', handleNodePressEnd);
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const tool = activeToolRef.current;
                    if (tool === 'draw_cable') {
                        handleCablePoint(node.location.lat, node.location.lng);
                    } else if (tool === 'select') {
                        setSelectedNode(node);
                    }
                });
                el.addEventListener('dblclick', (e) => {
                    e.stopPropagation();
                    if (node.node_type !== 'CLIENTE_ONU' && activeToolRef.current === 'select') {
                        setActiveTool('draw_cable');
                        setCablePoints([[node.location.lng, node.location.lat]]);
                        setIsDrawingCable(true);
                    }
                });
                markers.current[node.id] = marker;
            } else {
                markers.current[node.id].setLngLat([node.location.lng, node.location.lat]);
            }
        });

        Object.keys(markers.current).forEach(id => {
            if (!nodes.find(n => n.id === id)) {
                markers.current[id].remove();
                delete markers.current[id];
            }
        });
    }, [nodes]);

    useEffect(() => {
        if (!map.current) return;
        const source = map.current.getSource('pending-cable') as maplibregl.GeoJSONSource;
        if (source) {
            source.setData({
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: cablePoints },
                properties: {}
            });
        }
    }, [cablePoints]);

    const fetchNodes = useCallback(async () => {
        try {
            const res = await apiFetch(`${API_BASE}/nodes`);
            if (res.ok) {
                const data = await res.json();
                setNodes(data);
                localStorage.setItem('ftth_nodes', JSON.stringify(data));
            }
        } catch (err) { console.error(`[Nodes] Failed: ${err}`); }
    }, []);

    const fetchRoutes = useCallback(async () => {
        try {
            const res = await apiFetch(`${API_BASE}/routes`);
            if (res.ok) {
                const data = await res.json();
                setRoutes(data);
                localStorage.setItem('ftth_routes', JSON.stringify(data));
            }
        } catch (err) { console.error(`[Routes] Failed: ${err}`); }
    }, []);

    useEffect(() => { fetchNodes(); fetchRoutes(); }, [fetchNodes, fetchRoutes]);

    const handleMapClick = (lat: number, lng: number) => {
        const toolToNodeType: Record<string, string> = {
            add_olt: 'OLT', add_mufla: 'MUFLA', add_nap: 'CAJA_NAP', add_client: 'CLIENTE_ONU',
        };
        const nodeType = toolToNodeType[activeToolRef.current];
        if (!nodeType) return;
        setPendingLocation({ lat, lng });
        setPendingNodeType(nodeType);
        setFormName(''); setFormDescription(''); setFormPower(undefined);
        setShowAddForm(true);
    };

    const handleSaveNode = async () => {
        if (!pendingLocation || !formName) return;
        const payload = {
            name: formName, node_type: pendingNodeType,
            description: formDescription,
            optical_power_dbm: ['MUFLA', 'CAJA_NAP'].includes(pendingNodeType) ? formPower : undefined,
            location: pendingLocation,
        };
        try {
            const res = await apiFetch(`${API_BASE}/nodes`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                const data = await res.json();
                setNodes(prev => [...prev, data]);
            }
        } catch (e) {
            console.error("Save node failed", e);
        }
        setShowAddForm(false); setPendingLocation(null); setActiveTool('select');
    };

    const handleNodePressStart = (node: NodeData) => {
        if (node.node_type === 'CLIENTE_ONU' || activeTool !== 'select') return;
        pressTimer.current = setTimeout(() => {
            setActiveTool('draw_cable');
            setCablePoints([[node.location.lng, node.location.lat]]);
            setIsDrawingCable(true);
            if (window.navigator?.vibrate) window.navigator.vibrate(50);
        }, 500);
    };

    const handleNodePressEnd = () => {
        if (pressTimer.current) {
            clearTimeout(pressTimer.current);
            pressTimer.current = null;
        }
    };

    const handleCablePoint = (lat: number, lng: number) => {
        const currentNodes = nodesRef.current;
        const currentCablePoints = cablePointsRef.current;
        const nearest = currentNodes.find(n => {
            const d = Math.sqrt(Math.pow(n.location.lat - lat, 2) + Math.pow(n.location.lng - lng, 2));
            return d < SNAP_DISTANCE;
        });
        const point: [number, number] = nearest ? [nearest.location.lng, nearest.location.lat] : [lng, lat];
        if (currentCablePoints.length === 0) {
            if (!nearest || nearest.node_type === 'CLIENTE_ONU') return;
        }
        setCablePoints(prev => [...prev, point]);
        setIsDrawingCable(true);
    };

    const finishCable = () => {
        if (cablePoints.length < 2) return;
        const [lastLng, lastLat] = cablePoints[cablePoints.length - 1];
        const endNode = nodes.find(n => Math.sqrt(Math.pow(n.location.lat - lastLat, 2) + Math.pow(n.location.lng - lastLng, 2)) < 0.0001);
        if (endNode) setShowCableForm(true);
        else setShowTerminationModal(true);
    };

    const cancelCable = () => { setCablePoints([]); setIsDrawingCable(false); setShowCableForm(false); setActiveTool('select'); };

    const handleSaveCable = async () => {
        if (cablePoints.length < 2 || !cableName) return;
        const [sLng, sLat] = cablePoints[0];
        const [eLng, eLat] = cablePoints[cablePoints.length - 1];
        const findNode = (lat: number, lng: number) => nodes.find(n => Math.sqrt(Math.pow(n.location.lat - lat, 2) + Math.pow(n.location.lng - lng, 2)) < 0.0001);
        const startNode = findNode(sLat, sLng);
        const endNode = findNode(eLat, eLng);
        const payload = {
            name: cableName, route_type: cableType, capacity: cableCapacity,
            start_node_id: startNode?.id, end_node_id: endNode?.id,
            path: { coordinates: cablePoints },
        };
        try {
            const res = await apiFetch(`${API_BASE}/routes`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                const data = await res.json();
                setRoutes(prev => [...prev, data]);
            }
        } catch (e) { }
        cancelCable();
    };

    const handleDeleteNode = async (nodeId: string) => {
        try { await apiFetch(`${API_BASE}/nodes/${nodeId}`, { method: 'DELETE' }); } catch { }
        setNodes(prev => prev.filter(n => n.id !== nodeId));
        setSelectedNode(null);
    };

    const handleDeleteRoute = async (routeId: string) => {
        try { await apiFetch(`${API_BASE}/routes/${routeId}`, { method: 'DELETE' }); } catch { }
        setRoutes(prev => prev.filter(r => r.id !== routeId));
        setSelectedRoute(null);
    };

    const handleSaveContinuousTrace = async (targetType: string) => {
        if (cablePoints.length < 2) return;
        const [sLng, sLat] = cablePoints[0];
        const startNode = nodes.find(n => Math.sqrt(Math.pow(n.location.lat - sLat, 2) + Math.pow(n.location.lng - sLng, 2)) < 0.0001);
        if (!startNode) return;
        const nodeName = targetType === 'CLIENTE_ONU' ? clientForm.name : `${targetType} ${nodes.length + 1}`;
        const payload = {
            path: { coordinates: cablePoints },
            start_node_id: startNode.id,
            node_data: { name: nodeName, node_type: targetType, description: clientForm.address },
            route_data: { name: `Cable a ${nodeName}`, route_type: 'TRONCAL', capacity: 12 },
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
            }
        } catch (e) { } finally {
            setIsSaving(false); cancelCable(); setShowTerminationModal(false);
        }
    };

    const handleAddChild = (parent: NodeData, childType: string) => {
        setActiveTool('draw_cable');
        setCablePoints([[parent.location.lng, parent.location.lat]]);
        setIsDrawingCable(true);
        setSelectedNode(null);
    };
    // ── Map Navigation Helpers ──
    const handleCenterOnNode = useCallback((n: NodeData) => {
        if (!map.current) return;
        map.current.flyTo({
            center: [n.location.lng, n.location.lat],
            zoom: 18,
            speed: 1.5,
            curve: 1
        });
    }, []);

    const handleCenterOnRoute = useCallback((r: RouteData) => {
        if (!map.current || !r.path.coordinates.length) return;
        // Simple center on first point for now, or calculate bounds
        const [lng, lat] = r.path.coordinates[0];
        map.current.flyTo({
            center: [lng, lat],
            zoom: 16,
            speed: 1.2
        });
    }, []);

    // Effect to handle navigation from other pages (via localStorage)
    useEffect(() => {
        const pending = localStorage.getItem('ftth_center_on_node');
        if (pending && map.current) {
            const data = JSON.parse(pending);
            map.current.flyTo({
                center: [data.lng, data.lat],
                zoom: 18
            });
            localStorage.removeItem('ftth_center_on_node');
            // Optionally auto-select it
            const node = nodes.find(n => n.id === data.id);
            if (node) setSelectedNode(node);
        }
    }, [nodes]);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            {/* 1. Map container FIRST (baseline) */}
            <div
                ref={mapContainer}
                className="map-container"
                style={{ width: '100%', height: '100%', background: '#1a1a1a', zIndex: 1 }}
            />

            <MobileHUD nodeName={selectedNode?.name || 'PLANTA EXTERNA'} />

            <MapToolbar
                activeTool={activeTool}
                setActiveTool={(t) => { setActiveTool(t); setSelectedNode(null); setSelectedRoute(null); if (t === 'draw_cable') setCablePoints([]); }}
                hasOLT={nodes.some(n => n.node_type === 'OLT')}
                isDrawingCable={isDrawingCable}
                cablePointCount={cablePoints.length}
                onFinishCable={finishCable}
                onCancelCable={cancelCable}
                onOpenLocationSelector={onOpenLocationSelector}
            />

            <MobileToolbar 
                onAddOLT={() => { setActiveTool('add_olt'); setPendingNodeType('OLT'); }}
                isDrawing={activeTool === 'draw_cable'}
                onToggleDrawing={() => setActiveTool(activeTool === 'draw_cable' ? 'select' : 'draw_cable')}
                onOpenSearch={() => {}}
                onToggleLayers={() => {}}
            />

            <FloatingStats nodes={nodes} routes={routes} />

            {selectedNode && activeTool !== 'draw_cable' && (
                <NodeInfoPanel
                    node={selectedNode}
                    onClose={() => setSelectedNode(null)}
                    onDelete={handleDeleteNode}
                    onCenter={handleCenterOnNode}
                    onInspect={(n) => {
                        onNodeDoubleClick?.(n);
                        setSelectedNode(null); // Clear local selection to show modal cleanly
                    }}
                    onAddChild={handleAddChild}
                />
            )}

            {selectedNode && activeTool !== 'draw_cable' && ['MUFLA', 'CAJA_NAP', 'CLIENTE_ONU'].includes(selectedNode.node_type) && (
                <PowerBudgetPanel nodeId={selectedNode.id} nodeName={selectedNode.name} onClose={() => setSelectedNode(null)} />
            )}

            {selectedRoute && activeTool !== 'draw_cable' && (
                <RouteInfoPanel 
                    route={selectedRoute} 
                    topOffset={selectedNode ? '490px' : '16px'} 
                    onClose={() => setSelectedRoute(null)} 
                    onDelete={handleDeleteRoute} 
                    onCenter={handleCenterOnRoute}
                />
            )}

            {showTerminationModal && (
                <TerminationModal
                    startType={nodes.find(n => Math.sqrt(Math.pow(n.location.lat - cablePoints[0][1], 2) + Math.pow(n.location.lng - cablePoints[0][0], 2)) < 0.0001)?.node_type}
                    clientForm={clientForm}
                    setClientForm={setClientForm}
                    onSelectTarget={handleSaveContinuousTrace}
                    onCancel={() => { setShowTerminationModal(false); cancelCable(); }}
                />
            )}

            {showAddForm && (
                <AddNodeForm
                    pendingNodeType={pendingNodeType} pendingLocation={pendingLocation!}
                    formName={formName} setFormName={setFormName} formDescription={formDescription} setFormDescription={setFormDescription}
                    formPower={formPower} setFormPower={setFormPower} onSave={handleSaveNode} onCancel={() => { setShowAddForm(false); setActiveTool('select'); }}
                />
            )}

            {showCableForm && (
                <CableForm
                    cableName={cableName} setCableName={setCableName} cableType={cableType} setCableType={setCableType}
                    cableCapacity={cableCapacity} setCableCapacity={setCableCapacity} cablePointCount={cablePoints.length}
                    onSave={handleSaveCable} onCancel={cancelCable}
                />
            )}
        </div>
    );
};

export default FTTHMap;
