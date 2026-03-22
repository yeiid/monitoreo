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
        { name: 'Mapa de Red', icon: <Map size={18} strokeWidth={2.5} />, href: '/' },
        { name: 'Nodos & NAP', icon: <Radio size={18} strokeWidth={2.5} />, href: '/nodos' },
        { name: 'Cables & Rutas', icon: <Cable size={18} strokeWidth={2.5} />, href: '/rutas' },
      ],
    },
    {
      title: 'Inventario Lógico',
      items: [
        { name: 'Splitters', icon: <Layers size={18} strokeWidth={2.5} />, href: '/splitters' },
        { name: 'Empalmes', icon: <Box size={18} strokeWidth={2.5} />, href: '/empalmes' },
      ],
    },
    {
      title: 'Administración',
      items: [
        { name: 'Configuración', icon: <Settings size={18} strokeWidth={2.5} />, href: '/config' },
        { name: 'Estado del Sistema', icon: <Activity size={18} strokeWidth={2.5} />, href: '/status' },
      ],
    },
  ];

  return (
    <>
      {isOpen && <div className="sidebar-overlay mobile-only" onClick={() => setIsOpen(false)} />}
      <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
        <button
          className="mobile-only btn btn-glass"
          style={{ position: 'absolute', top: '24px', right: '24px', padding: '8px', zIndex: 100 }}
          onClick={() => setIsOpen(false)}
        >
          <X size={20} />
        </button>

      <div className="logo-container animate-in">
        <div className="logo-glow">
          <Cpu size={24} color="#fff" strokeWidth={2} />
        </div>
        <span className="logo-text">MONITOREO</span>
      </div>

      <nav className="sidebar-nav" style={{ animationDelay: '0.1s' }}>
        {navSections.map((section, idx) => (
          <div key={section.title} className="nav-group animate-in" style={{ animationDelay: `${0.15 + (idx * 0.1)}s` }}>
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

      <div className="animate-in" style={{ padding: '0 16px', marginTop: 'auto', animationDelay: '0.4s' }}>
        <div style={{
          padding: '20px',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)'
        }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px', letterSpacing: '0.1em' }}>STORAGE USAGE</p>
          <div style={{ height: '8px', background: 'rgba(0,0,0,0.5)', borderRadius: '10px', overflow: 'hidden', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)' }}>
            <div style={{ width: '65%', height: '100%', background: 'var(--primary-gradient)', borderRadius: '10px', boxShadow: '0 0 10px var(--primary-glow)' }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
             <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>1.2 GB</p>
             <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>2.0 GB Limit</p>
          </div>
        </div>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
