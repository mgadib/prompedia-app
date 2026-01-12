import React from 'react';
import { useTranslation } from 'react-i18next';
import { PromptUI } from '@/types/prompts';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { PromptList } from '@/components/prompts/PromptList';
import { PromptDetailModal } from '@/components/prompts/PromptDetailModal';
import { TagWithCount } from '@/types/prompts';

interface LandingPageProps {
    publicPrompts: PromptUI[];
    publicTags: TagWithCount[];
    publicLoading: boolean;
    selectedPublicTag: string | null;
    publicCurrentPage: number;
    publicItemsPerPage: number;
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
    setAuthError: () => void;
    authSubmitting: boolean;
    currentUserId?: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({
    publicPrompts,
    publicTags,
    publicLoading,
    selectedPublicTag,
    publicCurrentPage,
    publicItemsPerPage,
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

    const filteredPublicPrompts = selectedPublicTag
        ? publicPrompts.filter(p => p.tags.some(t => t.name === selectedPublicTag))
        : publicPrompts;
    const paginatedPublicPrompts = filteredPublicPrompts.slice(
        (publicCurrentPage - 1) * publicItemsPerPage,
        publicCurrentPage * publicItemsPerPage
    );

    return (
        <div className="min-h-screen bg-background font-sans flex flex-col">
            <Header variant="default" />
            <div className="max-w-6xl mx-auto px-4 py-4 flex-1 w-full">
                <div className="flex flex-col lg:flex-row gap-4 items-start">
                    <div className="flex-1 w-full min-w-0">
                        <div className="mb-6">
                            <div className="bg-card border-2 border-primary/30 dark:border-primary/20 rounded shadow-sm p-4 sm:p-5">
                                <p className="text-sm sm:text-base text-foreground leading-relaxed">
                                    {t('app.description')}
                                </p>
                            </div>
                        </div>
                        <section className="min-h-[50vh]">
                            <h2 className="text-section-title text-foreground mb-4">
                                {t('landing.recent_prompts_title')}
                            </h2>
                            <PromptList
                                prompts={paginatedPublicPrompts}
                                isLoading={publicLoading}
                                onSelectPrompt={onSelectPrompt}
                                onCopy={onCopy}
                                onDeleteClick={() => {}}
                                onShare={onShare}
                                editingId={null}
                                currentPage={publicCurrentPage}
                                itemsPerPage={publicItemsPerPage}
                                totalItems={filteredPublicPrompts.length}
                                onPageChange={onSetPublicPage}
                                onItemsPerPageChange={() => {}}
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
                    onClose={() => onSelectPrompt(null)}
                    onCopy={onCopy}
                    onShare={onShare}
                />
            )}
            <Footer />
        </div>
    );
};
