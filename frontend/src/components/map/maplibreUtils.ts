import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { NODE_CONFIG } from './types';

export type NodeStatus = 'online' | 'offline' | 'warning' | 'default';

const STATUS_COLORS: Record<NodeStatus, string> = {
    online: '#22c55e',      // Green
    offline: '#ef4444',     // Red
    warning: '#eab308',     // Yellow
    default: '',            // Use node type color
};

/**
 * Creates an HTML element for a MapLibre Marker using the same SVG logic.
 */
export function createNodeElement(nodeType: string, status: NodeStatus = 'online'): HTMLElement {
    const config = NODE_CONFIG[nodeType] || NODE_CONFIG.CAJA_NAP;
    const color = (status && status !== 'default') ? STATUS_COLORS[status] : config.color;

    const el = document.createElement('div');
    el.className = 'custom-maplibre-marker';
    el.style.width = '32px';
    el.style.height = '32px';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.cursor = 'pointer';
    el.style.filter = `drop-shadow(0 0 2px white) drop-shadow(0 0 5px ${color}66)`;

    if (config.iconUrl) {
        el.innerHTML = `
            <img src="${config.iconUrl}" style="width: 24px; height: 24px; object-fit: contain; pointer-events: none;" alt="${config.label}" />
        `;
    } else {
        el.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;">
                ${config.svgPath}
            </svg>
        `;
    }

    return el;
}

/**
 * Helper to convert our internal LatLng to MapLibre's LngLat (Array)
 */
export function toMapLibreCoord(lat: number, lng: number): [number, number] {
    return [lng, lat];
}

/**
 * Common style for cable lines in MapLibre
 */
export const CABLE_LAYER_STYLE = (color: string) => ({
    'line-color': color,
    'line-width': 3,
    'line-opacity': 0.8,
    'line-dasharray': [1, 1], // For non-finalized cables
});
