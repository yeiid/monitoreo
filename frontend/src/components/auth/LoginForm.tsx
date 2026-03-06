import React, { useState } from 'react';
import { useAuth, AuthProvider } from './AuthProvider';

const LoginForm: React.FC = () => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await login(email, password);
        setIsLoading(false);

        if (result.success) {
            window.location.href = '/';
        } else {
            setError(result.error || 'Error desconocido');
        }
    };

    return (
        <div className="login-wrapper">
            <div className="login-card">
                {/* Logo y Título */}
                <div className="login-header">
                    <div className="login-logo">
                        <span className="logo-icon">📡</span>
                        <h1>FTTH Mapper</h1>
                    </div>
                    <p className="login-subtitle">Plataforma de Diseño de Planta Externa</p>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="login-form">
                    {error && (
                        <div className="login-error">
                            <span>⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="email">Correo electrónico</label>
                        <div className="input-wrapper">
                            <span className="input-icon">✉️</span>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="tu@empresa.com"
                                required
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Contraseña</label>
                        <div className="input-wrapper">
                            <span className="input-icon">🔒</span>
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                className="toggle-password"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="login-btn"
                        disabled={isLoading || !email || !password}
                    >
                        {isLoading ? (
                            <span className="login-spinner"></span>
                        ) : (
                            'Iniciar Sesión'
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div className="login-footer">
                    <p>© 2026 FTTH Mapper — Todos los derechos reservados</p>
                </div>
            </div>

            {/* Background decorations */}
            <div className="login-bg-decoration">
                <div className="bg-circle bg-circle-1"></div>
                <div className="bg-circle bg-circle-2"></div>
                <div className="bg-circle bg-circle-3"></div>
            </div>
        </div>
    );
};

export const LoginApp: React.FC = () => {
    return (
        <AuthProvider>
            <LoginForm />
        </AuthProvider>
    );
};

export default LoginForm;

