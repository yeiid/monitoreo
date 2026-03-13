import React, { useEffect, useState } from 'react';
import { API_BASE } from './types';
import { apiFetch } from '../../utils/apiFetch';

// ── Thresholds (must match backend) ──
const POWER_EXCELLENT = -24.0; // > -24 → green
const POWER_WARNING = -27.0; // -24 to -27 → yellow

type Level = 'excellent' | 'warning' | 'critical' | 'loading' | 'error' | 'unavailable';

interface BudgetBreakdown {
    fiber_loss_dB: number;
    connector_loss_dB: number;
    splitter_loss_dB: number;
    splice_loss_dB: number;
}

interface HopEntry {
    name: string;
    type: string;
    cable_length_m?: number;
    fiber_loss_dB?: number;
    connector_loss_dB?: number;
    splitter_loss_dB?: number;
    detail?: string;
}

interface BudgetResult {
    received_power_dbm: number;
    level: Level;
    total_loss_dB: number;
    olt_launch_power_dbm: number;
    breakdown: BudgetBreakdown;
    hop_chain: HopEntry[];
}

// ── Traffic light colors ──
function powerColor(level: Level): string {
    if (level === 'excellent') return '#22c55e';
    if (level === 'warning') return '#f59e0b';
    if (level === 'critical') return '#ef4444';
    return '#6b7280';
}

function levelLabel(level: Level) {
    const map: Record<string, string> = {
        excellent: 'Excelente ✅', warning: 'Aceptable ⚠️', critical: 'Crítico 🔴',
        loading: 'Calculando…', error: 'Error', unavailable: 'Sin ruta a OLT',
    };
    return map[level] || level;
}

// ── Small inline badge used on the map popup ──
export function PowerBadgeInline({ nodeId, nodeType }: { nodeId: string; nodeType: string }) {
    const [power, setPower] = useState<number | null>(null);
    const [level, setLevel] = useState<Level>('loading');

    useEffect(() => {
        if (!['MUFLA', 'CAJA_NAP', 'CLIENTE_ONU'].includes(nodeType)) return;
        apiFetch(`${API_BASE}/power-budget/${nodeId}`)
            .then(r => r.json())
            .then(d => { setPower(d.received_power_dbm); setLevel(d.level); })
            .catch(() => setLevel('error'));
    }, [nodeId, nodeType]);

    if (!['MUFLA', 'CAJA_NAP', 'CLIENTE_ONU'].includes(nodeType)) return null;
    if (level === 'loading') return <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>⚡ …</span>;
    if (level === 'error' || level === 'unavailable') return null;

    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '3px',
            fontSize: '0.72rem', fontWeight: 700,
            color: powerColor(level),
            background: `${powerColor(level)}18`,
            border: `1px solid ${powerColor(level)}44`,
            borderRadius: '5px', padding: '2px 6px',
        }}>
            ⚡ {power?.toFixed(1)} dBm
        </span>
    );
}

// ── Full detail panel ──
export function PowerBudgetPanel({ nodeId, nodeName, onClose }: {
    nodeId: string;
    nodeName: string;
    onClose: () => void;
}) {
    const [data, setData] = useState<BudgetResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true); setError(null);
        apiFetch(`${API_BASE}/power-budget/${nodeId}`)
            .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
            .then(d => { setData(d); setLoading(false); })
            .catch(e => { setError(e.message); setLoading(false); });
    }, [nodeId]);

    const color = data ? powerColor(data.level as Level) : '#6b7280';

    return (
        <div className="glass-morphism" style={{
            position: 'absolute', bottom: '20px', right: '16px', zIndex: 900,
            width: '320px', borderRadius: '16px', overflow: 'hidden',
            border: `1px solid ${color}44`,
            boxShadow: `0 0 30px ${color}22`,
        }}>
            {/* Header */}
            <div style={{ background: `${color}18`, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${color}33` }}>
                <div>
                    <div style={{ fontSize: '0.68rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Budget Óptico</div>
                    <div style={{ fontWeight: 700, color: 'white', fontSize: '0.9rem' }}>{nodeName}</div>
                </div>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
            </div>

            <div style={{ padding: '16px' }}>
                {loading && <div style={{ color: '#9ca3af', textAlign: 'center', padding: '20px' }}>Calculando ruta…</div>}
                {error && <div style={{ color: '#ef4444', fontSize: '0.82rem' }}>⚠️ {error}</div>}

                {data && (
                    <>
                        {/* Main power reading */}
                        <div style={{ textAlign: 'center', padding: '16px 0' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 900, color, letterSpacing: '-0.02em', lineHeight: 1 }}>
                                {data.received_power_dbm.toFixed(2)}
                                <span style={{ fontSize: '1rem', fontWeight: 400, marginLeft: '4px' }}>dBm</span>
                            </div>
                            <div style={{ marginTop: '6px', fontSize: '0.82rem', color }}>
                                {levelLabel(data.level as Level)}
                            </div>

                            {/* Traffic light bar */}
                            <div style={{ marginTop: '12px', display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                {['critical', 'warning', 'excellent'].map(l => (
                                    <div key={l} style={{
                                        width: '52px', height: '6px', borderRadius: '4px',
                                        background: data.level === l ? powerColor(l as Level) : 'rgba(255,255,255,0.08)',
                                        boxShadow: data.level === l ? `0 0 8px ${powerColor(l as Level)}` : 'none',
                                        transition: 'all 0.3s',
                                    }} />
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
