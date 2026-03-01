import React from 'react';
import { Search, Bell, User, Wifi, Menu } from 'lucide-react';

const Header = () => {
  const toggleSidebar = () => {
    window.dispatchEvent(new CustomEvent('toggle-sidebar'));
  };

  return (
    <header className="header glass-morphism">
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button className="mobile-menu-toggle" onClick={toggleSidebar}>
          <Menu size={20} />
        </button>
        <div className="search-bar desktop-only">
          <Search size={16} className="search-icon" />
          <input type="text" placeholder="Buscar nodos..." />
        </div>
      </div>

      <div className="header-actions">
        <div className="desktop-only" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 14px',
          background: 'rgba(16, 185, 129, 0.1)',
          borderRadius: '10px',
          border: '1px solid rgba(16, 185, 129, 0.15)',
          fontSize: '0.78rem',
          color: 'var(--success)',
          fontWeight: '600',
        }}>
          <Wifi size={14} />
          <span>API Conectada</span>
        </div>
        <div className="divider"></div>
        <button className="icon-btn">
          <Bell size={18} />
          <span className="notification-dot"></span>
        </button>
        <button className="user-btn">
          <User size={16} />
          <span>Admin</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
