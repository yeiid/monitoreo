import React, { useState, useEffect } from 'react';
import { Map, Cable, Box, Radio, Layers, Settings, X } from 'lucide-react';

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
        { name: 'Mapa FTTH', icon: <Map size={18} />, href: '/' },
        { name: 'Nodos', icon: <Radio size={18} />, href: '/nodos' },
        { name: 'Cables / Rutas', icon: <Cable size={18} />, href: '/rutas' },
      ],
    },
    {
      title: 'Lógica',
      items: [
        { name: 'Splitters', icon: <Layers size={18} />, href: '/splitters' },
        { name: 'Empalmes', icon: <Box size={18} />, href: '/empalmes' },
      ],
    },
    {
      title: 'Sistema',
      items: [
        { name: 'Configuración', icon: <Settings size={18} />, href: '/config' },
      ],
    },
  ];

  return (
    <div className={`sidebar ${!isOpen ? 'mobile-hidden' : ''}`}>
      <button
        className="mobile-only"
        style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', color: 'var(--text-muted)' }}
        onClick={() => setIsOpen(false)}
      >
        <X size={24} />
      </button>
      <div className="logo-container">
        <div className="logo-icon">
          <Cable size={18} color="white" />
        </div>
        <span className="logo-text">FTTH MAPPER</span>
      </div>

      <nav className="sidebar-nav">
        {navSections.map((section) => (
          <React.Fragment key={section.title}>
            <div className="nav-section-title">{section.title}</div>
            {section.items.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`nav-item ${currentPath === item.href ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                <span className="icon-wrapper">{item.icon}</span>
                <span>{item.name}</span>
              </a>
            ))}
          </React.Fragment>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="avatar">OP</div>
          <div className="user-info">
            <p className="user-name">Operador</p>
            <p className="user-role">Diseño de Red</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
