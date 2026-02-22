import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { usePromptNotes } from '@/hooks/use-prompt-notes';
import { LandingPage } from '@/components/prompts/LandingPage';
import { AuthenticatedView } from '@/components/prompts/AuthenticatedView';
import { Tag } from '@/types/prompts';

const PromptNotes = () => {
    const { t } = useTranslation();
    const state = usePromptNotes();

    const {
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
        publicItemsPerPage,
        setPublicCurrentPage,
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
    } = state;

    const authenticatedViewProps = useMemo(
        () => ({
            userEmail: user?.email,
            currentUserId: user?.id,
            editor: {
                title,
                setTitle,
                content,
                setContent,
                tagsInput,
                setTagsInput,
                isPublic,
                setIsPublic,
                onSave: handleSave,
                onCancel: onCancelEdit,
                isEditing: !!editingId,
                saving: savePrompt.isPending,
            },
            filters: {
                allUserTags: allUserTags as Tag[],
                selectedTag,
                onTagFilterChange: setSelectedTag,
                visibilityFilter,
                onVisibilityFilterChange: setVisibilityFilter,
            },
            list: {
                prompts,
                isLoading: isPromptsLoading,
                totalItems,
                currentPage,
                itemsPerPage,
                onPageChange: setCurrentPage,
                onItemsPerPageChange: setItemsPerPage,
                editingId,
                searchText,
                onSearchChange: setSearchText,
                searchInputRef,
            },
            modals: {
                selectedPrompt,
                onSelectPrompt: setSelectedPrompt,
                confirmDeleteId,
                showLogoutConfirm,
                showShortcutsHelp,
                onCloseModals: handleCloseModals,
                onLogoutClick: handleLogoutClick,
                onLogout: handleLogoutConfirm,
                onDeleteConfirm: handleDeleteConfirm,
                onCloseShortcutsHelp: handleCloseShortcutsHelp,
            },
            listActions: {
                onCopy: handleCopy,
                onShare: handleShare,
                onDeleteClick: handleDeleteClick,
                onEdit: handleEdit,
                copiedId,
                sharedId,
            },
            commandPalette,
            websiteSchema,
        }),
        [
            user?.email,
            user?.id,
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
            savePrompt.isPending,
            allUserTags,
            selectedTag,
            setSelectedTag,
            visibilityFilter,
            setVisibilityFilter,
            prompts,
            isPromptsLoading,
            totalItems,
            currentPage,
            itemsPerPage,
            setCurrentPage,
            setItemsPerPage,
            selectedPrompt,
            setSelectedPrompt,
            confirmDeleteId,
            showLogoutConfirm,
            showShortcutsHelp,
            handleCloseModals,
            handleLogoutClick,
            handleLogoutConfirm,
            handleDeleteConfirm,
            handleCloseShortcutsHelp,
            handleCopy,
            handleShare,
            handleDeleteClick,
            handleEdit,
            copiedId,
            sharedId,
            commandPalette,
            websiteSchema,
            searchText,
            setSearchText,
        ]
    );

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background animate-fade-in">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                    <p className="text-base font-black text-foreground uppercase tracking-widest animate-pulse font-heading">{t('app.loading')}</p>
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
                publicTotal={state.publicTotal}
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
                setAuthError={(_err) => clearAuthError()}
                authSubmitting={authSubmitting}
                currentUserId={user?.id}
            />
        );
    }

    return <AuthenticatedView {...authenticatedViewProps} />;
};

export default PromptNotes;
