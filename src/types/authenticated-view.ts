/**
 * Grouped prop types for AuthenticatedView to reduce prop drilling.
 * Single responsibility: each group represents a cohesive slice of state.
 */

import type { PromptUI, Tag } from '@/types/prompts';
import type { Command } from '@/lib/commands';

export interface EditorState {
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
}

export interface FilterState {
    allUserTags: Tag[];
    selectedTag: string | null;
    onTagFilterChange: (tag: string | null) => void;
    visibilityFilter: 'all' | 'public' | 'private';
    onVisibilityFilterChange: (filter: 'all' | 'public' | 'private') => void;
}

export interface ListState {
    prompts: PromptUI[];
    isLoading: boolean;
    totalItems: number;
    currentPage: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (items: number) => void;
    editingId: string | null;
    searchText: string;
    onSearchChange: (text: string) => void;
    searchInputRef: React.RefObject<HTMLInputElement>;
}

export interface ModalState {
    selectedPrompt: PromptUI | null;
    onSelectPrompt: (prompt: PromptUI | null) => void;
    confirmDeleteId: string | null;
    showLogoutConfirm: boolean;
    showShortcutsHelp: boolean;
    onCloseModals: () => void;
    onLogoutClick: () => void;
    onLogout: () => void;
    onDeleteConfirm: (id: string | null) => void;
    onCloseShortcutsHelp: () => void;
}

export interface ListActions {
    onCopy: (text: string, id?: string) => void;
    onShare: (id: string) => void;
    onDeleteClick: (id: string) => void;
    onEdit: (prompt: PromptUI) => void;
    copiedId?: string | null;
    sharedId?: string | null;
}

export interface AuthenticatedViewPropsGrouped {
    userEmail?: string;
    currentUserId?: string;
    editor: EditorState;
    filters: FilterState;
    list: ListState;
    modals: ModalState;
    listActions: ListActions;
    commandPalette: {
        isOpen: boolean;
        close: () => void;
        commands: Command[];
    };
    websiteSchema: object;
}
