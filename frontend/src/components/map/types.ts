// ─────────────────────────────────
// Shared Types for FTTH Map system
// ─────────────────────────────────

export interface NodeData {
    id: string;
    name: string;
    node_type: string;
    description?: string;
    optical_power_dbm?: number;
    status: 'online' | 'offline' | 'warning';
    hardware_details?: Record<string, any>;
    location: { lat: number; lng: number };
}

export interface RouteData {
    id: string;
    name: string;
    route_type: string;
    capacity: number;
    path: { coordinates: number[][] };
    start_node_id?: string;
    end_node_id?: string;
    source_card?: number;
    source_port?: number;
    length_meters?: number;
}

export type DrawingTool =
    | 'select'
    | 'add_olt'
    | 'add_mufla'
    | 'add_nap'
    | 'add_client'
    | 'draw_cable'
    | 'delete';

// ─────────────────────────────────
// Shared Constants
// ─────────────────────────────────

export interface NodeConfigItem {
    color: string;
    label: string;
    svgPath: string; // Inner SVG content (fallback)
    iconUrl?: string; // New custom icon URL
}

export const NODE_CONFIG: Record<string, NodeConfigItem> = {
    OLT: {
        color: '#ef4444', label: 'OLT',
        svgPath: '<path d="M12 2L2 22h20L12 2z" stroke-width="1.5"/><circle cx="12" cy="12" r="3" stroke-width="1.5"/><path d="M12 18v4" stroke-width="1.5"/>',
        iconUrl: '/otl-negra.svg'
    },
    ODF: {
        color: '#6b7280', label: 'ODF',
        svgPath: '<rect x="3" y="3" width="18" height="18" rx="2" stroke-width="1.5"/><path d="M3 9h18M3 15h18M7 6h2M7 12h2M7 18h2" stroke-width="1.5"/>',
        iconUrl: '/odf.svg'
    },
    MUFLA: {
        color: '#f97316', label: 'Mufla',
        svgPath: '<path d="M12 2l8.66 5v10L12 22l-8.66-5V7L12 2z" stroke-width="1.5"/><circle cx="12" cy="12" r="4" stroke-width="1.5"/>',
        iconUrl: '/mucfla1-negra.svg'
    },
    CAJA_NAP: {
        color: '#3b82f6', label: 'NAP',
        svgPath: '<rect x="4" y="4" width="16" height="16" rx="2" stroke-width="2"/><path d="M9 9h6v6H9z" fill="currentColor" opacity="0.4"/><path d="M12 4v4m-8 8h4m12 0h-4M12 20v-4" stroke-width="1.5"/>',
        iconUrl: '/nap.svg'
    },
    CLIENTE_ONU: {
        color: '#10b981', label: 'Cliente',
        svgPath: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" stroke-width="1.5"/><path d="M9 22V12h6v10" stroke-width="1.5"/>',
        iconUrl: '/home.svg'
    },
};

export interface RouteConfigItem {
    color: string;
    weight: number;
    opacity: number;
    dash?: string;
    label: string;
}

export const ROUTE_CONFIG: Record<string, RouteConfigItem> = {
    PATCHCORD: { color: '#facc15', weight: 2, opacity: 1.0, dash: '6, 4', label: 'Patchcord' },
    TRONCAL: { color: '#A855F7', weight: 4, opacity: 1.0, dash: undefined, label: 'Troncal' },
    DISTRIBUCION: { color: '#3B82F6', weight: 3, opacity: 0.8, dash: undefined, label: 'Distribución' },
    ACOMETIDA: { color: '#10B981', weight: 2, opacity: 0.8, dash: '5, 5', label: 'Acometida' },
};

// ─────────────────────────────────
// Environment configuration
// ─────────────────────────────────

// 1. API_BASE with robust sanitization for Astro
const getRawApi = () => {
    // Standard Astro client-side environment variables
    if (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_API_URL) {
        return import.meta.env.PUBLIC_API_URL;
    }
    // Fallback for production domains
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname.includes('api2.neuraljira.tech') || hostname.includes('ftthmapper.neuraljira.tech')) {
            return `https://api2.neuraljira.tech/api/v1`;
        }
        if (hostname.includes('neuraljira.tech')) {
            return `https://${hostname.replace('ftthmapper', 'api2')}/api/v1`;
        }
    }
    return 'http://localhost:8000/api/v1';
};

let RawAPI = getRawApi();

// Remove trailing slash to avoid double slashes or 307 redirects
RawAPI = RawAPI.replace(/\/$/, '');

// Ensure /api/v1 prefix is present if it's a domain call
if (!RawAPI.endsWith('/api/v1') && RawAPI.includes('neuraljira.tech')) {
    RawAPI = `${RawAPI}/api/v1`;
}

// Aggressive fix: If we're not on localhost/127.0.0.1, force https
if (typeof window !== 'undefined') {
    const isLocal = window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.startsWith('192.168.');
    if (!isLocal) {
        RawAPI = RawAPI.replace('http://', 'https://');
    }
}

export const API_BASE = RawAPI;

// 2. TileServer configuration
export const MAP_TILE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_MAP_TILE_URL)
    || (typeof window !== 'undefined' && window.location.hostname.includes('neuraljira.tech') ? '/tiles/' : 'http://localhost:8080/styles/basic/style.json');

export const TILES_ATTRIBUTION = (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_MAP_ATTRIBUTION)
    || '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a>';

// ─────────────────────────────────
// Fiber Standards (TIA/EIA-598)
// ─────────────────────────────────

export const FIBER_COLORS: Record<string, string> = {
    azul: '#2563eb', // Blue
    naranja: '#f97316', // Orange
    verde: '#22c55e', // Green
    marron: '#92400e', // Brown
    gris: '#9ca3af', // Slate
    blanco: '#f1f5f9', // White
    rojo: '#ef4444', // Red
    negro: '#1e293b', // Black
    amarillo: '#facc15', // Yellow
    violeta: '#a855f7', // Violet
    rosa: '#ec4899', // Rose
    aqua: '#06b6d4', // Aqua
};

export const FIBER_COLOR_ORDER = [
    'azul', 'naranja', 'verde', 'marron', 'gris', 'blanco',
    'rojo', 'negro', 'amarillo', 'violeta', 'rosa', 'aqua',
];

// ─────────────────────────────────
// Sync Splices Payload Types
// ─────────────────────────────────

export interface SplicePayload {
    source_type: 'strand' | 'splitter_in' | 'splitter_out';
    source_id: string | null;
    source_port: number | null;
    target_type: 'strand' | 'splitter_in' | 'splitter_out';
    target_id: string | null;
    target_port: number | null;
    input_node_id?: string | null;
    output_node_id?: string | null;
    input_fiber_index?: number | null;
    output_fiber_index?: number | null;
    loss_db?: number;
    extra_metadata?: Record<string, any>;
}

export interface SplitterPayload {
    diagram_id: string; // React Flow node id for mapping
    splitter_type: string;
    name: string;
    configuration?: Record<string, any>;
}

export interface SyncSplicesRequest {
    splices: SplicePayload[];
    splitters: SplitterPayload[];
}
