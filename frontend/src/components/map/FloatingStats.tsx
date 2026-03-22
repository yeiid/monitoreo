import React from 'react';
import type { NodeData, RouteData } from './types';

interface FloatingStatsProps {
    nodes: NodeData[];
    routes: RouteData[];
}

const FloatingStats: React.FC<FloatingStatsProps> = ({ nodes, routes }) => (
    <div className="floating-stats desktop-only">
        <span className="stat-badge olt">
            {nodes.filter(n => n.node_type === 'OLT').length} OLTs
        </span>
        <span className="stat-badge mufla">
            {nodes.filter(n => n.node_type === 'MUFLA').length} Muflas
        </span>
        <span className="stat-badge nap">
            {nodes.filter(n => n.node_type === 'CAJA_NAP').length} NAPs
        </span>
        <span className="stat-badge client">
            {nodes.filter(n => n.node_type === 'CLIENTE_ONU').length} Clientes
        </span>
        <span className="stat-badge" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#a78bfa', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
            {routes.length} Cables
        </span>
    </div>
);

export default FloatingStats;
