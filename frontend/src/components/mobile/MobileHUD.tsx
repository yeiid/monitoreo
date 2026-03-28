import React, { useState, useEffect } from 'react';

interface MobileHUDProps {
    nodeName?: string;
    connectionStatus?: 'online' | 'offline' | 'loading';
}

const MobileHUD: React.FC<MobileHUDProps> = ({ 
    nodeName = 'PLANTA EXTERNA', 
    connectionStatus = 'online' 
}) => {
    const [time, setTime] = useState('');
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Clock update
        const updateClock = () => {
            const now = new Date();
            setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        };
        updateClock();
        const timer = setInterval(updateClock, 30000);
        
        // Appear animation delay
        const timeout = setTimeout(() => setVisible(true), 100);

        return () => {
            clearInterval(timer);
            clearTimeout(timeout);
        };
    }, []);

    if (!visible) return null;

    return (
        <div className="mobile-hud-container mobile-only animate-in">
            <div className="hud-content">
                <div className="hud-left">
                    <span className="time">{time}</span>
                    <span className="location-name">{nodeName}</span>
                </div>
                
                <div className="hud-right">
                    <div className="signal-bars">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className={`bar bar-${i} active`} />
                        ))}
                    </div>
                    <div className={`status-pill ${connectionStatus}`}>
                        <span className="pulse-dot"></span>
                        LIVE
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .mobile-hud-container {
                    position: fixed;
                    top: 80px;
                    left: 12px;
                    right: 12px;
                    z-index: 900;
                    pointer-events: none;
                }

                .hud-content {
                    background: rgba(10, 10, 20, 0.75);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid rgba(157, 78, 221, 0.2);
                    border-radius: 20px;
                    padding: 8px 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.05);
                }

                .hud-left {
                    display: flex;
                    flex-direction: column;
                }

                .time {
                    font-size: 0.7rem;
                    font-weight: 800;
                    color: var(--primary-glow);
                    letter-spacing: 0.05em;
                }

                .location-name {
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: white;
                    text-transform: uppercase;
                    letter-spacing: 0.02em;
                    max-width: 180px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .hud-right {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .signal-bars {
                    display: flex;
                    align-items: flex-end;
                    gap: 2px;
                    height: 12px;
                }

                .bar {
                    width: 3px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 1px;
                }

                .bar-1 { height: 4px; }
                .bar-2 { height: 7px; }
                .bar-3 { height: 10px; }
                .bar-4 { height: 13px; }

                .bar.active { background: var(--primary-glow); }

                .status-pill {
                    background: rgba(16, 185, 129, 0.15);
                    border: 1px solid rgba(16, 185, 129, 0.3);
                    color: #10b981;
                    font-size: 0.65rem;
                    font-weight: 900;
                    padding: 2px 8px;
                    border-radius: 100px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .pulse-dot {
                    width: 5px;
                    height: 5px;
                    background: #10b981;
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                    box-shadow: 0 0 5px #10b981;
                }

                @keyframes pulse {
                    0% { transform: scale(0.95); opacity: 0.7; }
                    50% { transform: scale(1.2); opacity: 1; }
                    100% { transform: scale(0.95); opacity: 0.7; }
                }
            `}} />
        </div>
    );
};

export default MobileHUD;
