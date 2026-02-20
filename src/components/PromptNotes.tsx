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
            onCancel={onCancelEdit}
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
            copiedId={copiedId}
            sharedId={sharedId}
            selectedPrompt={selectedPrompt}
            confirmDeleteId={confirmDeleteId}
            showLogoutConfirm={showLogoutConfirm}
            showShortcutsHelp={showShortcutsHelp}
            onCloseModals={handleCloseModals}
            onLogoutClick={handleLogoutClick}
            onLogout={handleLogoutConfirm}
            onDeleteConfirm={handleDeleteConfirm}
            onCloseShortcutsHelp={handleCloseShortcutsHelp}
            commandPalette={commandPalette}
            websiteSchema={websiteSchema}
            currentUserId={user?.id}
        />
    );
};

export default PromptNotes;
