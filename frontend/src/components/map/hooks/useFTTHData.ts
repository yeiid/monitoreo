import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../../utils/apiFetch';
import type { NodeData, RouteData } from '../types';
import { API_BASE } from '../types';

export const useFTTHData = () => {
    const [nodes, setNodes] = useState<NodeData[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('ftth_nodes');
            return saved ? JSON.parse(saved) : [];
        }
        return [];
    });

    const [routes, setRoutes] = useState<RouteData[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('ftth_routes');
            return saved ? JSON.parse(saved) : [];
        }
        return [];
    });

    const fetchNodes = useCallback(async () => {
        try {
            const res = await apiFetch(`${API_BASE}/nodes`);
            if (res.ok) {
                const data = await res.json();
                setNodes(data);
                localStorage.setItem('ftth_nodes', JSON.stringify(data));
            }
        } catch (err) {
            console.error(`[Nodes] Failed: ${err}`);
        }
    }, []);

    const fetchRoutes = useCallback(async () => {
        try {
            const res = await apiFetch(`${API_BASE}/routes`);
            if (res.ok) {
                const data = await res.json();
                setRoutes(data);
                localStorage.setItem('ftth_routes', JSON.stringify(data));
            }
        } catch (err) {
            console.error(`[Routes] Failed: ${err}`);
        }
    }, []);

    useEffect(() => {
        fetchNodes();
        fetchRoutes();
    }, [fetchNodes, fetchRoutes]);

    const deleteNode = async (nodeId: string) => {
        try {
            await apiFetch(`${API_BASE}/nodes/${nodeId}`, { method: 'DELETE' });
            setNodes(prev => prev.filter(n => n.id !== nodeId));
            setRoutes(prev => prev.filter(r => r.start_node_id !== nodeId && r.end_node_id !== nodeId));
            return true;
        } catch (err) {
            console.error("Failed to delete node", err);
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
            return false;
        }
    };

    return {
        nodes,
        setNodes,
        routes,
        setRoutes,
        fetchNodes,
        fetchRoutes,
        deleteNode,
        deleteRoute
    };
};
