import React, { useState, useEffect } from 'react';
import { Map, Cable, Box, Radio, Layers, Settings, X, Cpu, Activity } from 'lucide-react';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    window.addEventListener('toggle-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-sidebar', handleToggle);
  }, []);

  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';

  const navSections = [
    {
      title: 'Planta Externa',
      items: [
        { name: 'Mapa de Red', icon: <Map size={18} />, href: '/' },
        { name: 'Nodos & NAP', icon: <Radio size={18} />, href: '/nodos' },
        { name: 'Cables & Rutas', icon: <Cable size={18} />, href: '/rutas' },
      ],
    },
    {
      title: 'Inventario Lógico',
      items: [
        { name: 'Splitters', icon: <Layers size={18} />, href: '/splitters' },
        { name: 'Empalmes', icon: <Box size={18} />, href: '/empalmes' },
      ],
    },
    {
      title: 'Administración',
      items: [
        { name: 'Configuración', icon: <Settings size={18} />, href: '/config' },
        { name: 'Estado del Sistema', icon: <Activity size={18} />, href: '/status' },
      ],
    },
  ];

  return (
    <aside className={`sidebar ${!isOpen ? 'mobile-hidden' : ''}`}>
      <button
        className="mobile-only"
        style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', color: 'var(--text-muted)' }}
        onClick={() => setIsOpen(false)}
      >
        <X size={24} />
      </button>

      <div className="logo-container">
        <div className="logo-glow">
          <Cpu size={22} color="white" />
        </div>
        <span className="logo-text">MONITOREO</span>
      </div>

      <nav className="sidebar-nav">
        {navSections.map((section) => (
          <div key={section.title} className="nav-group">
            <div className="nav-label">{section.title}</div>
            {section.items.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`nav-link ${currentPath === item.href ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                {item.icon}
                <span>{item.name}</span>
              </a>
            ))}
          </div>
        ))}
      </nav>

      <div style={{ padding: '0 24px', marginTop: 'auto' }}>
        <div style={{
          padding: '20px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '16px',
          border: '1px solid var(--border)'
        }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>STORAGE USED</p>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ width: '65%', height: '100%', background: 'var(--primary)' }}></div>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-primary)', marginTop: '8px' }}>1.2 GB / 2.0 GB</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
