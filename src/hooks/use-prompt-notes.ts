/**
 * Composite hook for PromptNotes page.
 * Encapsulates auth, editor, list, and modal state plus handlers.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useIdleLogout } from '@/hooks/use-idle-logout';
import { useDebounce } from '@/hooks/use-debounce';
import { usePreventDoubleClick } from '@/hooks/use-prevent-double-click';
import { useFormPersistence } from '@/hooks/use-form-persistence';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/use-auth';
import { usePublicPrompts, usePublicTagCounts } from '@/hooks/use-public-prompts';
import { usePromptMutations } from '@/hooks/use-prompt-mutations';
import { usePrompts } from '@/hooks/use-prompts';
import { useTags } from '@/hooks/use-tags';
import { useCommandPalette } from '@/hooks/use-command-palette';
import { useGlobalShortcuts, ShortcutDefinition } from '@/hooks/use-keyboard-shortcuts';
import { PromptUI, Tag } from '@/types/prompts';
import { extractErrorMessage, isErrorCode, ERROR_CODES } from '@/lib/error-handler';
import { logError } from '@/lib/logger';

type VisibilityFilter = 'all' | 'public' | 'private';

export function usePromptNotes() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { theme, setTheme } = useTheme();
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

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

    const [selectedPublicTag, setSelectedPublicTag] = useState<string | null>(null);
    const [publicCurrentPage, setPublicCurrentPage] = useState(1);
    const [publicItemsPerPage, setPublicItemsPerPage] = useState(10);

    const {
        prompts: publicPrompts,
        isLoading: publicLoading,
    } = usePublicPrompts({
        tag: selectedPublicTag,
        page: publicCurrentPage,
        pageSize: publicItemsPerPage,
        enabled: !user && showAuth,
    });
    const { tagCounts: publicTags } = usePublicTagCounts();

    const [searchText, setSearchText] = useState('');
    const debouncedSearchText = useDebounce(searchText, 300);
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('all');
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tagsInput, setTagsInput] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const { clearDraft } = useFormPersistence(
        title,
        content,
        tagsInput,
        isPublic,
        (draft) => {
            if (!editingId) {
                setTitle(draft.title);
                setContent(draft.content);
                setTagsInput(draft.tagsInput);
                setIsPublic(draft.isPublic);
            }
        },
        !editingId && !!user
    );

    const [selectedPrompt, setSelectedPrompt] = useState<PromptUI | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [sharedId, setSharedId] = useState<string | null>(null);

    const { data: allUserTags = [] } = useTags(user?.id);
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
    const { savePrompt, deletePrompt } = usePromptMutations();

    useEffect(() => {
        if (!user) setShowAuth(true);
        else setShowAuth(false);
    }, [user]);

    useIdleLogout({
        timeoutMs: 27 * 60 * 1000,
        onLogout: () => setShowAuth(true),
        enabled: !!user,
    });

    const handleSave = usePreventDoubleClick(
        useCallback(async () => {
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
                clearDraft();
                setTitle('');
                setContent('');
                setTagsInput('');
                setIsPublic(false);
                setEditingId(null);
            } catch (err) {
                logError(err instanceof Error ? err : new Error(extractErrorMessage(err)), {
                    context: 'savePrompt',
                    userId: user?.id,
                    editingId,
                });
                if (isErrorCode(err, ERROR_CODES.CONTENT_REQUIRED)) {
                    toast.error(t('prompt.error.content_required'));
                } else if (isErrorCode(err, ERROR_CODES.VALIDATION_FAILED)) {
                    toast.error(t('prompt.error.validation_failed'));
                } else {
                    toast.error(t('toast.save_failed'));
                }
            }
        }, [user, title, content, tagsInput, isPublic, editingId, savePrompt.mutateAsync, t]),
        1000
    );

    const handleCopy = usePreventDoubleClick(
        useCallback(async (text: string, id?: string) => {
            await navigator.clipboard.writeText(text);
            toast.success(t('toast.copied'));
            if (id) {
                setCopiedId(id);
                setTimeout(() => setCopiedId(null), 2000);
            }
        }, [t]),
        500
    );

    const handleShare = usePreventDoubleClick(
        useCallback(async (id: string) => {
            const url = `${window.location.origin}/share/${id}`;
            await navigator.clipboard.writeText(url);
            toast.success(t('toast.link_copied', 'Link copied to clipboard'));
            setSharedId(id);
            setTimeout(() => setSharedId(null), 2000);
        }, [t]),
        500
    );

    const handleEdit = useCallback((prompt: PromptUI) => {
        setTitle(prompt.title);
        setContent(prompt.content);
        setTagsInput(prompt.tags.map(t => t.name).join(', '));
        setIsPublic(Boolean(prompt.is_public));
        setEditingId(prompt.id);
        setSelectedPrompt(null);
    }, []);

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

    const handleShowShortcuts = useCallback(() => setShowShortcutsHelp(true), []);

    const handleFilterByTag = useCallback((tag: string) => {
        const normalizedTag = tag.toLowerCase();
        const normalizedSelectedTag = selectedTag?.toLowerCase();
        setSelectedTag(normalizedTag === normalizedSelectedTag ? null : tag);
    }, [selectedTag]);

    const handleFilterByVisibility = useCallback((visibility: 'all' | 'public' | 'private') => {
        setVisibilityFilter(visibility);
    }, []);

    const handleFocusSearch = useCallback(() => {
        searchInputRef.current?.focus();
    }, []);

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

    const handleCloseModals = useCallback(() => {
        if (selectedPrompt) setSelectedPrompt(null);
        if (confirmDeleteId) setConfirmDeleteId(null);
        if (showLogoutConfirm) setShowLogoutConfirm(false);
        if (showShortcutsHelp) setShowShortcutsHelp(false);
        if (commandPalette.isOpen) commandPalette.close();
    }, [selectedPrompt, confirmDeleteId, showLogoutConfirm, showShortcutsHelp, commandPalette.isOpen, commandPalette.close]);

    const globalShortcuts: ShortcutDefinition[] = useMemo(() => [
        { id: 'open-command-palette', keys: ['Ctrl', 'K'], description: 'Open command palette', action: () => commandPalette.open(), context: 'global' },
        { id: 'new-prompt', keys: ['Ctrl', 'N'], description: 'Create new prompt', action: handleNewPrompt, context: 'global' },
        { id: 'focus-search', keys: ['Ctrl', 'F'], description: 'Focus search input', action: handleFocusSearch, context: 'global' },
        { id: 'save-prompt', keys: ['Ctrl', 'S'], description: 'Save prompt', action: handleSave, context: 'global' },
        { id: 'show-shortcuts', keys: ['Ctrl', '/'], description: 'Show keyboard shortcuts', action: handleShowShortcuts, context: 'global' },
        { id: 'close-modals', keys: ['Escape'], description: 'Close modals', action: handleCloseModals, context: 'global' },
    ], [commandPalette.open, handleNewPrompt, handleFocusSearch, handleSave, handleShowShortcuts, handleCloseModals]);

    useGlobalShortcuts(globalShortcuts, !!user);

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

    const handleLogoutClick = useCallback(() => setShowLogoutConfirm(true), []);

    const handleLogoutConfirm = useCallback(async () => {
        await handleLogout();
        setShowLogoutConfirm(false);
    }, [handleLogout]);

    const handleDeleteClick = useCallback((id: string) => setConfirmDeleteId(id), []);

    const performDelete = useCallback(async (id: string | null) => {
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
            if (selectedPrompt?.id === id) setSelectedPrompt(null);
        } catch (err) {
            logError(err instanceof Error ? err : new Error(extractErrorMessage(err)), {
                context: 'deletePrompt',
                promptId: id,
                userId: user?.id,
            });
            toast.error(t('toast.delete_failed'));
        }
    }, [user, editingId, selectedPrompt?.id, deletePrompt.mutateAsync, t]);

    const handleDeleteConfirm = useCallback((id: string | null) => {
        performDelete(id);
        setConfirmDeleteId(null);
    }, [performDelete]);

    const handleCloseShortcutsHelp = useCallback(() => setShowShortcutsHelp(false), []);

    const websiteSchema = useMemo(() => ({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'prompedia.app',
        url: 'https://prompedia.app/',
    }), []);

    const onCancelEdit = useCallback(() => {
        if (!editingId) clearDraft();
        setTitle('');
        setContent('');
        setTagsInput('');
        setIsPublic(false);
        setEditingId(null);
    }, [editingId, clearDraft]);

    return {
        authLoading,
        showAuth,
        user,
        authError,
        clearAuthError,
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
        publicPrompts,
        publicTags,
        publicLoading,
        selectedPublicTag,
        setSelectedPublicTag,
        publicCurrentPage,
        setPublicCurrentPage,
        publicItemsPerPage,
        setPublicItemsPerPage,
        selectedPrompt,
        setSelectedPrompt,
        handleAuth,
        handleCopy,
        handleShare,
        handleLogoutClick,
        handleLogoutConfirm,
        searchText,
        setSearchText,
        searchInputRef,
        title,
        setTitle,
        content,
        setContent,
        tagsInput,
        setTagsInput,
        isPublic,
        setIsPublic,
        handleSave,
        onCancelEdit,
        editingId,
        savePrompt,
        allUserTags,
        selectedTag,
        setSelectedTag,
        visibilityFilter,
        setVisibilityFilter,
        prompts,
        isPromptsLoading,
        totalItems,
        currentPage,
        setCurrentPage,
        itemsPerPage,
        setItemsPerPage,
        handleDeleteClick,
        handleShare: handleShare,
        handleEdit,
        copiedId,
        sharedId,
        confirmDeleteId,
        showShortcutsHelp,
        handleCloseModals,
        handleDeleteConfirm,
        handleCloseShortcutsHelp,
        commandPalette,
        websiteSchema,
    };
}
