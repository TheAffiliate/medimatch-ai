'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { account } from '@/lib/appwrite';
import { Models } from 'appwrite';

interface AuthContextType {
    user: Models.User<Models.Preferences> | null;
    loading: boolean;
    login: (user: Models.User<Models.Preferences>) => void;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>; // This clears the error in Navbar and Register-Doctor
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
    const [loading, setLoading] = useState(true);

    const checkUser = useCallback(async () => {
        try {
            const session = await account.get();
            setUser(session);
        } catch {
            // Variable removed to fix ESLint 'error is defined but never used'
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkUser();
    }, [checkUser]);

    const login = (userData: Models.User<Models.Preferences>) => {
        setUser(userData);
    };

    const logout = async () => {
        try {
            await account.deleteSession('current');
            setUser(null);
        } catch (err) {
            console.error("Logout error:", err);
        }
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            loading, 
            login, 
            logout, 
            refreshUser: checkUser // We map checkUser to the name refreshUser
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};