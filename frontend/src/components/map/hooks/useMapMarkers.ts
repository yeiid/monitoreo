import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import type { NodeData, DrawingTool } from '../types';
import { createNodeElement } from '../maplibreUtils';

interface UseMapMarkersProps {
    map: React.MutableRefObject<maplibregl.Map | null>;
    nodes: NodeData[];
    activeToolRef: React.MutableRefObject<DrawingTool>;
    onNodeClick: (node: NodeData) => void;
    onNodeDoubleClick: (node: NodeData) => void;
    onNodePressStart: (node: NodeData) => void;
    onNodePressEnd: () => void;
}

export const useMapMarkers = ({
    map,
    nodes,
    activeToolRef,
    onNodeClick,
    onNodeDoubleClick,
    onNodePressStart,
    onNodePressEnd
}: UseMapMarkersProps) => {
    const markers = useRef<Record<string, maplibregl.Marker>>({});

    useEffect(() => {
        if (!map.current) return;
        const m = map.current;

        nodes.forEach(node => {
            if (!markers.current[node.id]) {
                const el = createNodeElement(node.node_type, node.status as any);
                const marker = new maplibregl.Marker({ element: el })
                    .setLngLat([node.location.lng, node.location.lat])
                    .addTo(m);

                el.addEventListener('mousedown', () => onNodePressStart(node));
                el.addEventListener('mouseup', onNodePressEnd);
                el.addEventListener('mouseleave', onNodePressEnd);
                
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    onNodeClick(node);
                });

                el.addEventListener('dblclick', (e) => {
                    e.stopPropagation();
                    onNodeDoubleClick(node);
                });

                markers.current[node.id] = marker;
            } else {
                markers.current[node.id].setLngLat([node.location.lng, node.location.lat]);
            }
        });

        // Cleanup markers that are no longer in the nodes array
        Object.keys(markers.current).forEach(id => {
            if (!nodes.find(n => n.id === id)) {
                markers.current[id].remove();
                delete markers.current[id];
            }
        });
    }, [nodes, map]); // We only re-run when nodes or map changes

    return markers;
};
