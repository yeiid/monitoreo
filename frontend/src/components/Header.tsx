import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Wifi, Menu, LogOut, ShieldCheck, User, MapPin, Box, X } from 'lucide-react';
import { useAuth } from './auth/AuthProvider';
import { apiFetch } from '../utils/apiFetch';
import { API_BASE } from './map/types';

interface SearchResult {
  id: string;
  name: string;
  node_type: string;
  location?: { lat: number; lng: number };
}

const Header = () => {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

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

  // ── Search logic ──
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (value.trim().length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await apiFetch(`${API_BASE}/nodes`);
        if (res.ok) {
          const nodes: SearchResult[] = await res.json();
          const q = value.toLowerCase();
          const filtered = nodes.filter(
            (n) =>
              n.name.toLowerCase().includes(q) ||
              n.node_type.toLowerCase().includes(q) ||
              (n.location && `${n.location.lat}`.includes(q)) ||
              (n.location && `${n.location.lng}`.includes(q))
          );
          setSearchResults(filtered.slice(0, 8));
          setShowSearchDropdown(true);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const handleSelectResult = (node: SearchResult) => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchDropdown(false);
    if (node.location) {
      localStorage.setItem(
        'ftth_center_on_node',
        JSON.stringify({ id: node.id, lng: node.location.lng, lat: node.location.lat })
      );
      window.location.href = '/';
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const nodeIcons: Record<string, string> = {
    OLT: '📡', MUFLA: '🔶', CAJA_NAP: '📦', CLIENTE_ONU: '🏠', ODF: '⚙️',
  };

  return (
    <header className="header animate-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <button className="mobile-only btn btn-glass" style={{ padding: '8px' }} onClick={toggleSidebar}>
          <Menu size={20} />
        </button>
        <div className="search-wrapper desktop-only" ref={searchRef} style={{ position: 'relative' }}>
          <Search size={18} className="search-icon" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar nodos, coordenadas o clientes..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
          />
          {showSearchDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '8px',
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              zIndex: 100,
              maxHeight: '320px',
              overflowY: 'auto',
              padding: '6px',
            }}>
              {searching ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Buscando...
                </div>
              ) : searchResults.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Sin resultados para "{searchQuery}"
                </div>
              ) : (
                searchResults.map((node) => (
                  <div
                    key={node.id}
                    onClick={() => handleSelectResult(node)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ fontSize: '1.1rem' }}>{nodeIcons[node.node_type] || '📍'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: 'white', fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {node.name}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                        {node.node_type}
                        {node.location && ` · ${node.location.lat.toFixed(4)}, ${node.location.lng.toFixed(4)}`}
                      </div>
                    </div>
                    <MapPin size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div className="desktop-only" style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 16px', background: 'rgba(16, 185, 129, 0.1)',
          borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.2)',
          fontSize: '0.8rem', color: 'var(--success)', fontWeight: '700',
          boxShadow: '0 0 15px rgba(16, 185, 129, 0.1)',
        }}>
          <Wifi size={16} strokeWidth={2.5} />
          <span>Sincronizado</span>
        </div>

        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            className="btn btn-glass desktop-only"
            style={{ padding: '10px', position: 'relative', borderRadius: 'var(--radius-md)' }}
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={20} />
            <span style={{
              position: 'absolute', top: '6px', right: '6px',
              width: '10px', height: '10px', background: 'var(--primary)',
              borderRadius: '50%', border: '2px solid var(--bg-header)',
              boxShadow: '0 0 8px var(--primary-glow)',
            }} />
          </button>
          {showNotifications && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              width: '280px', background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid var(--border)', borderRadius: '12px',
              backdropFilter: 'blur(20px)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              zIndex: 100, padding: '16px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: 700, color: 'white', fontSize: '0.9rem' }}>Notificaciones</span>
                <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}>
                  <X size={16} />
                </button>
              </div>
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                <Bell size={24} style={{ marginBottom: '8px', opacity: 0.4 }} />
                <div>Sin notificaciones nuevas</div>
              </div>
            </div>
          )}
        </div>

        <div className="desktop-only" style={{ width: '1px', height: '32px', background: 'var(--border)' }}></div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '14px', padding: '6px',
          background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
        }}>
          <div className="desktop-only" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', paddingLeft: '12px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white', lineHeight: '1.2' }}>
              {user?.full_name || 'Operador'}
            </span>
            <span style={{ fontSize: '0.7rem', color: roleInfo.color, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {roleInfo.label}
            </span>
          </div>
          <div style={{
            width: '40px', height: '40px', background: roleInfo.bg,
            borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${roleInfo.color}`,
          }}>
            {user?.role === 'super_admin' ? <ShieldCheck size={22} color={roleInfo.color} strokeWidth={2} /> : <User size={22} color={roleInfo.color} strokeWidth={2} />}
          </div>
          <button
            className="btn btn-glass"
            style={{ padding: '10px', color: 'var(--error)' }}
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
