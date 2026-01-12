import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useIdleLogout } from '@/hooks/use-idle-logout';
import { useDebounce } from '@/hooks/use-debounce';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';

// Hooks
import { useAuth } from '@/hooks/use-auth';
import { usePublicPrompts } from '@/hooks/use-public-prompts';
import { usePromptMutations } from '@/hooks/use-prompt-mutations';
import { usePrompts } from '@/hooks/use-prompts';
import { useTags } from '@/hooks/use-tags';
import { useCommandPalette } from '@/hooks/use-command-palette';
import { useGlobalShortcuts, ShortcutDefinition } from '@/hooks/use-keyboard-shortcuts';

// Types
import { PromptUI, Tag } from '@/types/prompts';

// Utils
import { extractErrorMessage } from '@/lib/error-handler';

// Components
import { LandingPage } from '@/components/prompts/LandingPage';
import { AuthenticatedView } from '@/components/prompts/AuthenticatedView';
import { SEO } from '@/components/SEO';

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
    const debouncedSearchText = useDebounce(searchText, 300);
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

    // Tags - use React Query hook for caching
    const { data: allUserTags = [] } = useTags(user?.id);

    // Queries - use debounced search text for API calls
    const {
        data: promptsData,
        isLoading: isPromptsLoading,
    } = usePrompts({
        userId: user?.id,
        page: currentPage,
        pageSize: itemsPerPage,
        filterText: debouncedSearchText,
        filterTag: selectedTag || '',
        visibility: visibilityFilter,
        enabled: !!user,
    });

    const prompts = promptsData?.prompts || [];
    const totalItems = promptsData?.total || 0;

    // Mutations
    const { savePrompt, deletePrompt } = usePromptMutations();

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
        } catch (err) {
            // Structured error logging
            if (import.meta.env.DEV) {
                console.error('Failed to save prompt:', {
                    error: err,
                    message: extractErrorMessage(err),
                    userId: user?.id,
                    editingId,
                });
            }
            toast.error(t('toast.save_failed'));
        }
    }, [user, title, content, tagsInput, isPublic, editingId, savePrompt, t]);

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
        tags: allUserTags as Tag[],
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
            // Structured error logging
            if (import.meta.env.DEV) {
                console.error('Failed to delete prompt:', {
                    error: err,
                    message: extractErrorMessage(err),
                    promptId: id,
                    userId: user?.id,
                });
            }
            toast.error(t('toast.delete_failed', 'Failed to delete prompt'));
        }
    };

    // Render Helpers
    const websiteSchema = useMemo(() => ({
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "prompedia.app",
        "url": "https://prompedia.app/",
        "potentialAction": {
            "@type": "SearchAction",
            "target": "https://prompedia.app/?q={search_term_string}",
            "query-input": "required name=search_term_string"
        }
    }), []);

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
        return (
            <LandingPage
                publicPrompts={publicPrompts}
                publicTags={publicTags}
                publicLoading={publicLoading}
                selectedPublicTag={selectedPublicTag}
                publicCurrentPage={publicCurrentPage}
                publicItemsPerPage={publicItemsPerPage}
                selectedPrompt={selectedPrompt}
                onSelectPrompt={setSelectedPrompt}
                onCopy={handleCopy}
                onShare={handleShare}
                onSetPublicTag={setSelectedPublicTag}
                onSetPublicPage={setPublicCurrentPage}
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
                currentUserId={user?.id}
            />
        );
    }

    return (
        <AuthenticatedView
            userEmail={user?.email}
            searchText={searchText}
            onSearchChange={setSearchText}
            searchInputRef={searchInputRef}
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
            allUserTags={allUserTags as Tag[]}
            selectedTag={selectedTag}
            onTagFilterChange={setSelectedTag}
            visibilityFilter={visibilityFilter}
            onVisibilityFilterChange={setVisibilityFilter}
            prompts={prompts}
            isLoading={isPromptsLoading}
            totalItems={totalItems}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            editingId={editingId}
            onSelectPrompt={setSelectedPrompt}
            onCopy={handleCopy}
            onDeleteClick={handleDeleteClick}
            onShare={handleShare}
            onEdit={handleEdit}
            selectedPrompt={selectedPrompt}
            confirmDeleteId={confirmDeleteId}
            showLogoutConfirm={showLogoutConfirm}
            showShortcutsHelp={showShortcutsHelp}
            onCloseModals={handleCloseModals}
            onLogoutClick={() => setShowLogoutConfirm(true)}
            onLogout={() => {
                handleLogout();
                setShowLogoutConfirm(false);
            }}
            onDeleteConfirm={(id) => {
                performDelete(id);
                setConfirmDeleteId(null);
            }}
            onCloseShortcutsHelp={() => setShowShortcutsHelp(false)}
            commandPalette={commandPalette}
            websiteSchema={websiteSchema}
            currentUserId={user?.id}
        />
    );
};

export default PromptNotes;
