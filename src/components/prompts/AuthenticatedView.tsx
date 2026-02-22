import React, { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { PromptUI } from '@/types/prompts';
import type { AuthenticatedViewPropsGrouped } from '@/types/authenticated-view';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PromptEditor } from '@/components/prompts/PromptEditor';
import { PromptList } from '@/components/prompts/PromptList';
import { FilterBar, MobileFilterButton } from '@/components/prompts/FilterBar';
import { PromptDetailModal } from '@/components/prompts/PromptDetailModal';
import { DeleteConfirmModal, LogoutConfirmModal } from '@/components/prompts/ConfirmModals';
import { CommandPalette } from '@/components/command-palette/CommandPalette';
import { ShortcutsHelpDialog } from '@/components/command-palette/ShortcutsHelpDialog';
import { SEO } from '@/components/SEO';
import { Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const AuthenticatedViewComponent: React.FC<AuthenticatedViewPropsGrouped> = ({
    userEmail,
    currentUserId,
    editor,
    filters,
    list,
    modals,
    listActions,
    commandPalette,
    websiteSchema,
}) => {
    const {
        searchText,
        onSearchChange,
        searchInputRef,
        prompts,
        isLoading,
        totalItems,
        currentPage,
        itemsPerPage,
        onPageChange,
        onItemsPerPageChange,
        editingId,
    } = list;
    const { allUserTags, selectedTag, onTagFilterChange, visibilityFilter, onVisibilityFilterChange } = filters;
    const {
        selectedPrompt,
        onSelectPrompt,
        confirmDeleteId,
        showLogoutConfirm,
        showShortcutsHelp,
        onCloseModals,
        onLogoutClick,
        onLogout,
        onDeleteConfirm,
        onCloseShortcutsHelp,
    } = modals;
    const { onCopy, onShare, onDeleteClick, onEdit, copiedId, sharedId } = listActions;
    const { t } = useTranslation();

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        onSearchChange(e.target.value);
    }, [onSearchChange]);

    const handleTagFilterChange = useCallback((tag: string | null) => {
        onTagFilterChange(tag);
    }, [onTagFilterChange]);

    const handleVisibilityFilterAll = useCallback(() => onVisibilityFilterChange('all'), [onVisibilityFilterChange]);
    const handleVisibilityFilterPublic = useCallback(() => onVisibilityFilterChange('public'), [onVisibilityFilterChange]);
    const handleVisibilityFilterPrivate = useCallback(() => onVisibilityFilterChange('private'), [onVisibilityFilterChange]);

    const handlePromptDetailClose = useCallback(() => onSelectPrompt(null), [onSelectPrompt]);

    const handleLogoutConfirmModal = useCallback(() => onLogout(), [onLogout]);
    const handleLogoutCancel = useCallback(() => onCloseModals(), [onCloseModals]);

    const handleDeleteConfirmAction = useCallback(() => onDeleteConfirm(confirmDeleteId), [onDeleteConfirm, confirmDeleteId]);
    const handleDeleteCancel = useCallback(() => onCloseModals(), [onCloseModals]);

    const handleShortcutsHelpClose = useCallback(() => onCloseShortcutsHelp(), [onCloseShortcutsHelp]);

    return (
        <div className="min-h-screen bg-background flex flex-col relative font-sans">
            <SEO structuredData={websiteSchema} />
            <Header
                variant="authenticated"
                userEmail={userEmail}
                onLogout={onLogoutClick}
            />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex-1 w-full flex flex-col md:flex-row gap-4 md:gap-6">
                <main className="flex-1 min-w-0">
                    <div className="mb-6 sm:mb-8 transition-all duration-300 group">
                        <div className="relative">
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchText}
                                onChange={handleSearchChange}
                                placeholder={t('prompt.search_placeholder')}
                                className="w-full pl-11 pr-10 py-3.5 sm:py-3 bg-card/60 backdrop-blur-sm border border-border rounded-xl text-base sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/40 transition-all shadow-sm group-hover:shadow-md"
                                aria-label={t('prompt.search_placeholder')}
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                <Search className="w-5 h-5 sm:w-4 h-4" />
                            </div>
                            {isLoading && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                </div>
                            )}
                        </div>
                    </div>

                    <PromptEditor
                        title={editor.title}
                        setTitle={editor.setTitle}
                        content={editor.content}
                        setContent={editor.setContent}
                        tagsInput={editor.tagsInput}
                        setTagsInput={editor.setTagsInput}
                        isPublic={editor.isPublic}
                        setIsPublic={editor.setIsPublic}
                        onSave={editor.onSave}
                        onCancel={editor.onCancel}
                        isEditing={editor.isEditing}
                        saving={editor.saving}
                    />

                    <MobileFilterButton
                        tags={allUserTags}
                        currentFilter={selectedTag || ''}
                        onFilterChange={handleTagFilterChange}
                    />

                    <div className="min-h-[50vh] mt-12">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <h2 className="text-2xl font-black text-foreground italic uppercase tracking-tight">
                                {t('list.title', { count: totalItems })}
                            </h2>
                            <div className="flex bg-secondary/50 p-1 rounded-xl w-fit border border-border/50 glass">
                                <button
                                    className={cn(
                                        "px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                                        visibilityFilter === 'all' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                    )}
                                    onClick={handleVisibilityFilterAll}
                                >
                                    {t('list.all')}
                                </button>
                                <button
                                    className={cn(
                                        "px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                                        visibilityFilter === 'public' ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                    )}
                                    onClick={handleVisibilityFilterPublic}
                                >
                                    {t('prompt.public')}
                                </button>
                                <button
                                    className={cn(
                                        "px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                                        visibilityFilter === 'private' ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                    )}
                                    onClick={handleVisibilityFilterPrivate}
                                >
                                    {t('prompt.private')}
                                </button>
                            </div>
                        </div>

                        <PromptList
                            prompts={prompts}
                            isLoading={isLoading}
                            editingId={editingId}
                            onSelectPrompt={onSelectPrompt}
                            onCopy={onCopy}
                            onDeleteClick={onDeleteClick}
                            onShare={onShare}
                            currentPage={currentPage}
                            itemsPerPage={itemsPerPage}
                            totalItems={totalItems}
                            onPageChange={onPageChange}
                            onItemsPerPageChange={onItemsPerPageChange}
                            currentUserId={currentUserId}
                            copiedId={copiedId}
                            sharedId={sharedId}
                        />
                    </div>
                </main>

                <FilterBar
                    tags={allUserTags}
                    currentFilter={selectedTag || ''}
                    onFilterChange={handleTagFilterChange}
                />
            </div>

            <Footer />

            {selectedPrompt && (
                <PromptDetailModal
                    prompt={selectedPrompt}
                    currentUserId={currentUserId}
                    onClose={handlePromptDetailClose}
                    onEdit={onEdit}
                    onCopy={onCopy}
                    onShare={onShare}
                    onDelete={onDeleteClick}
                />
            )}

            <LogoutConfirmModal
                isOpen={showLogoutConfirm}
                onConfirm={handleLogoutConfirmModal}
                onCancel={handleLogoutCancel}
            />

            <DeleteConfirmModal
                isOpen={!!confirmDeleteId}
                onConfirm={handleDeleteConfirmAction}
                onCancel={handleDeleteCancel}
            />

            {/* Command Palette */}
            <CommandPalette
                isOpen={commandPalette.isOpen}
                onClose={commandPalette.close}
                commands={commandPalette.commands}
            />

            {/* Shortcuts Help Dialog */}
            <ShortcutsHelpDialog
                isOpen={showShortcutsHelp}
                onClose={handleShortcutsHelpClose}
            />
        </div>
    );
};

export const AuthenticatedView = memo(AuthenticatedViewComponent);
