import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../map/types';

// ── Types ──
interface AuthUser {
    id: string;
    email: string;
    full_name: string;
    role: 'super_admin' | 'org_admin' | 'technician';
    organization_id: string | null;
}

interface AuthContextType {
    user: AuthUser | null;
    token: string | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ── Provider ──
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Restaurar sesión desde localStorage
    useEffect(() => {
        const savedToken = localStorage.getItem('ftth_token');
        const savedUser = localStorage.getItem('ftth_user');
        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }
        setIsLoading(false);
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({ detail: 'Error de conexión' }));
                return { success: false, error: err.detail || 'Credenciales inválidas' };
            }

            const data = await res.json();
            setToken(data.access_token);
            setUser(data.user);
            localStorage.setItem('ftth_token', data.access_token);
            localStorage.setItem('ftth_user', JSON.stringify(data.user));
            return { success: true };
        } catch {
            return { success: false, error: 'No se pudo conectar al servidor' };
        }
    }, []);

    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('ftth_token');
        localStorage.removeItem('ftth_user');
        window.location.href = '/login';
    }, []);

    // Fetch wrapper que inyecta el JWT automáticamente
    const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
        const headers = new Headers(options.headers);
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        if (!headers.has('Content-Type') && options.body) {
            headers.set('Content-Type', 'application/json');
        }

        const res = await fetch(url, { ...options, headers });

        // Si el token expiró, cerrar sesión
        if (res.status === 401) {
            logout();
        }

        return res;
    }, [token, logout]);

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, logout, authFetch }}>
            {children}
        </AuthContext.Provider>
    );
};

// ── Hook ──
export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        // Durante SSR o build, si no hay contexto, devolvemos un objeto seguro para evitar que el build explote
        if (typeof window === 'undefined') {
            return {
                user: null,
                token: null,
                isLoading: false,
                login: async () => ({ success: false }),
                logout: () => { },
                authFetch: async () => new Response()
            } as AuthContextType;
        }
        throw new Error('useAuth debe usarse dentro de un AuthProvider');
    }
    return ctx;
};

export default AuthProvider;
