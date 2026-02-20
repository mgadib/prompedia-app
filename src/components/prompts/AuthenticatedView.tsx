import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { PromptUI, Tag } from '@/types/prompts';
import { Command } from '@/lib/commands';
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

interface AuthenticatedViewProps {
    userEmail?: string;
    searchText: string;
    onSearchChange: (text: string) => void;
    searchInputRef: React.RefObject<HTMLInputElement>;
    // Editor state
    title: string;
    setTitle: (title: string) => void;
    content: string;
    setContent: (content: string) => void;
    tagsInput: string;
    setTagsInput: (tags: string) => void;
    isPublic: boolean;
    setIsPublic: (isPublic: boolean) => void;
    onSave: () => void;
    onCancel: () => void;
    isEditing: boolean;
    saving: boolean;
    // Filter state
    allUserTags: Tag[];
    selectedTag: string | null;
    onTagFilterChange: (tag: string | null) => void;
    visibilityFilter: 'all' | 'public' | 'private';
    onVisibilityFilterChange: (filter: 'all' | 'public' | 'private') => void;
    // Prompt list
    prompts: PromptUI[];
    isLoading: boolean;
    totalItems: number;
    currentPage: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (items: number) => void;
    editingId: string | null;
    onSelectPrompt: (prompt: PromptUI | null) => void;
    onCopy: (text: string, id?: string) => void;
    onDeleteClick: (id: string) => void;
    onShare: (id: string) => void;
    copiedId?: string | null;
    sharedId?: string | null;
    onEdit: (prompt: PromptUI) => void;
    // Modals
    selectedPrompt: PromptUI | null;
    confirmDeleteId: string | null;
    showLogoutConfirm: boolean;
    showShortcutsHelp: boolean;
    onCloseModals: () => void;
    onLogoutClick: () => void;
    onLogout: () => void;
    onDeleteConfirm: (id: string | null) => void;
    onCloseShortcutsHelp: () => void;
    // Command palette
    commandPalette: {
        isOpen: boolean;
        close: () => void;
        commands: Command[];
    };
    // SEO
    websiteSchema: object;
    currentUserId?: string;
}

const AuthenticatedViewComponent: React.FC<AuthenticatedViewProps> = ({
    userEmail,
    searchText,
    onSearchChange,
    searchInputRef,
    title,
    setTitle,
    content,
    setContent,
    tagsInput,
    setTagsInput,
    isPublic,
    setIsPublic,
    onSave,
    onCancel,
    isEditing,
    saving,
    allUserTags,
    selectedTag,
    onTagFilterChange,
    visibilityFilter,
    onVisibilityFilterChange,
    prompts,
    isLoading,
    totalItems,
    currentPage,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
    editingId,
    onSelectPrompt,
    onCopy,
    onDeleteClick,
    onShare,
    onEdit,
    selectedPrompt,
    confirmDeleteId,
    showLogoutConfirm,
    showShortcutsHelp,
    onCloseModals,
    onLogoutClick,
    onLogout,
    onDeleteConfirm,
    onCloseShortcutsHelp,
    commandPalette,
    websiteSchema,
    currentUserId,
    copiedId,
    sharedId,
}) => {
    const { t } = useTranslation();

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
                                onChange={e => onSearchChange(e.target.value)}
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
                        title={title}
                        setTitle={setTitle}
                        content={content}
                        setContent={setContent}
                        tagsInput={tagsInput}
                        setTagsInput={setTagsInput}
                        isPublic={isPublic}
                        setIsPublic={setIsPublic}
                        onSave={onSave}
                        onCancel={onCancel}
                        isEditing={isEditing}
                        saving={saving}
                    />

                    <MobileFilterButton
                        tags={allUserTags}
                        currentFilter={selectedTag || ''}
                        onFilterChange={(tag) => onTagFilterChange(tag || null)}
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
                                    onClick={() => onVisibilityFilterChange('all')}
                                >
                                    {t('list.all')}
                                </button>
                                <button
                                    className={cn(
                                        "px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                                        visibilityFilter === 'public' ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                    )}
                                    onClick={() => onVisibilityFilterChange('public')}
                                >
                                    {t('prompt.public')}
                                </button>
                                <button
                                    className={cn(
                                        "px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                                        visibilityFilter === 'private' ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                    )}
                                    onClick={() => onVisibilityFilterChange('private')}
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
                    onFilterChange={(tag) => onTagFilterChange(tag || null)}
                />
            </div>

            <Footer />

            {selectedPrompt && (
                <PromptDetailModal
                    prompt={selectedPrompt}
                    currentUserId={currentUserId}
                    onClose={() => onSelectPrompt(null)}
                    onEdit={onEdit}
                    onCopy={onCopy}
                    onShare={onShare}
                    onDelete={onDeleteClick}
                />
            )}

            <LogoutConfirmModal
                isOpen={showLogoutConfirm}
                onConfirm={onLogout}
                onCancel={onCloseModals}
            />

            <DeleteConfirmModal
                isOpen={!!confirmDeleteId}
                onConfirm={() => onDeleteConfirm(confirmDeleteId)}
                onCancel={onCloseModals}
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
                onClose={onCloseShortcutsHelp}
            />
        </div>
    );
};

export const AuthenticatedView = memo(AuthenticatedViewComponent);
