import React, { useEffect } from 'react';
import { useAuth } from './AuthProvider';

/**
 * AuthGuard: Protege componentes que requieren autenticación.
 * Si no hay token, redirige a /login.
 * Muestra un spinner mientras verifica la sesión.
 */
const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading && !user) {
            window.location.href = '/login';
        }
    }, [user, isLoading]);

    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                width: '100vw',
                background: '#0a0e1a',
                color: '#818cf8',
                flexDirection: 'column',
                gap: '16px',
            }}>
                <div className="login-spinner" style={{
                    width: 36, height: 36,
                    border: '3px solid rgba(99, 102, 241, 0.2)',
                    borderTopColor: '#818cf8',
                    borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite',
                }} />
                <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>Verificando sesión...</span>
            </div>
        );
    }

    if (!user) return null;

    return <>{children}</>;
};

export default AuthGuard;
