import React from 'react';
import { Search, Bell, Wifi, Menu, LogOut, ShieldCheck, User } from 'lucide-react';
import { useAuth } from './auth/AuthProvider';

const Header = () => {
  const { user, logout } = useAuth();

  const toggleSidebar = () => {
    window.dispatchEvent(new CustomEvent('toggle-sidebar'));
  };

  const getRoleInfo = () => {
    if (!user) return { label: 'Invitado', color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.05)' };
    const roles: Record<string, { label: string; color: string; bg: string }> = {
      super_admin: { label: 'Super Admin', color: 'var(--primary)', bg: 'rgba(157, 78, 221, 0.15)' },
      org_admin: { label: 'Administrador', color: 'var(--secondary)', bg: 'rgba(0, 245, 212, 0.15)' },
      technician: { label: 'Técnico', color: 'var(--success)', bg: 'rgba(16, 185, 129, 0.15)' },
    };
    return roles[user.role] || { label: user.role, color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.05)' };
  };

  const roleInfo = getRoleInfo();

  return (
    <header className="header animate-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <button className="mobile-only btn btn-glass" style={{ padding: '8px' }} onClick={toggleSidebar}>
          <Menu size={20} />
        </button>
        <div className="search-wrapper desktop-only">
          <Search size={18} className="search-icon" style={{ color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Buscar nodos, coordenadas o clientes..." />
        </div>
      </div>

      <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div className="desktop-only" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: 'rgba(16, 185, 129, 0.1)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          fontSize: '0.8rem',
          color: 'var(--success)',
          fontWeight: '700',
          boxShadow: '0 0 15px rgba(16, 185, 129, 0.1)'
        }}>
          <Wifi size={16} strokeWidth={2.5} />
          <span>Sincronizado</span>
        </div>

        <button className="btn btn-glass" style={{ padding: '10px', position: 'relative', borderRadius: 'var(--radius-md)' }}>
          <Bell size={20} />
          <span style={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            width: '10px',
            height: '10px',
            background: 'var(--primary)',
            borderRadius: '50%',
            border: '2px solid var(--bg-header)',
            boxShadow: '0 0 8px var(--primary-glow)'
          }}></span>
        </button>

        <div style={{ width: '1px', height: '32px', background: 'var(--border)' }}></div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '6px 6px 6px 18px',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white', lineHeight: '1.2' }}>
              {user?.full_name || 'Operador'}
            </span>
            <span style={{ fontSize: '0.7rem', color: roleInfo.color, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {roleInfo.label}
            </span>
          </div>
          <div style={{
            width: '40px',
            height: '40px',
            background: roleInfo.bg,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${roleInfo.color}`
          }}>
            {user?.role === 'super_admin' ? <ShieldCheck size={22} color={roleInfo.color} strokeWidth={2} /> : <User size={22} color={roleInfo.color} strokeWidth={2} />}
          </div>
          <button
            className="btn btn-glass"
            style={{ padding: '10px', color: 'var(--error)', marginLeft: '4px' }}
            onClick={logout}
            title="Cerrar sesión"
          >
            <LogOut size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
