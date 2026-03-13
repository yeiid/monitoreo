import React from 'react';
import { AuthProvider } from './auth/AuthProvider';
import AuthGuard from './auth/AuthGuard';
import Header from './Header';
import Sidebar from './Sidebar';
import MapApp from './MapApp';

/**
 * AppShell: Componente raíz que envuelve toda la app en el AuthProvider.
 * Esto permite que Header, Sidebar y MapApp compartan el estado de autenticación.
 */
const AppShell: React.FC = () => {
    return (
        <AuthProvider>
            <AuthGuard>
                <main className="dashboard-container">
                    <Sidebar />
                    <div className="main-content">
                        <Header />
                        <div className="map-full-container">
                            <MapApp />
                        </div>
                    </div>
                </main>
            </AuthGuard>
        </AuthProvider>
    );
};

export default AppShell;
