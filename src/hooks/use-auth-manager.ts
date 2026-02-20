import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/use-auth';
import { useIdleLogout } from '@/hooks/use-idle-logout';
import { toast } from 'sonner';

export function useAuthManager() {
    const { t } = useTranslation();
    const {
        user,
        loading: authLoading,
        error: authError,
        login,
        register,
        logout,
        clearError: clearAuthError,
    } = useAuth();

    const [showAuth, setShowAuth] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [authSubmitting, setAuthSubmitting] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    useEffect(() => {
        if (!user) setShowAuth(true);
        else setShowAuth(false);
    }, [user]);

    useIdleLogout({
        timeoutMs: 27 * 60 * 1000,
        onLogout: () => setShowAuth(true),
        enabled: !!user,
    });

    const handleAuth = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        clearAuthError();
        setAuthSubmitting(true);
        try {
            if (authMode === 'login') {
                const result = await login(email, password);
                if (result.success) {
                    setEmail('');
                    setPassword('');
                }
            } else {
                const result = await register(email, password, displayName);
                if (result.success) {
                    toast.success(t('toast.registration_success'));
                    setAuthMode('login');
                }
            }
        } finally {
            setAuthSubmitting(false);
        }
    }, [authMode, email, password, displayName, login, register, clearAuthError, t]);

    const handleLogout = useCallback(async () => {
        await logout();
        setShowAuth(true);
    }, [logout]);

    const handleLogoutConfirm = useCallback(async () => {
        await handleLogout();
        setShowLogoutConfirm(false);
    }, [handleLogout]);

    return {
        user,
        authLoading,
        authError,
        showAuth,
        setShowAuth,
        email,
        setEmail,
        password,
        setPassword,
        displayName,
        setDisplayName,
        authSubmitting,
        authMode,
        setAuthMode,
        showLogoutConfirm,
        setShowLogoutConfirm,
        handleAuth,
        handleLogout,
        handleLogoutConfirm,
        clearAuthError,
    };
}
