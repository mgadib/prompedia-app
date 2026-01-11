import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { TagChip } from '@/components/ui/tag-chip';
import { useTranslation } from 'react-i18next';

// Password strength calculation
const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

    if (score <= 1) return { score, label: 'Weak', color: 'bg-destructive' };
    if (score <= 2) return { score, label: 'Fair', color: 'bg-yellow-500' };
    if (score <= 3) return { score, label: 'Good', color: 'bg-blue-500' };
    return { score, label: 'Strong', color: 'bg-green-500' };
};

interface AuthScreenProps {
    handleAuth: (e: React.FormEvent) => void;
    authMode: 'login' | 'register';
    setAuthMode: (mode: 'login' | 'register') => void;
    displayName: string;
    setDisplayName: (name: string) => void;
    email: string;
    setEmail: (email: string) => void;
    password: string;
    setPassword: (password: string) => void;
    authError: string;
    setAuthError: (error: string) => void;
    authSubmitting: boolean;
    publicTags: { name: string; count: number }[];
    selectedPublicTag: string | null;
    setSelectedPublicTag: (tag: string | null) => void;
    setPublicCurrentPage: (page: number) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
    handleAuth,
    authMode,
    setAuthMode,
    displayName,
    setDisplayName,
    email,
    setEmail,
    password,
    setPassword,
    authError,
    setAuthError,
    authSubmitting,
    publicTags,
    selectedPublicTag,
    setSelectedPublicTag,
    setPublicCurrentPage,
}) => {
    const { t } = useTranslation();

    // Password validation for registration
    const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
    const isPasswordValid = password.length >= 8;
    const showPasswordWarning = authMode === 'register' && password.length > 0 && !isPasswordValid;

    return (
        <aside className="w-full lg:w-72 flex-shrink-0 lg:sticky lg:top-16">
            <div className="bg-card border border-border rounded shadow-sm p-4 sm:p-5">
                <form onSubmit={handleAuth} className="space-y-4">
                    {authMode === 'register' && (
                        <div>
                            <label className="block text-caption font-medium text-foreground mb-2">{t('auth.name')}</label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={e => setDisplayName(e.target.value)}
                                required
                                placeholder={t('auth.placeholders.name')}
                                disabled={authSubmitting}
                                autoComplete="name"
                                className="w-full px-3 py-2.5 sm:py-2 bg-background border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:opacity-50 transition-all duration-fast min-h-[44px] sm:min-h-0"
                                aria-label={t('auth.name')}
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-caption font-medium text-foreground mb-2">{t('auth.email')}</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            placeholder={t('auth.placeholders.email')}
                            disabled={authSubmitting}
                            autoComplete="email"
                            className="w-full px-3 py-2.5 sm:py-2 bg-background border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:opacity-50 transition-all duration-fast min-h-[44px] sm:min-h-0"
                            aria-label={t('auth.email')}
                        />
                    </div>
                    <div>
                        <label className="block text-caption font-medium text-foreground mb-2">{t('auth.password')}</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            minLength={8}
                            placeholder={t('auth.placeholders.password')}
                            disabled={authSubmitting}
                            autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                            className="w-full px-3 py-2.5 sm:py-2 bg-background border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:opacity-50 transition-all duration-fast min-h-[44px] sm:min-h-0"
                            aria-label={t('auth.password')}
                        />
                        {/* Password strength indicator for registration */}
                        {authMode === 'register' && password.length > 0 && (
                            <div className="mt-2">
                                <div className="flex gap-1 mb-1">
                                    {[1, 2, 3, 4].map((level) => (
                                        <div
                                            key={level}
                                            className={`h-1 flex-1 rounded-full transition-colors ${passwordStrength.score >= level ? passwordStrength.color : 'bg-muted'
                                                }`}
                                        />
                                    ))}
                                </div>
                                <p className={`text-2xs ${showPasswordWarning ? 'text-destructive' : 'text-muted-foreground'}`}>
                                    {showPasswordWarning
                                        ? t('auth.error.password_min_length')
                                        : `Password strength: ${passwordStrength.label}`
                                    }
                                </p>
                            </div>
                        )}
                    </div>
                    {authError && <p className="text-caption text-destructive">{authError}</p>}
                    <Button
                        type="submit"
                        variant="brand"
                        className="w-full"
                        disabled={authSubmitting || (authMode === 'register' && !isPasswordValid)}
                    >
                        {authSubmitting ? t('auth.processing') : (authMode === 'login' ? t('auth.login') : t('auth.register'))}
                    </Button>
                </form>
                <div className="mt-3 text-center">
                    <p className="text-caption text-muted-foreground">
                        {authMode === 'login' ? t('auth.no_account') : t('auth.have_account')}{' '}
                        <button
                            onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }}
                            className="text-brand hover:underline font-medium"
                        >
                            {authMode === 'login' ? t('auth.switch_to_register') : t('auth.switch_to_login')}
                        </button>
                    </p>
                </div>
            </div>

            {/* Public Tags Section */}
            <div className="bg-card border border-border rounded shadow-sm p-4 sm:p-5 mt-4 sm:mt-6">
                <h2 className="text-sm font-semibold text-foreground mb-4 pb-3 border-b border-border">{t('landing.public_tags_title')}</h2>
                {publicTags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        <TagChip
                            variant={selectedPublicTag === null ? 'active' : 'default'}
                            size="default"
                            onClick={() => { setSelectedPublicTag(null); setPublicCurrentPage(1); }}
                        >
                            {t('list.all')}
                        </TagChip>
                        {publicTags.map(tag => (
                            <TagChip
                                key={tag.name}
                                variant={selectedPublicTag === tag.name ? 'active' : 'default'}
                                size="default"
                                onClick={() => { setSelectedPublicTag(tag.name); setPublicCurrentPage(1); }}
                            >
                                {tag.name}
                            </TagChip>
                        ))}
                    </div>
                ) : (
                    <div className="py-4 text-center">
                        <p className="text-sm text-muted-foreground">{t('landing.no_public_tags')}</p>
                    </div>
                )}
            </div>
        </aside>
    );
};
