import React, { useState, useEffect, useCallback, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import type { NodeData, RouteData, DrawingTool } from './map/types';
import { API_BASE } from './map/types';
import MapToolbar from './map/MapToolbar';
import MobileToolbar from './mobile/MobileToolbar';
import FloatingStats from './map/FloatingStats';
import { NodeInfoPanel, RouteInfoPanel } from './map/InfoPanels';
import { AddNodeForm, CableForm } from './map/MapForms';
import TerminationModal from './map/TerminationModal';

// Hooks
import { useFTTHData } from './map/hooks/useFTTHData';
import { useMapInstance } from './map/hooks/useMapInstance';
import { useMapLayers } from './map/hooks/useMapLayers';
import { useMapMarkers } from './map/hooks/useMapMarkers';
import { useMapInteraction } from './map/hooks/useMapInteraction';
import { useDrawingTools } from './map/hooks/useDrawingTools';
import { useMapActions } from './map/hooks/useMapActions';

const SNAP_DISTANCE = 0.0003;

interface FTTHMapProps {
    center: [number, number];
    zoom: number;
    onNodeDoubleClick?: (node: NodeData) => void;
    onOpenLocationSelector?: () => void;
}

const FTTHMap: React.FC<FTTHMapProps> = ({ center, zoom, onNodeDoubleClick, onOpenLocationSelector }) => {
    // 1. Data Hook
    const { nodes, setNodes, routes, setRoutes, deleteNode, deleteRoute } = useFTTHData();
    const nodesRef = useRef<NodeData[]>(nodes);
    const routesRef = useRef<RouteData[]>(routes);
    useEffect(() => { nodesRef.current = nodes; }, [nodes]);
    useEffect(() => { routesRef.current = routes; }, [routes]);

    // 2. Map Instance Hook
    const { mapContainer, map, flyToNode, flyToRoute } = useMapInstance({ center, zoom });

    // 3. Drawing Tools Hook
    const dt = useDrawingTools();

    // 4. Map Actions Hook (API)
    const { saveNode, saveCable, saveContinuousTrace } = useMapActions({ setNodes, setRoutes });

    // 5. Local UI State
    const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
    const [selectedRoute, setSelectedRoute] = useState<RouteData | null>(null);
    const [formName, setFormName] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formPower, setFormPower] = useState<number | undefined>(undefined);
    const [cableName, setCableName] = useState('');
    const [cableType, setCableType] = useState('TRONCAL');
    const [cableCapacity, setCableCapacity] = useState(12);
    const [clientForm, setClientForm] = useState({ name: '', address: '', contract: '' });
    const [isSaving, setIsSaving] = useState(false);

    // GPS Location State
    const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [isLocating, setIsLocating] = useState(false);
    const gpsMarkerRef = useRef<maplibregl.Marker | null>(null);

    // 6. Map Layers Hook
    useMapLayers(map, routes, dt.cablePoints);

    // 7. GPS Location Handlers
    const handleLocateMe = useCallback(() => {
        if (!navigator.geolocation) {
            alert('Tu navegador no soporta geolocalización.');
            return;
        }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const loc = { lat: latitude, lng: longitude };
                setGpsLocation(loc);
                setIsLocating(false);
                map.current?.flyTo({ center: [longitude, latitude], zoom: 17, speed: 1.5 });

                // Create or update GPS marker
                if (gpsMarkerRef.current) {
                    gpsMarkerRef.current.setLngLat([longitude, latitude]);
                } else if (map.current) {
                    const el = document.createElement('div');
                    el.className = 'gps-marker';
                    el.innerHTML = '<div class="gps-marker-pulse"></div><div class="gps-marker-dot"></div>';
                    gpsMarkerRef.current = new maplibregl.Marker({ element: el })
                        .setLngLat([longitude, latitude])
                        .addTo(map.current);
                }
            },
            (error) => {
                setIsLocating(false);
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        alert('Permiso de ubicación denegado. Activa la ubicación en tu navegador.');
                        break;
                    case error.POSITION_UNAVAILABLE:
                        alert('Ubicación no disponible. Verifica tu conexión GPS.');
                        break;
                    case error.TIMEOUT:
                        alert('Tiempo de espera agotado. Intenta de nuevo.');
                        break;
                    default:
                        alert('Error al obtener tu ubicación.');
                }
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }, [map]);

    const handleStartCableFromGPS = useCallback(() => {
        if (!gpsLocation) return;
        dt.startCableAt(gpsLocation.lng, gpsLocation.lat);
    }, [gpsLocation, dt]);

    // ── Interaction Logic ──
    const handleMapClick = (lat: number, lng: number) => {
        const toolToNodeType: Record<string, string> = {
            add_olt: 'OLT', add_mufla: 'MUFLA', add_nap: 'CAJA_NAP', add_client: 'CLIENTE_ONU',
        };
        const nodeType = toolToNodeType[dt.activeToolRef.current];
        if (!nodeType) return;
        dt.setPendingLocation({ lat, lng });
        dt.setPendingNodeType(nodeType);
        setFormName(''); setFormDescription(''); setFormPower(undefined);
        dt.setShowAddForm(true);
    };

    const handleCablePoint = (lat: number, lng: number) => {
        const currentNodes = nodesRef.current;
        const currentCablePoints = dt.cablePointsRef.current;
        const nearest = currentNodes.find(n => {
            const d = Math.sqrt(Math.pow(n.location.lat - lat, 2) + Math.pow(n.location.lng - lng, 2));
            return d < SNAP_DISTANCE;
        });
        const point: [number, number] = nearest ? [nearest.location.lng, nearest.location.lat] : [lng, lat];

        // First click validation: only when cable has no points yet
        // (when started from GPS or node double-click, points already exist)
        if (currentCablePoints.length === 0) {
            // Allow starting from GPS location (no nearest node required)
            const isGPSStart = gpsLocation &&
                Math.sqrt(Math.pow(gpsLocation.lat - lat, 2) + Math.pow(gpsLocation.lng - lng, 2)) < SNAP_DISTANCE;
            if (!isGPSStart && (!nearest || nearest.node_type === 'CLIENTE_ONU')) return;
        }

        dt.setCablePoints(prev => [...prev, point]);
        dt.setIsDrawingCable(true);
    };

    // 7. Interaction Hook
    useMapInteraction({
        map,
        activeToolRef: dt.activeToolRef,
        routesRef,
        handleMapClick,
        handleCablePoint,
        setSelectedRoute
    });

    // 8. Markers Hook
    const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    useMapMarkers({
        map,
        nodes,
        activeToolRef: dt.activeToolRef,
        onNodeClick: (node) => {
            if (dt.activeToolRef.current === 'draw_cable') {
                handleCablePoint(node.location.lat, node.location.lng);
            } else if (dt.activeToolRef.current === 'select') {
                setSelectedNode(node);
            }
        },
        onNodeDoubleClick: (node) => {
            if (node.node_type !== 'CLIENTE_ONU' && dt.activeToolRef.current === 'select') {
                dt.startCableAt(node.location.lng, node.location.lat);
            }
        },
        onNodePressStart: (node) => {
            if (node.node_type === 'CLIENTE_ONU' || dt.activeTool !== 'select') return;
            pressTimer.current = setTimeout(() => {
                dt.startCableAt(node.location.lng, node.location.lat);
                if (window.navigator?.vibrate) window.navigator.vibrate(50);
            }, 500);
        },
        onNodePressEnd: () => {
            if (pressTimer.current) {
                clearTimeout(pressTimer.current);
                pressTimer.current = null;
            }
        }
    });

    // ── UI Actions ──
    const handleSaveNodeAction = async () => {
        if (!dt.pendingLocation || !formName) return;
        const payload = {
            name: formName, node_type: dt.pendingNodeType,
            description: formDescription,
            optical_power_dbm: ['MUFLA', 'CAJA_NAP'].includes(dt.pendingNodeType) ? formPower : undefined,
            location: dt.pendingLocation,
        };
        await saveNode(payload);
        dt.setShowAddForm(false); dt.setPendingLocation(null); dt.setActiveTool('select');
    };

    const handleSaveCableAction = async () => {
        if (dt.cablePoints.length < 2 || !cableName) return;
        const [sLng, sLat] = dt.cablePoints[0];
        const [eLng, eLat] = dt.cablePoints[dt.cablePoints.length - 1];
        const findNode = (lat: number, lng: number) => nodes.find(n => Math.sqrt(Math.pow(n.location.lat - lat, 2) + Math.pow(n.location.lng - lng, 2)) < 0.0001);
        const startNode = findNode(sLat, sLng);
        const endNode = findNode(eLat, eLng);
        const payload = {
            name: cableName, route_type: cableType, capacity: cableCapacity,
            start_node_id: startNode?.id, end_node_id: endNode?.id,
            path: { coordinates: dt.cablePoints },
        };
        await saveCable(payload);
        dt.resetDrawing();
    };

    const handleSaveContinuousTraceAction = async (targetType: string) => {
        if (dt.cablePoints.length < 2) return;
        const [sLng, sLat] = dt.cablePoints[0];
        const startNode = nodes.find(n => Math.sqrt(Math.pow(n.location.lat - sLat, 2) + Math.pow(n.location.lng - sLng, 2)) < 0.0001);
        if (!startNode) return;
        const nodeName = targetType === 'CLIENTE_ONU' ? clientForm.name : `${targetType} ${nodes.length + 1}`;
        const payload = {
            path: { coordinates: dt.cablePoints },
            start_node_id: startNode.id,
            node_data: { name: nodeName, node_type: targetType, description: clientForm.address },
            route_data: { 
                name: `Cable a ${nodeName}`, 
                route_type: targetType === 'CLIENTE_ONU' ? 'ACOMETIDA' : 'DISTRIBUCION', 
                capacity: targetType === 'CLIENTE_ONU' ? 4 : 16 
            },
        };
        setIsSaving(true);
        await saveContinuousTrace(payload);
        setIsSaving(false); dt.resetDrawing(); dt.setShowTerminationModal(false);
    };

    const finishCable = () => {
        if (dt.cablePoints.length < 2) return;
        const [lastLng, lastLat] = dt.cablePoints[dt.cablePoints.length - 1];
        const endNode = nodes.find(n => Math.sqrt(Math.pow(n.location.lat - lastLat, 2) + Math.pow(n.location.lng - lastLng, 2)) < 0.0001);
        if (endNode) {
            setCableCapacity(endNode.node_type === 'CLIENTE_ONU' ? 4 : 16);
            dt.setShowCableForm(true);
        } else {
            dt.setShowTerminationModal(true);
        }
    };

    // Effects for navigation from other pages
    useEffect(() => {
        const pending = localStorage.getItem('ftth_center_on_node');
        if (pending && map.current) {
            const data = JSON.parse(pending);
            map.current.flyTo({ center: [data.lng, data.lat], zoom: 18 });
            localStorage.removeItem('ftth_center_on_node');
            const node = nodes.find(n => n.id === data.id);
            if (node) setSelectedNode(node);
        }
    }, [nodes, map]);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <div ref={mapContainer} className="map-container" style={{ width: '100%', height: '100%', background: '#1a1a1a', zIndex: 1 }} />

            <MapToolbar
                activeTool={dt.activeTool}
                setActiveTool={(t) => { dt.setActiveTool(t); setSelectedNode(null); setSelectedRoute(null); if (t === 'draw_cable') dt.setCablePoints([]); }}
                hasOLT={nodes.some(n => n.node_type === 'OLT')}
                isDrawingCable={dt.isDrawingCable}
                cablePointCount={dt.cablePoints.length}
                onFinishCable={finishCable}
                onCancelCable={dt.resetDrawing}
                onOpenLocationSelector={onOpenLocationSelector}
                onLocateMe={handleLocateMe}
                onStartCableFromGPS={handleStartCableFromGPS}
                hasGPSLocation={!!gpsLocation}
            />

            <MobileToolbar
                onAddOLT={() => { dt.setActiveTool('add_olt'); setSelectedNode(null); setSelectedRoute(null); }}
                isDrawing={dt.isDrawingCable}
                onToggleDrawing={() => {
                    if (dt.isDrawingCable) {
                        dt.resetDrawing();
                    } else {
                        dt.setActiveTool('draw_cable');
                        dt.setCablePoints([]);
                    }
                    setSelectedNode(null);
                    setSelectedRoute(null);
                }}
                onOpenSearch={onOpenLocationSelector}
                onToggleLayers={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
            />

            <FloatingStats nodes={nodes} routes={routes} />

            {selectedNode && dt.activeTool !== 'draw_cable' && (
                <NodeInfoPanel
                    node={selectedNode}
                    onClose={() => setSelectedNode(null)}
                    onDelete={async (id) => { if (await deleteNode(id)) setSelectedNode(null); }}
                    onCenter={(n) => flyToNode(n.location.lng, n.location.lat)}
                    onInspect={(n) => { onNodeDoubleClick?.(n); setSelectedNode(null); }}
                    onAddChild={(parent) => dt.startCableAt(parent.location.lng, parent.location.lat)}
                />
            )}

            {selectedRoute && dt.activeTool !== 'draw_cable' && (
                <RouteInfoPanel 
                    route={selectedRoute} 
                    topOffset={selectedNode ? '490px' : '16px'} 
                    onClose={() => setSelectedRoute(null)} 
                    onDelete={async (id) => { if (await deleteRoute(id)) setSelectedRoute(null); }} 
                    onCenter={(r) => r.path.coordinates[0] && flyToRoute(r.path.coordinates[0][0], r.path.coordinates[0][1])}
                />
            )}

            {dt.showTerminationModal && (
                <TerminationModal
                    startType={nodes.find(n => Math.sqrt(Math.pow(n.location.lat - dt.cablePoints[0][1], 2) + Math.pow(n.location.lng - dt.cablePoints[0][0], 2)) < 0.0001)?.node_type}
                    clientForm={clientForm} setClientForm={setClientForm}
                    onSelectTarget={handleSaveContinuousTraceAction}
                    onCancel={() => { dt.setShowTerminationModal(false); dt.resetDrawing(); }}
                />
            )}

            {dt.showAddForm && (
                <AddNodeForm
                    pendingNodeType={dt.pendingNodeType} pendingLocation={dt.pendingLocation!}
                    formName={formName} setFormName={setFormName} formDescription={formDescription} setFormDescription={setFormDescription}
                    formPower={formPower} setFormPower={setFormPower} onSave={handleSaveNodeAction} onCancel={() => { dt.setShowAddForm(false); dt.setActiveTool('select'); }}
                />
            )}

            {dt.showCableForm && (
                <CableForm
                    cableName={cableName} setCableName={setCableName} cableType={cableType} setCableType={setCableType}
                    cableCapacity={cableCapacity} setCableCapacity={setCableCapacity} cablePointCount={dt.cablePoints.length}
                    onSave={handleSaveCableAction} onCancel={dt.resetDrawing}
                />
            )}
        </div>
    );
};

export default FTTHMap;
