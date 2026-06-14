import React from 'react';
import { AuthProvider } from './auth/AuthProvider';
import Header from './Header';

/**
 * HeaderWithAuth: Wraps Header component with AuthProvider.
 * This ensures Header can use the useAuth hook.
 */
const HeaderWithAuth: React.FC = () => {
    return (
        <AuthProvider>
            <Header />
        </AuthProvider>
    );
};

export default HeaderWithAuth;
