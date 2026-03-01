import React, { useState } from "react";
import FTTHMap from "./FTTHMap";
import DiagramadorEmpalmes from "./DiagramadorEmpalmes";
import GestorOLT from "./GestorOLT";
import GestorODF from "./GestorODF";
import LocationSelector from "./LocationSelector";

export default function MapApp() {
    const [selectedNode, setSelectedNode] = useState<any>(null);
    const [mapView, setMapView] = useState<{
        center: [number, number];
        zoom: number;
    } | null>(null);

    return (
        <>
            {!mapView && (
                <LocationSelector onLocationSelect={(view) => setMapView(view)} />
            )}

            {mapView && (
                <>
                    <FTTHMap
                        center={mapView.center}
                        zoom={mapView.zoom}
                        onNodeDoubleClick={(node) => setSelectedNode(node)}
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
                </>
            )}
        </>
    );
}
