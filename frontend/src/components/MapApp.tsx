import React, { useState } from "react";
import FTTHMap from "./FTTHMap";
import DiagramadorEmpalmes from "./DiagramadorEmpalmes";
import GestorOLT from "./GestorOLT";
import GestorODF from "./GestorODF";
import LocationSelector from "./LocationSelector";

export default function MapApp() {
    const [selectedNode, setSelectedNode] = useState<any>(null);
    const [showLocationSelector, setShowLocationSelector] = useState(false);

    // Default to Bogota, read from localStorage (ftth_viewport)
    const [mapView, setMapView] = useState<{
        center: [number, number];
        zoom: number;
    }>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('ftth_viewport');
            if (saved) {
                try {
                    const { lng, lat, zoom: sz } = JSON.parse(saved);
                    return { center: [lat, lng], zoom: sz };
                } catch (e) { /* ignore */ }
            }
        }
        return { center: [4.6097, -74.0817], zoom: 6 };
    });

    const handleLocationSelect = (view: { center: [number, number]; zoom: number }) => {
        setMapView(view);
        setShowLocationSelector(false);
        // useMapInstance will persist to ftth_viewport on moveend
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {showLocationSelector && (
                <LocationSelector
                    onLocationSelect={handleLocationSelect}
                    onClose={() => setShowLocationSelector(false)}
                />
            )}

            <FTTHMap
                center={mapView.center}
                zoom={mapView.zoom}
                onNodeDoubleClick={(node) => setSelectedNode(node)}
                onOpenLocationSelector={() => setShowLocationSelector(true)}
            />
            {selectedNode && (
                selectedNode.node_type === "OLT" ? (
                    <GestorOLT
                        node={selectedNode}
                        onClose={() => setSelectedNode(null)}
                    />
                ) : selectedNode.node_type === "ODF" ? (
                    <GestorODF
                        node={selectedNode}
                        onClose={() => setSelectedNode(null)}
                    />
                ) : (
                    <DiagramadorEmpalmes
                        node={selectedNode}
                        onClose={() => setSelectedNode(null)}
                    />
                )
            )}
        </div>
    );
}
