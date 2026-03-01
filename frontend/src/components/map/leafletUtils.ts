import L from 'leaflet';
import { NODE_CONFIG } from './types';

export function createNodeIcon(nodeType: string): L.DivIcon {
    const config = NODE_CONFIG[nodeType] || NODE_CONFIG.CAJA_NAP;

    let borderRadius = '50%';
    let clipPath = '';

    if (config.shape === 'square') { borderRadius = '4px'; }
    if (config.shape === 'rhombus') { borderRadius = '2px'; clipPath = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'; }
    if (config.shape === 'triangle') { borderRadius = '0'; clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)'; }

    return L.divIcon({
        className: 'custom-node-marker',
        html: `
      <div style="
        width: 32px; height: 32px;
        background: ${config.color};
        border-radius: ${borderRadius};
        ${clipPath ? `clip-path: ${clipPath};` : ''}
        border: 2px solid rgba(255,255,255,0.9);
        box-shadow: 0 0 12px ${config.color}88, 0 2px 8px rgba(0,0,0,0.4);
        display: flex; align-items: center; justify-content: center;
        font-size: 14px; cursor: pointer; transition: transform 0.15s ease;
      "><span style="${config.shape === 'rhombus' || config.shape === 'triangle' ? 'transform: scale(0.85);' : ''}">${config.icon}</span></div>
    `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
    });
}

export const CABLE_POINT_ICON = L.divIcon({
    className: '',
    html: `<div style="
        width: 10px; height: 10px;
        background: #facc15;
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 0 8px rgba(250, 204, 21, 0.5);
    "></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
});
