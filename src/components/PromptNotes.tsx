import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useIdleLogout } from '@/hooks/use-idle-logout';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';

// Hooks
import { useAuth } from '@/hooks/use-auth';
import { usePublicPrompts } from '@/hooks/use-public-prompts';
import { usePromptMutations } from '@/hooks/use-prompt-mutations';
import { usePrompts } from '@/hooks/use-prompts';
import { useCommandPalette } from '@/hooks/use-command-palette';
import { useGlobalShortcuts, ShortcutDefinition } from '@/hooks/use-keyboard-shortcuts';

// Types
import { PromptUI, Tag } from '@/types/prompts';

// Components
import { AuthScreen } from '@/components/auth/AuthScreen';
import { PromptList } from '@/components/prompts/PromptList';
import { PromptEditor } from '@/components/prompts/PromptEditor';
import { FilterBar, MobileFilterButton } from '@/components/prompts/FilterBar';
import { PromptDetailModal } from '@/components/prompts/PromptDetailModal';
import { DeleteConfirmModal, LogoutConfirmModal } from '@/components/prompts/ConfirmModals';
import { CommandPalette } from '@/components/command-palette/CommandPalette';
import { ShortcutsHelpDialog } from '@/components/command-palette/ShortcutsHelpDialog';
import { TagChip } from '@/components/ui/tag-chip';
import { SEO } from '@/components/SEO';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';

type VisibilityFilter = 'all' | 'public' | 'private';

