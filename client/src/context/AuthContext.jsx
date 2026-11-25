import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        checkAuth();
    }, []);



    const checkAuth = async () => {
        const maxAttempts = 2;
        try {
            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

                try {
                    const response = await fetch(`${API_URL}/auth/user`, {
                        credentials: 'include',
                        signal: controller.signal,
                    });
                    clearTimeout(timeoutId);

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }

                    const data = await response.json();
                    if (data.success && data.user) {
                        setUser(data.user);
                    }
                    return;
                } catch (error) {
                    clearTimeout(timeoutId);
                    if (attempt === maxAttempts) {
                        console.error('Auth check failed:', error);
                    }
                }
            }
        } finally {
            setLoading(false);
        }
    };


    const login = () => {
        window.location.href = `${API_URL}/auth/google`;
    };

    const logout = async () => {
        try {
            await fetch(`${API_URL}/auth/logout`, {
                credentials: 'include',
            });
            setUser(null);
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const value = {
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
