import { useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import type { DrawingTool, RouteData } from '../types';

interface UseMapInteractionProps {
    map: React.MutableRefObject<maplibregl.Map | null>;
    activeToolRef: React.MutableRefObject<DrawingTool>;
    routesRef: React.MutableRefObject<RouteData[]>;
    handleMapClick: (lat: number, lng: number) => void;
    handleCablePoint: (lat: number, lng: number) => void;
    setSelectedRoute: (route: RouteData | null) => void;
}

export const useMapInteraction = ({
    map,
    activeToolRef,
    routesRef,
    handleMapClick,
    handleCablePoint,
    setSelectedRoute
}: UseMapInteractionProps) => {
    useEffect(() => {
        if (!map.current) return;
        const m = map.current;

        const onClick = (e: maplibregl.MapMouseEvent) => {
            const { lng, lat } = e.lngLat;
            const tool = activeToolRef.current;
            if (['add_olt', 'add_mufla', 'add_nap', 'add_client'].includes(tool)) {
                handleMapClick(lat, lng);
            } else if (tool === 'draw_cable') {
                handleCablePoint(lat, lng);
            }
        };

        const onRouteClick = (e: any) => {
            if (activeToolRef.current === 'select' && e.features?.[0]) {
                const routeId = e.features[0].properties?.id;
                const r = routesRef.current.find(rt => rt.id === routeId);
                if (r) setSelectedRoute(r);
            }
        };

        const onMouseEnter = () => {
            if (activeToolRef.current === 'select') {
                m.getCanvas().style.cursor = 'pointer';
            }
        };

        const onMouseLeave = () => {
            if (activeToolRef.current === 'select') {
                m.getCanvas().style.cursor = '';
            }
        };

        m.on('click', onClick);
        m.on('click', 'routes-layer', onRouteClick);
        m.on('mouseenter', 'routes-layer', onMouseEnter);
        m.on('mouseleave', 'routes-layer', onMouseLeave);

        return () => {
            m.off('click', onClick);
            m.off('click', 'routes-layer', onRouteClick);
            m.off('mouseenter', 'routes-layer', onMouseEnter);
            m.off('mouseleave', 'routes-layer', onMouseLeave);
        };
    }, [map]);
};
