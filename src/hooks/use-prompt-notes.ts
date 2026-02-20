/**
 * Composite hook for PromptNotes page.
 * Acts as a coordinator for specialized sub-hooks.
 */

import { useCallback, useRef, useEffect, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { useTags } from '@/hooks/use-tags';
import { useAuthManager } from './use-auth-manager';
import { usePromptEditor } from './use-prompt-editor';
import { usePromptListManager } from './use-prompt-list-manager';
import { useCommandPaletteManager } from './use-command-palette-manager';
import { Tag, PromptUI } from '@/types/prompts';

export function usePromptNotes() {
    const { theme, setTheme } = useTheme();
    const searchInputRef = useRef<HTMLInputElement>(null);

    // 1. Auth Management
    const auth = useAuthManager();

    // 2. List & Data Management
    const list = usePromptListManager(auth.user);

    // 3. Editor Management
    const editor = usePromptEditor(auth.user, searchInputRef);

    // 4. Combined Handlers for coordinating between hooks
    const handleEdit = useCallback((prompt: PromptUI) => {
        editor.handleEdit(prompt);
        list.setSelectedPrompt(null);
    }, [editor.handleEdit, list.setSelectedPrompt]);

    const handleSave = useCallback(async () => {
        await editor.handleSave();
    }, [editor.handleSave]);

    const handleToggleTheme = useCallback(() => {
        setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark');
    }, [theme, setTheme]);

    const handleFocusSearch = useCallback(() => {
        searchInputRef.current?.focus();
    }, []);

    const { data: allUserTags = [] } = useTags(auth.user?.id);

    // 5. Command Palette & Shortcuts
    const { commandPalette, showShortcutsHelp, setShowShortcutsHelp } = useCommandPaletteManager({
        user: auth.user,
        editingId: editor.editingId,
        selectedPrompt: list.selectedPrompt,
        allUserTags: allUserTags as Tag[],
        prompts: list.prompts,
        handleNewPrompt: editor.handleNewPrompt,
        handleSave,
        handleCopy: list.handleCopy,
        handleShare: list.handleShare,
        handleToggleTheme,
        handleShowShortcuts: () => setShowShortcutsHelp(true),
        handleFilterByTag: list.handleFilterByTag,
        handleFilterByVisibility: list.setVisibilityFilter,
        handleFocusSearch,
        handleCloseModals: () => {
            list.setSelectedPrompt(null);
            list.setConfirmDeleteId(null);
            auth.setShowLogoutConfirm(false);
            setShowShortcutsHelp(false);
            if (commandPalette.isOpen) commandPalette.close();
        }
    });

    const handleCloseModals = useCallback(() => {
        if (list.selectedPrompt) list.setSelectedPrompt(null);
        if (list.confirmDeleteId) list.setConfirmDeleteId(null);
        if (auth.showLogoutConfirm) auth.setShowLogoutConfirm(false);
        if (showShortcutsHelp) setShowShortcutsHelp(false);
        if (commandPalette.isOpen) commandPalette.close();
    }, [list, auth, showShortcutsHelp, commandPalette]);

    // Body overflow management
    useEffect(() => {
        const isModalOpen = !!list.selectedPrompt || !!list.confirmDeleteId || auth.showLogoutConfirm || commandPalette.isOpen || showShortcutsHelp;
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
    }, [list.selectedPrompt, list.confirmDeleteId, auth.showLogoutConfirm, commandPalette.isOpen, showShortcutsHelp]);

    const handleDeleteConfirm = useCallback((id: string | null) => {
        list.performDelete(id);
        list.setConfirmDeleteId(null);
        if (editor.editingId === id) {
            editor.onCancelEdit();
        }
    }, [list.performDelete, list.setConfirmDeleteId, editor.editingId, editor.onCancelEdit]);

    const websiteSchema = useMemo(() => ({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'prompedia.app',
        url: 'https://prompedia.app/',
    }), []);

    return {
        // Auth
        authLoading: auth.authLoading,
        showAuth: auth.showAuth,
        user: auth.user,
        authError: auth.authError,
        clearAuthError: auth.clearAuthError,
        email: auth.email,
        setEmail: auth.setEmail,
        password: auth.password,
        setPassword: auth.setPassword,
        displayName: auth.displayName,
        setDisplayName: auth.setDisplayName,
        authSubmitting: auth.authSubmitting,
        authMode: auth.authMode,
        setAuthMode: auth.setAuthMode,
        showLogoutConfirm: auth.showLogoutConfirm,

        // Public List
        publicPrompts: list.publicPrompts,
        publicTags: list.publicTags,
        publicLoading: list.publicLoading,
        selectedPublicTag: list.selectedPublicTag,
        setSelectedPublicTag: list.setSelectedPublicTag,
        publicCurrentPage: list.publicCurrentPage,
        setPublicCurrentPage: list.setPublicCurrentPage,
        publicItemsPerPage: list.publicItemsPerPage,
        setPublicItemsPerPage: list.setPublicItemsPerPage,
        publicTotal: list.publicTotal,

        // Private List
        searchText: list.searchText,
        setSearchText: list.setSearchText,
        selectedTag: list.selectedTag,
        setSelectedTag: list.setSelectedTag,
        visibilityFilter: list.visibilityFilter,
        setVisibilityFilter: list.setVisibilityFilter,
        prompts: list.prompts,
        isPromptsLoading: list.isPromptsLoading,
        totalItems: list.totalItems,
        currentPage: list.currentPage,
        setCurrentPage: list.setCurrentPage,
        itemsPerPage: list.itemsPerPage,
        setItemsPerPage: list.setItemsPerPage,

        // Selection & Actions
        selectedPrompt: list.selectedPrompt,
        setSelectedPrompt: list.setSelectedPrompt,
        confirmDeleteId: list.confirmDeleteId,
        copiedId: list.copiedId,
        sharedId: list.sharedId,
        handleCopy: list.handleCopy,
        handleShare: list.handleShare,
        handleDeleteClick: list.setConfirmDeleteId,
        handleDeleteConfirm,
        handleEdit,

        // Editor
        title: editor.title,
        setTitle: editor.setTitle,
        content: editor.content,
        setContent: editor.setContent,
        tagsInput: editor.tagsInput,
        setTagsInput: editor.setTagsInput,
        isPublic: editor.isPublic,
        setIsPublic: editor.setIsPublic,
        editingId: editor.editingId,
        handleSave,
        onCancelEdit: editor.onCancelEdit,
        savePrompt: editor.savePrompt,

        // Misc
        searchInputRef,
        handleAuth: auth.handleAuth,
        handleLogoutClick: () => auth.setShowLogoutConfirm(true),
        handleLogoutConfirm: auth.handleLogoutConfirm,
        showShortcutsHelp,
        handleCloseModals,
        handleCloseShortcutsHelp: () => setShowShortcutsHelp(false),
        commandPalette,
        allUserTags,
        websiteSchema,
    };
}
