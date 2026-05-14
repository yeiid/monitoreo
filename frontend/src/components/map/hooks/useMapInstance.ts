import { useRef, useEffect, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import { MAP_TILE_URL } from '../types';

interface UseMapInstanceProps {
    center: [number, number];
    zoom: number;
}

export const useMapInstance = ({ center, zoom }: UseMapInstanceProps) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);

    useEffect(() => {
        if (map.current || !mapContainer.current) return;

        let styleUrl = '';
        if (MAP_TILE_URL.endsWith('.json')) {
            styleUrl = MAP_TILE_URL;
        } else {
            styleUrl = `${MAP_TILE_URL.replace(/\/$/, '')}/styles/basic/style.json`;
        }

        let initialCenter: [number, number] = [center[1], center[0]];
        let initialZoom: number = zoom;

        if (typeof window !== 'undefined') {
            const savedViewport = localStorage.getItem('ftth_viewport');
            if (savedViewport) {
                try {
                    const { lng, lat, zoom: sz } = JSON.parse(savedViewport);
                    initialCenter = [lng, lat];
                    initialZoom = sz;
                } catch (e) { /* ignore */ }
            }
        }

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: styleUrl,
            center: initialCenter,
            zoom: initialZoom,
            maxZoom: 22,
            pitch: 60,
            bearing: -17,
            antialias: true,
            transformRequest: (url) => {
                let transformedUrl = url;
                
                // Fix for misconfigured style servers returning localhost:None
                if (transformedUrl.includes('localhost:None')) {
                    transformedUrl = transformedUrl.replace('localhost:None', window.location.host);
                }

                if (!transformedUrl.startsWith('http://localhost') &&
                    !transformedUrl.startsWith('http://127.0.0.1') &&
                    !transformedUrl.startsWith('http://192.168.')) {
                    transformedUrl = transformedUrl.replace('http://', 'https://');
                }
                return { url: transformedUrl };
            }
        });

        const m = map.current;

        m.on('moveend', () => {
            const c = m.getCenter();
            localStorage.setItem('ftth_viewport', JSON.stringify({
                lng: c.lng,
                lat: c.lat,
                zoom: m.getZoom()
            }));
        });

        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, []);

    const flyToNode = useCallback((lng: number, lat: number) => {
        if (!map.current) return;
        map.current.flyTo({
            center: [lng, lat],
            zoom: 18,
            speed: 1.5,
            curve: 1
        });
    }, []);

    const flyToRoute = useCallback((lng: number, lat: number) => {
        if (!map.current) return;
        map.current.flyTo({
            center: [lng, lat],
            zoom: 16,
            speed: 1.2
        });
    }, []);

    return {
        mapContainer,
        map,
        flyToNode,
        flyToRoute
    };
};
