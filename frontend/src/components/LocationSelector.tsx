import React, { useState, useEffect } from 'react';
import { MapPin, ChevronRight, Globe, Navigation, X } from 'lucide-react';
import locationData from '../data/locations.json';

interface Municipality {
    id: string;
    name: string;
    center: [number, number];
    zoom: number;
}

interface Department {
    id: string;
    name: string;
    municipalities: Municipality[];
}

interface Country {
    id: string;
    name: string;
    departments: Department[];
}

interface LocationSelectorProps {
    onLocationSelect: (location: { center: [number, number]; zoom: number }) => void;
    onClose: () => void;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({ onLocationSelect, onClose }) => {
    const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
    const [selectedDept, setSelectedDept] = useState<Department | null>(null);
    const [selectedMuni, setSelectedMuni] = useState<Municipality | null>(null);

    const countries = locationData.countries as Country[];

    const handleSelect = () => {
        if (selectedMuni) {
            onLocationSelect({
                center: selectedMuni.center,
                zoom: selectedMuni.zoom
            });
        }
    };

    return (
        <div className="location-selector-overlay">
            <div className="location-selector-card glass-morphism animate-in fade-in zoom-in duration-300">
                <button className="close-btn" onClick={onClose} title="Cerrar">
                    <X size={20} />
                </button>
                <div className="selector-header">
                    <div className="icon-badge">
                        <MapPin size={24} color="#8b5cf6" />
                    </div>
                    <h2>Ir a Ubicación</h2>
                    <p>Salta rápidamente a otra zona del mapa</p>
                </div>

                <div className="selector-body">
                    <div className="dropdown-group">
                        <label>
                            <Globe size={14} /> País
                        </label>
                        <select
                            className="form-input"
                            value={selectedCountry?.id || ''}
                            onChange={(e) => {
                                const country = countries.find(c => c.id === e.target.value);
                                setSelectedCountry(country || null);
                                setSelectedDept(null);
                                setSelectedMuni(null);
                            }}
                        >
                            <option value="">Seleccione un país</option>
                            {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className={`dropdown-group ${!selectedCountry ? 'disabled' : ''}`}>
                        <label>
                            Departamento
                        </label>
                        <select
                            className="form-input"
                            disabled={!selectedCountry}
                            value={selectedDept?.id || ''}
                            onChange={(e) => {
                                const dept = selectedCountry?.departments.find(d => d.id === e.target.value);
                                setSelectedDept(dept || null);
                                setSelectedMuni(null);
                            }}
                        >
                            <option value="">Seleccione un departamento</option>
                            {selectedCountry?.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>

                    <div className={`dropdown-group ${!selectedDept ? 'disabled' : ''}`}>
                        <label>
                            <Navigation size={14} /> Municipio
                        </label>
                        <select
                            className="form-input"
                            disabled={!selectedDept}
                            value={selectedMuni?.id || ''}
                            onChange={(e) => {
                                const muni = selectedDept?.municipalities.find(m => m.id === e.target.value);
                                setSelectedMuni(muni || null);
                            }}
                        >
                            <option value="">Seleccione un municipio</option>
                            {selectedDept?.municipalities.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                </div>

                <button
                    className="launch-btn"
                    disabled={!selectedMuni}
                    onClick={handleSelect}
                >
                    <span>Ir a Ubicación</span>
                    <ChevronRight size={18} />
                </button>
            </div>

            <style>{`
                .location-selector-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: radial-gradient(circle at center, rgba(17, 24, 39, 0.8), #030712);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    backdrop-filter: blur(8px);
                }

                .location-selector-card {
                    position: relative;
                    width: 90%;
                    max-width: 440px;
                    padding: 40px;
                    text-align: center;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    background: rgba(17, 24, 39, 0.85);
                }

                .close-btn {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    background: rgba(255, 255, 255, 0.05);
                    border: none;
                    color: var(--text-muted);
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .close-btn:hover {
                    background: rgba(239, 68, 68, 0.2);
                    color: #fca5a5;
                }

                .icon-badge {
                    width: 56px;
                    height: 56px;
                    background: rgba(139, 92, 246, 0.1);
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 24px;
                }

                .selector-header h2 {
                    font-size: 1.5rem;
                    color: white;
                    margin-bottom: 8px;
                    font-weight: 700;
                }

                .selector-header p {
                    color: var(--text-muted);
                    font-size: 0.9rem;
                    margin-bottom: 32px;
                }

                .selector-body {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    margin-bottom: 32px;
                }

                .dropdown-group {
                    text-align: left;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    transition: opacity 0.3s ease;
                }

                .dropdown-group.disabled {
                    opacity: 0.4;
                    pointer-events: none;
                }

                .dropdown-group label {
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--text-muted);
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-weight: 600;
                }

                .launch-btn {
                    width: 100%;
                    padding: 14px;
                    background: linear-gradient(135deg, #8b5cf6, #6d28d9);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
                }

                .launch-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(139, 92, 246, 0.4);
                    filter: brightness(1.1);
                }

                .launch-btn:disabled {
                    background: #374151;
                    box-shadow: none;
                    cursor: not-allowed;
                    opacity: 0.7;
                }
            `}</style>
        </div>
    );
};

export default LocationSelector;
