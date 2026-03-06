import React from 'react';
import { Search, Bell, User, Wifi, Menu, LogOut } from 'lucide-react';
import { useAuth } from './auth/AuthProvider';

const Header = () => {
  const { user, logout } = useAuth();

  const toggleSidebar = () => {
    window.dispatchEvent(new CustomEvent('toggle-sidebar'));
  };

  // Determinar el badge del rol
  const getRoleBadge = () => {
    if (!user) return null;
    const roleLabels: Record<string, { label: string; color: string }> = {
      super_admin: { label: 'Super Admin', color: '#ef4444' },
      org_admin: { label: 'Administrador', color: '#6366f1' },
      technician: { label: 'Técnico', color: '#10b981' },
    };
    const role = roleLabels[user.role] || { label: user.role, color: '#64748b' };
    return (
      <span style={{
        fontSize: '0.68rem',
        padding: '2px 8px',
        borderRadius: '6px',
        background: `${role.color}20`,
        color: role.color,
        fontWeight: 600,
        border: `1px solid ${role.color}30`,
      }}>
        {role.label}
      </span>
    );
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

        {/* User info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '4px 8px 4px 12px',
          borderRadius: '10px',
          background: 'rgba(255,255,255,0.04)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0' }}>
              {user?.full_name || 'Usuario'}
            </span>
            {getRoleBadge()}
          </div>
          <button
            className="user-btn"
            onClick={logout}
            title="Cerrar sesión"
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
