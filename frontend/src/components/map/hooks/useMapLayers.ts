import { useEffect, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import type { RouteData } from '../types';
import { ROUTE_CONFIG } from '../types';

export const useMapLayers = (
    map: React.MutableRefObject<maplibregl.Map | null>,
    routes: RouteData[],
    cablePoints: [number, number][]
) => {
    const routeGeoJSON = useMemo(() => ({
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
        const m = map.current;

        const onMapLoad = () => {
            if (!m.getSource('routes')) {
                m.addSource('routes', { type: 'geojson', data: routeGeoJSON });
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
            }

            if (!m.getSource('pending-cable')) {
                m.addSource('pending-cable', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} } });
                m.addLayer({
                    id: 'pending-cable-layer',
                    type: 'line',
                    source: 'pending-cable',
                    paint: {
                        'line-color': '#facc15',
                        'line-width': 3,
                        'line-dasharray': [2, 2],
                        'line-opacity': 0.8
                    }
                });
            }
        };

        if (m.loaded()) {
            onMapLoad();
        } else {
            m.on('load', onMapLoad);
        }
    }, [map]);

    useEffect(() => {
        if (!map.current) return;
        const source = map.current.getSource('routes') as maplibregl.GeoJSONSource;
        if (source) source.setData(routeGeoJSON);
    }, [routeGeoJSON, map]);

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
    }, [cablePoints, map]);

    // Cable animation
    useEffect(() => {
        if (!map.current) return;
        const m = map.current;
        let opacityStep = 0;
        let animationFrame: number;

        const animateCable = () => {
            if (!m || !m.getStyle()) return; // Map might have been removed
            opacityStep = (opacityStep + 0.08) % (Math.PI * 2);
            const opacity = 0.4 + Math.abs(Math.sin(opacityStep)) * 0.6;
            try {
                if (m.getLayer('pending-cable-layer')) {
                    m.setPaintProperty('pending-cable-layer', 'line-opacity', opacity);
                }
            } catch (e) {
                // Ignore errors if layer was removed mid-animation
            }
            animationFrame = requestAnimationFrame(animateCable);
        };

        animateCable();
        return () => {
            if (animationFrame) cancelAnimationFrame(animationFrame);
        };
    }, [map]);
};