const PromptNotes = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { theme, setTheme } = useTheme();
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

    // Auth
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

    // Public Landing Data
    const [selectedPublicTag, setSelectedPublicTag] = useState<string | null>(null);
    const [publicCurrentPage, setPublicCurrentPage] = useState(1);
    const [publicItemsPerPage, setPublicItemsPerPage] = useState(10);

    const {
        prompts: publicPrompts,
        tags: publicTags,
        total: publicTotal,
        isLoading: publicLoading,
    } = usePublicPrompts({
        tag: selectedPublicTag,
        page: publicCurrentPage,
        pageSize: publicItemsPerPage,
        enabled: !user && showAuth,
    });

    // Filter & Pagination State
    const [searchText, setSearchText] = useState('');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('all');
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // Editor & Active Prompt State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tagsInput, setTagsInput] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedPrompt, setSelectedPrompt] = useState<PromptUI | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    // Tags
    const [allUserTags, setAllUserTags] = useState<Tag[]>([]);

    // Queries
    const {
        data: promptsData,
        isLoading: isPromptsLoading,
    } = usePrompts({
        userId: user?.id,
        page: currentPage,
        pageSize: itemsPerPage,
        filterText: searchText,
        filterTag: selectedTag || '',
        visibility: visibilityFilter,
        enabled: !!user,
    });

    const prompts = promptsData?.prompts || [];
    const totalItems = promptsData?.total || 0;

    // Mutations
    const { savePrompt, deletePrompt, loadTags } = usePromptMutations();

    // Side Effects
    useEffect(() => {
        if (!user) {
            setShowAuth(true);
        } else {
            setShowAuth(false);
        }
    }, [user]);

    // Auto-logout setelah 27 menit tidak aktif
    useIdleLogout({
        timeoutMs: 27 * 60 * 1000, // 27 minutes
        onLogout: () => setShowAuth(true),
        enabled: !!user,
    });

    // Load Tags
    useEffect(() => {
        if (user) {
            loadTags(user.id).then(setAllUserTags).catch(console.error);
        }
    }, [user, loadTags]);

    // ========================================
    // CORE HANDLERS - Defined first to avoid temporal dead zone
    // ========================================
    
    const handleSave = useCallback(async () => {
        if (!user || !content.trim()) return;

        try {
            await savePrompt.mutateAsync({
                id: editingId,
                title,
                content,
                tagsInput,
                isPublic,
                userId: user.id,
            });

            toast.success(t('toast.saved'));
            setTitle('');
            setContent('');
            setTagsInput('');
            setIsPublic(false);
            setEditingId(null);
            
            // Reload tags
            const tags = await loadTags(user.id);
            setAllUserTags(tags);
        } catch (err) {
            console.error(err);
            toast.error(t('toast.save_failed'));
        }
    }, [user, title, content, tagsInput, isPublic, editingId, savePrompt, loadTags, t]);

    const handleCopy = useCallback(async (text: string) => {
        await navigator.clipboard.writeText(text);
        toast.success(t('toast.copied'));
    }, [t]);

    const handleShare = useCallback(async (id: string) => {
        const url = `${window.location.origin}/share/${id}`;
        await navigator.clipboard.writeText(url);
        toast.success(t('toast.link_copied', 'Link copied to clipboard'));
    }, [t]);

    const handleEdit = useCallback((prompt: PromptUI) => {
        setTitle(prompt.title);
        setContent(prompt.content);
        setTagsInput(prompt.tags.map(t => t.name).join(', '));
        setIsPublic(Boolean(prompt.is_public));
        setEditingId(prompt.id);
        setSelectedPrompt(null);
    }, []);

    // ========================================
    // COMMAND PALETTE HANDLERS
    // ========================================
    
    const handleNewPrompt = useCallback(() => {
        setTitle('');
        setContent('');
        setTagsInput('');
        setIsPublic(false);
        setEditingId(null);
        searchInputRef.current?.focus();
    }, []);

    const handleToggleTheme = useCallback(() => {
        setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark');
    }, [theme, setTheme]);

    const handleShowShortcuts = useCallback(() => {
        setShowShortcutsHelp(true);
    }, []);

    const handleFilterByTag = useCallback((tag: string) => {
        setSelectedTag(tag === selectedTag ? null : tag);
    }, [selectedTag]);

    const handleFilterByVisibility = useCallback((visibility: 'all' | 'public' | 'private') => {
        setVisibilityFilter(visibility);
    }, []);

    const handleFocusSearch = useCallback(() => {
        searchInputRef.current?.focus();
    }, []);

    // ========================================
    // COMMAND PALETTE CONTEXT
    // ========================================
    
    const commandPalette = useCommandPalette({
        navigate: (path: string) => navigate(path),
        onNewPrompt: handleNewPrompt,
        onSavePrompt: handleSave,
        onCopyPrompt: handleCopy,
        onSharePrompt: handleShare,
        onToggleTheme: handleToggleTheme,
        onShowShortcuts: handleShowShortcuts,
        onFilterByTag: handleFilterByTag,
        onFilterByVisibility: handleFilterByVisibility,
        onFocusSearch: handleFocusSearch,
        isEditing: !!editingId,
        currentPrompt: selectedPrompt,
        tags: allUserTags,
        recentPrompts: prompts.slice(0, 5),
    });

    // Close modals handler
    const handleCloseModals = useCallback(() => {
        if (selectedPrompt) setSelectedPrompt(null);
        if (confirmDeleteId) setConfirmDeleteId(null);
        if (showLogoutConfirm) setShowLogoutConfirm(false);
        if (showShortcutsHelp) setShowShortcutsHelp(false);
        if (commandPalette.isOpen) commandPalette.close();
    }, [selectedPrompt, confirmDeleteId, showLogoutConfirm, showShortcutsHelp, commandPalette.isOpen, commandPalette.close]);

    // Global Keyboard Shortcuts
    const globalShortcuts: ShortcutDefinition[] = [
        {
            id: 'open-command-palette',
            keys: ['Ctrl', 'K'],
            description: 'Open command palette',
            action: () => commandPalette.open(),
            context: 'global',
        },
        {
            id: 'new-prompt',
            keys: ['Ctrl', 'N'],
            description: 'Create new prompt',
            action: handleNewPrompt,
            context: 'global',
        },
        {
            id: 'focus-search',
            keys: ['Ctrl', 'F'],
            description: 'Focus search input',
            action: handleFocusSearch,
            context: 'global',
        },
        {
            id: 'save-prompt',
            keys: ['Ctrl', 'S'],
            description: 'Save prompt',
            action: handleSave,
            context: 'global',
        },
        {
            id: 'show-shortcuts',
            keys: ['Ctrl', '/'],
            description: 'Show keyboard shortcuts',
            action: handleShowShortcuts,
            context: 'global',
        },
        {
            id: 'close-modals',
            keys: ['Escape'],
            description: 'Close modals',
            action: handleCloseModals,
            context: 'global',
        },
    ];

    useGlobalShortcuts(globalShortcuts, !!user);

    // Scroll Lock when modal is open
    useEffect(() => {
        const isModalOpen = !!selectedPrompt || !!confirmDeleteId || showLogoutConfirm || commandPalette.isOpen || showShortcutsHelp;
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            if (scrollbarWidth > 0) {
                document.body.style.paddingRight = `${scrollbarWidth}px`;
            }
        } else {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }
        return () => {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        };
    }, [selectedPrompt, confirmDeleteId, showLogoutConfirm, commandPalette.isOpen, showShortcutsHelp]);

    // Handlers
    const handleAuth = async (e: React.FormEvent) => {
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
    };

    const handleLogout = async () => {
        await logout();
        setShowAuth(true);
    };

    const handleDeleteClick = useCallback((id: string) => {
        setConfirmDeleteId(id);
    }, []);

    const performDelete = async (id: string | null) => {
        if (!user || !id) return;

        try {
            await deletePrompt.mutateAsync({ id, userId: user.id });
            toast.success(t('toast.deleted'));
            
            if (editingId === id) {
                setTitle('');
                setContent('');
                setTagsInput('');
                setIsPublic(false);
                setEditingId(null);
            }
            if (selectedPrompt?.id === id) {
                setSelectedPrompt(null);
            }
        } catch (err) {
            console.error(err);
            toast.error(t('toast.delete_failed', 'Failed to delete prompt'));
        }
    };

    // Render Helpers
    const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "prompedia.app",
        "url": "https://prompedia.app/",
        "potentialAction": {
            "@type": "SearchAction",
            "target": "https://prompedia.app/?q={search_term_string}",
            "query-input": "required name=search_term_string"
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground">{t('auth.processing', 'Loading...')}</p>
                </div>
            </div>
        );
    }

    if (showAuth || !user) {
        // Landing Page Mode
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
                                    onSelectPrompt={setSelectedPrompt}
                                    onCopy={handleCopy}
                                    onDeleteClick={() => {}}
                                    onShare={handleShare}
                                    editingId={null}
                                    currentPage={publicCurrentPage}
                                    itemsPerPage={publicItemsPerPage}
                                    totalItems={filteredPublicPrompts.length}
                                    onPageChange={setPublicCurrentPage}
                                    onItemsPerPageChange={setPublicItemsPerPage}
                                    currentUserId={user?.id}
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
                            setAuthError={clearAuthError}
                            authSubmitting={authSubmitting}
                            publicTags={publicTags}
                            selectedPublicTag={selectedPublicTag}
                            setSelectedPublicTag={setSelectedPublicTag}
                            setPublicCurrentPage={setPublicCurrentPage}
                        />
                    </div>
                </div>
                {selectedPrompt && (
                    <PromptDetailModal
                        prompt={selectedPrompt}
                        currentUserId={user?.id}
                        onClose={() => setSelectedPrompt(null)}
                        onCopy={handleCopy}
                        onShare={handleShare}
                    />
                )}
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col relative font-sans">
            <SEO structuredData={websiteSchema} />
            <Header 
                variant="authenticated" 
                userEmail={user?.email} 
                onLogout={() => setShowLogoutConfirm(true)} 
            />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex-1 w-full flex flex-col md:flex-row gap-4 md:gap-6">
                <main className="flex-1 min-w-0">
                    <div className="mb-4 sm:mb-6">
                        <input 
                            ref={searchInputRef}
                            type="text" 
                            value={searchText} 
                            onChange={e => setSearchText(e.target.value)} 
                            placeholder={t('prompt.search_placeholder')} 
                            className="w-full px-3 py-2.5 sm:py-2 bg-card border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-all duration-fast min-h-[44px] sm:min-h-0"
                            aria-label={t('prompt.search_placeholder')}
                        />
                    </div>

                    <PromptEditor
                        title={title}
                        setTitle={setTitle}
                        content={content}
                        setContent={setContent}
                        tagsInput={tagsInput}
                        setTagsInput={setTagsInput}
                        isPublic={isPublic}
                        setIsPublic={setIsPublic}
                        onSave={handleSave}
                        onCancel={() => {
                            setTitle('');
                            setContent('');
                            setTagsInput('');
                            setIsPublic(false);
                            setEditingId(null);
                        }}
                        isEditing={!!editingId}
                        saving={savePrompt.isPending}
                    />

                    <MobileFilterButton
                        tags={allUserTags}
                        currentFilter={selectedTag || ''}
                        onFilterChange={(tag) => setSelectedTag(tag || null)}
                    />

                    <div className="min-h-[50vh]">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-section-title text-foreground">
                                {t('list.title', { count: totalItems })}
                            </h2>
                            <div className="flex gap-2 items-center">
                                <TagChip
                                    variant={visibilityFilter === 'all' ? 'active' : 'outline'}
                                    size="default"
                                    onClick={() => setVisibilityFilter('all')}
                                >
                                    {t('list.all')}
                                </TagChip>
                                <TagChip
                                    variant={visibilityFilter === 'public' ? 'active' : 'outline'}
                                    size="default"
                                    onClick={() => setVisibilityFilter('public')}
                                >
                                    {t('prompt.public')}
                                </TagChip>
                                <TagChip
                                    variant={visibilityFilter === 'private' ? 'active' : 'outline'}
                                    size="default"
                                    onClick={() => setVisibilityFilter('private')}
                                >
                                    {t('prompt.private')}
                                </TagChip>
                            </div>
                        </div>

                        <PromptList
                            prompts={prompts}
                            isLoading={isPromptsLoading}
                            editingId={editingId}
                            onSelectPrompt={setSelectedPrompt}
                            onCopy={handleCopy}
                            onDeleteClick={handleDeleteClick}
                            onShare={handleShare}
                            currentPage={currentPage}
                            itemsPerPage={itemsPerPage}
                            totalItems={totalItems}
                            onPageChange={setCurrentPage}
                            onItemsPerPageChange={setItemsPerPage}
                            currentUserId={user?.id}
                        />
                    </div>
                </main>

                <FilterBar
                    tags={allUserTags}
                    currentFilter={selectedTag || ''}
                    onFilterChange={(tag) => setSelectedTag(tag || null)}
                />
            </div>

            <Footer />

            {selectedPrompt && (
                <PromptDetailModal
                    prompt={selectedPrompt}
                    currentUserId={user?.id}
                    onClose={() => setSelectedPrompt(null)}
                    onEdit={handleEdit}
                    onCopy={handleCopy}
                    onShare={handleShare}
                    onDelete={handleDeleteClick}
                />
            )}

            <LogoutConfirmModal
                isOpen={showLogoutConfirm}
                onConfirm={() => {
                    handleLogout();
                    setShowLogoutConfirm(false);
                }}
                onCancel={() => setShowLogoutConfirm(false)}
            />

            <DeleteConfirmModal
                isOpen={!!confirmDeleteId}
                onConfirm={() => {
                    performDelete(confirmDeleteId);
                    setConfirmDeleteId(null);
                }}
                onCancel={() => setConfirmDeleteId(null)}
            />

            {/* Command Palette */}
            {user && (
                <CommandPalette
                    isOpen={commandPalette.isOpen}
                    onClose={commandPalette.close}
                    commands={commandPalette.commands}
                />
            )}

            {/* Shortcuts Help Dialog */}
            {user && (
                <ShortcutsHelpDialog
                    isOpen={showShortcutsHelp}
                    onClose={() => setShowShortcutsHelp(false)}
                />
            )}
        </div>
    );
};

export default PromptNotes;
