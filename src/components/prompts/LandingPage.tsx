import React, { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { PromptUI } from '@/types/prompts';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { PromptList } from '@/components/prompts/PromptList';
import { PromptDetailModal } from '@/components/prompts/PromptDetailModal';
import { TagWithCount } from '@/types/prompts';
import { FileText, Search, Share2 } from 'lucide-react';

interface LandingPageProps {
    publicPrompts: PromptUI[];
    publicTags: TagWithCount[];
    publicLoading: boolean;
    selectedPublicTag: string | null;
    publicCurrentPage: number;
    publicItemsPerPage: number;
    publicTotal: number;
    selectedPrompt: PromptUI | null;
    onSelectPrompt: (prompt: PromptUI | null) => void;
    onCopy: (text: string) => void;
    onShare: (id: string) => void;
    onSetPublicTag: (tag: string | null) => void;
    onSetPublicPage: (page: number) => void;
    // Auth props
    handleAuth: (e: React.FormEvent) => void;
    authMode: 'login' | 'register';
    setAuthMode: (mode: 'login' | 'register') => void;
    displayName: string;
    setDisplayName: (name: string) => void;
    email: string;
    setEmail: (email: string) => void;
    password: string;
    setPassword: (password: string) => void;
    authError: string | null;
    setAuthError: (error: string) => void;
    authSubmitting: boolean;
    currentUserId?: string;
}

// LandingPage is memoized to prevent unnecessary re-renders when parent states change
export const LandingPage: React.FC<LandingPageProps> = memo(({
    publicPrompts,
    publicTags,
    publicLoading,
    selectedPublicTag,
    publicCurrentPage,
    publicItemsPerPage,
    publicTotal, // Added this prop to interface in a bit
    selectedPrompt,
    onSelectPrompt,
    onCopy,
    onShare,
    onSetPublicTag,
    onSetPublicPage,
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
    currentUserId,
}) => {
    const { t } = useTranslation();

    const handleCloseDetail = useCallback(() => onSelectPrompt(null), [onSelectPrompt]);
    const noop = useCallback(() => {}, []);

    // The filtering and pagination is now handled by the repository/hook (server-side)
    // for significantly better performance with large datasets.

    return (
        <div className="min-h-screen bg-background font-sans flex flex-col">
            <Header variant="default" />
            <div className="max-w-6xl mx-auto px-4 py-4 flex-1 w-full">
                <div className="flex flex-col lg:flex-row gap-4 items-start">
                    <div className="flex-1 w-full min-w-0">
                        <h1 className="sr-only">{t('app.title')} - {t('app.tagline')}</h1>

                        {/* Hero Section */}
                        <div className="mb-10 animate-fade-in">
                            <div className="relative overflow-hidden glass rounded-3xl p-8 sm:p-12 shadow-xl border border-white/20">
                                {/* Decorative Gradient Blobs */}
                                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

                                <div className="relative z-10 max-w-2xl">
                                    <h2 className="text-display sm:text-display font-black text-foreground tracking-tight leading-none mb-8 animate-fade-in-up font-heading">
                                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-orange-500 to-violet-500">
                                            {t('landing.hero_title')}
                                        </span>
                                    </h2>
                                    <p className="text-body-lg sm:text-body-lg text-muted-foreground leading-relaxed mb-10 animate-fade-in-up delay-100 max-w-xl">
                                        {t('app.description')}
                                    </p>
                                    <div className="flex flex-wrap gap-4 animate-fade-in-up delay-200">
                                        <div className="flex items-center gap-2 px-5 py-2.5 bg-background/50 glass rounded-full border border-border/50 text-sm font-bold text-foreground hover:scale-105 transition-transform cursor-default">
                                            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                                            {t('landing.hero_badge_1', 'Markdown Support')}
                                        </div>
                                        <div className="flex items-center gap-2 px-5 py-2.5 bg-background/50 glass rounded-full border border-border/50 text-sm font-bold text-foreground hover:scale-105 transition-transform cursor-default">
                                            <div className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse" />
                                            {t('landing.hero_badge_2', 'Fully Private')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Feature Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 animate-fade-in delay-300">
                            <div className="glass-card rounded-2xl p-7 group hover:-translate-y-2">
                                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-sm group-hover:shadow-primary/20">
                                    <FileText className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="text-card-title font-bold text-foreground mb-3 tracking-tight">{t('landing.feature_1_title', 'Centralized')}</h3>
                                <p className="text-body text-muted-foreground leading-relaxed">{t('landing.feature_1_desc', 'One place for all your prompts across ChatGPT, Claude, and Gemini.')}</p>
                            </div>
                            <div className="glass-card rounded-2xl p-7 group hover:-translate-y-2" style={{ transitionDelay: '50ms' }}>
                                <div className="w-12 h-12 rounded-2xl bg-violet-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-sm group-hover:shadow-violet-500/20">
                                    <Search className="w-6 h-6 text-violet-500" />
                                </div>
                                <h3 className="text-card-title font-bold text-foreground mb-3 tracking-tight">{t('landing.feature_2_title', 'Structured')}</h3>
                                <p className="text-body text-muted-foreground leading-relaxed">{t('landing.feature_2_desc', 'Organize with powerful tagging and find anything instantly with real-time search.')}</p>
                            </div>
                            <div className="glass-card rounded-2xl p-7 group hover:-translate-y-2" style={{ transitionDelay: '100ms' }}>
                                <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-sm group-hover:shadow-green-500/20">
                                    <Share2 className="w-6 h-6 text-green-500" />
                                </div>
                                <h3 className="text-card-title font-bold text-foreground mb-3 tracking-tight">{t('landing.feature_3_title', 'Shareable')}</h3>
                                <p className="text-body text-muted-foreground leading-relaxed">{t('landing.feature_3_desc', 'Easily share your best prompts with the community via public links.')}</p>
                            </div>
                        </div>

                        <section className="min-h-[50vh] animate-fade-in delay-500">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-6 w-1 bg-primary rounded-full" />
                                <h2 className="text-xl font-bold text-foreground tracking-tight">
                                    {t('landing.recent_prompts_title')}
                                </h2>
                            </div>
                            <PromptList
                                prompts={publicPrompts}
                                isLoading={publicLoading}
                                onSelectPrompt={onSelectPrompt}
                                onCopy={onCopy}
                                onDeleteClick={noop}
                                onShare={onShare}
                                editingId={null}
                                currentPage={publicCurrentPage}
                                itemsPerPage={publicItemsPerPage}
                                totalItems={publicTotal}
                                onPageChange={onSetPublicPage}
                                onItemsPerPageChange={noop}
                                currentUserId={currentUserId}
                            />
                        </section>
                    </div>
                    <AuthScreen
                        handleAuth={handleAuth}
                        authMode={authMode}
                        setAuthMode={setAuthMode}
                        displayName={displayName}
                        setDisplayName={setDisplayName}
                        email={email}
                        setEmail={setEmail}
                        password={password}
                        setPassword={setPassword}
                        authError={authError}
                        setAuthError={setAuthError}
                        authSubmitting={authSubmitting}
                        publicTags={publicTags}
                        selectedPublicTag={selectedPublicTag}
                        setSelectedPublicTag={onSetPublicTag}
                        setPublicCurrentPage={onSetPublicPage}
                    />
                </div>
            </div>
            {selectedPrompt && (
                <PromptDetailModal
                    prompt={selectedPrompt}
                    currentUserId={currentUserId}
                    onClose={handleCloseDetail}
                    onCopy={onCopy}
                    onShare={onShare}
                />
            )}
            <Footer />
        </div>
    );
});

LandingPage.displayName = 'LandingPage';
