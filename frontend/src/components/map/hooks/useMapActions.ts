import { apiFetch } from '../../../utils/apiFetch';
import { API_BASE } from '../types';
import type { NodeData, RouteData } from '../types';

interface UseMapActionsProps {
    setNodes: React.Dispatch<React.SetStateAction<NodeData[]>>;
    setRoutes: React.Dispatch<React.SetStateAction<RouteData[]>>;
}

export const useMapActions = ({ setNodes, setRoutes }: UseMapActionsProps) => {
    const saveNode = async (payload: any) => {
        try {
            const res = await apiFetch(`${API_BASE}/nodes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                const data = await res.json();
                setNodes(prev => [...prev, data]);
                return data;
            }
        } catch (e) {
            console.error("Save node failed", e);
        }
        return null;
    };

    const saveCable = async (payload: any) => {
        try {
            const res = await apiFetch(`${API_BASE}/routes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                const data = await res.json();
                setRoutes(prev => [...prev, data]);
                return data;
            }
        } catch (e) {
            console.error("Save cable failed", e);
        }
        return null;
    };

    const saveContinuousTrace = async (payload: any) => {
        try {
            const res = await apiFetch(`${API_BASE}/continuous-trace`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                const data = await res.json();
                setNodes(prev => [...prev, data.node]);
                setRoutes(prev => [...prev, data.route]);
                return data;
            }
        } catch (e) {
            console.error("Save continuous trace failed", e);
        }
        return null;
    };

    return {
        saveNode,
        saveCable,
        saveContinuousTrace
    };
};
