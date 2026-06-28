import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../../utils/apiFetch';
import type { NodeData, RouteData } from '../types';
import { API_BASE } from '../types';

export const useFTTHData = () => {
    const [nodes, setNodes] = useState<NodeData[]>([]);
    const [routes, setRoutes] = useState<RouteData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchNodes = useCallback(async () => {
        try {
            const res = await apiFetch(`${API_BASE}/nodes`);
            if (res.ok) {
                const data = await res.json();
                setNodes(data);
            } else {
                throw new Error(`Nodes fetch failed: ${res.status}`);
            }
        } catch (err) {
            console.error(`[Nodes] Failed: ${err}`);
            setError(`Error cargando nodos: ${err}`);
        }
    }, []);

    const fetchRoutes = useCallback(async () => {
        try {
            const res = await apiFetch(`${API_BASE}/routes`);
            if (res.ok) {
                const data = await res.json();
                setRoutes(data);
            } else {
                throw new Error(`Routes fetch failed: ${res.status}`);
            }
        } catch (err) {
            console.error(`[Routes] Failed: ${err}`);
            setError(`Error cargando cables: ${err}`);
        }
    }, []);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError(null);
            await Promise.all([fetchNodes(), fetchRoutes()]);
            setLoading(false);
        };
        loadData();
    }, [fetchNodes, fetchRoutes]);

    const deleteNode = async (nodeId: string) => {
        try {
            await apiFetch(`${API_BASE}/nodes/${nodeId}`, { method: 'DELETE' });
            setNodes(prev => prev.filter(n => n.id !== nodeId));
            setRoutes(prev => prev.filter(r => r.start_node_id !== nodeId && r.end_node_id !== nodeId));
            return true;
        } catch (err) {
            console.error("Failed to delete node", err);
            setError(`Error eliminando nodo: ${err}`);
            return false;
        }
    };

    const deleteRoute = async (routeId: string) => {
        try {
            await apiFetch(`${API_BASE}/routes/${routeId}`, { method: 'DELETE' });
            setRoutes(prev => prev.filter(r => r.id !== routeId));
            return true;
        } catch (err) {
            console.error("Failed to delete route", err);
            setError(`Error eliminando cable: ${err}`);
            return false;
        }
    };

    return {
        nodes,
        setNodes,
        routes,
        setRoutes,
        loading,
        error,
        fetchNodes,
        fetchRoutes,
        deleteNode,
        deleteRoute
    };
};