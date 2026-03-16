import React from 'react';
import { AuthProvider } from './AuthProvider';
import LoginForm from './LoginForm';

const LoginApp: React.FC = () => {
    return (
        <AuthProvider>
            <LoginForm />
        </AuthProvider>
    );
};

export default LoginApp;
