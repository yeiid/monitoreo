import React from 'react';
import { Search, Bell, Wifi, Menu, LogOut, ShieldCheck, User } from 'lucide-react';
import { useAuth } from './auth/AuthProvider';

const Header = () => {
  const { user, logout } = useAuth();

  const toggleSidebar = () => {
    window.dispatchEvent(new CustomEvent('toggle-sidebar'));
  };

  const getRoleInfo = () => {
    if (!user) return { label: 'Invitado', color: 'var(--text-muted)' };
    const roles: Record<string, { label: string; color: string }> = {
      super_admin: { label: 'Super Admin', color: 'var(--olt-color)' },
      org_admin: { label: 'Administrador', color: 'var(--primary)' },
      technician: { label: 'Técnico', color: 'var(--success)' },
    };
    return roles[user.role] || { label: user.role, color: 'var(--text-muted)' };
  };

  const roleInfo = getRoleInfo();

  return (
    <header className="header animate-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="mobile-only btn btn-glass" style={{ padding: '8px' }} onClick={toggleSidebar}>
          <Menu size={20} />
        </button>
        <div className="search-wrapper desktop-only">
          <Search size={16} className="search-icon" style={{ color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Buscar nodos, cables o clientes..." />
        </div>
      </div>

      <div className="header-actions">
        <div className="desktop-only" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 14px',
          background: 'rgba(16, 185, 129, 0.08)',
          borderRadius: '12px',
          border: '1px solid rgba(16, 185, 129, 0.15)',
          fontSize: '0.8rem',
          color: 'var(--success)',
          fontWeight: '600',
        }}>
          <Wifi size={14} />
          <span>Sincronizado</span>
        </div>

        <button className="btn btn-glass" style={{ padding: '10px', position: 'relative' }}>
          <Bell size={18} />
          <span style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '8px',
            height: '8px',
            background: 'var(--primary)',
            borderRadius: '50%',
            border: '2px solid var(--bg-header)'
          }}></span>
        </button>

        <div className="divider"></div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '4px 4px 4px 16px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '14px',
          border: '1px solid var(--border)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white' }}>
              {user?.full_name || 'Operador'}
            </span>
            <span style={{ fontSize: '0.7rem', color: roleInfo.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {roleInfo.label}
            </span>
          </div>
          <div style={{
            width: '36px',
            height: '36px',
            background: `linear-gradient(135deg, ${roleInfo.color}, transparent)`,
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            {user?.role === 'super_admin' ? <ShieldCheck size={20} color="white" /> : <User size={20} color="white" />}
          </div>
          <button
            className="btn btn-glass"
            style={{ padding: '8px', color: 'var(--error)' }}
            onClick={logout}
            title="Cerrar sesión"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
