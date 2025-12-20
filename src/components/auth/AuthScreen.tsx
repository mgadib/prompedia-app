import React from 'react';
import { Button } from '@/components/ui/button';
import { TagChip } from '@/components/ui/tag-chip';
import { useTranslation } from 'react-i18next';

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

    return (
        <aside className="w-full lg:w-72 flex-shrink-0 sticky top-16">
            <div className="bg-card border border-border rounded-sm p-4">
                <form onSubmit={handleAuth} className="space-y-3">
                    {authMode === 'register' && (
                        <div>
                            <label className="block text-caption font-medium text-foreground mb-1">{t('auth.name')}</label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={e => setDisplayName(e.target.value)}
                                required
                                placeholder={t('auth.placeholders.name')}
                                disabled={authSubmitting}
                                className="w-full px-2 py-1.5 bg-background border border-border rounded-sm text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-caption font-medium text-foreground mb-1">{t('auth.email')}</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            placeholder={t('auth.placeholders.email')}
                            disabled={authSubmitting}
                            className="w-full px-2 py-1.5 bg-background border border-border rounded-sm text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                        />
                    </div>
                    <div>
                        <label className="block text-caption font-medium text-foreground mb-1">{t('auth.password')}</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            placeholder={t('auth.placeholders.password')}
                            disabled={authSubmitting}
                            className="w-full px-2 py-1.5 bg-background border border-border rounded-sm text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                        />
                    </div>
                    {authError && <p className="text-caption text-destructive">{authError}</p>}
                    <Button type="submit" variant="brand" className="w-full" disabled={authSubmitting}>
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
            <div className="bg-card border border-border rounded-sm p-4 mt-4">
                <h2 className="text-sm font-semibold text-foreground mb-3 pb-2 border-b border-border">{t('landing.public_tags_title')}</h2>
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
                    <p className="text-body text-muted-foreground">{t('landing.no_public_tags')}</p>
                )}
            </div>
        </aside>
    );
};
