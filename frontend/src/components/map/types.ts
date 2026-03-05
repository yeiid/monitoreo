// ─────────────────────────────────
// Shared Types for FTTH Map system
// ─────────────────────────────────

export interface NodeData {
    id: string;
    name: string;
    node_type: string;
    description?: string;
    optical_power_dbm?: number;
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
    icon: string;
    shape: 'square' | 'rhombus' | 'circle' | 'triangle';
}

export const NODE_CONFIG: Record<string, NodeConfigItem> = {
    OLT: { color: '#ef4444', label: 'OLT', icon: '📡', shape: 'square' },
    ODF: { color: '#6b7280', label: 'ODF', icon: '🔩', shape: 'square' },
    MUFLA: { color: '#f97316', label: 'Mufla', icon: '🔶', shape: 'rhombus' },
    CAJA_NAP: { color: '#3b82f6', label: 'NAP', icon: '📦', shape: 'triangle' },
    CLIENTE_ONU: { color: '#10b981', label: 'Cliente', icon: '🏠', shape: 'circle' },
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
    // Fallback for local development or other environments
    if (typeof window !== 'undefined' && window.location.hostname.includes('neuraljira.tech')) {
        return 'https://api.neuraljira.tech/api/v1';
    }
    return 'http://localhost:8000/api/v1';
};

let RawAPI = getRawApi();

// Remove trailing slash to avoid double slashes or 307 redirects
RawAPI = RawAPI.replace(/\/$/, '');

// Ensure /api/v1 prefix is present
if (!RawAPI.endsWith('/api/v1')) {
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
    || 'https://tiles.neuraljira.tech/styles/basic-preview/512/{z}/{x}/{y}.png';

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
