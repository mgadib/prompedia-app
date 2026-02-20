import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { useCommandPalette } from '@/hooks/use-command-palette';
import { useGlobalShortcuts, type ShortcutDefinition } from '@/hooks/use-keyboard-shortcuts';
import { PromptUI, Tag } from '@/types/prompts';

interface CommandPaletteManagerOptions {
    user: User | null;
    editingId: string | null;
    selectedPrompt: PromptUI | null;
    allUserTags: Tag[];
    prompts: PromptUI[];
    handleNewPrompt: () => void;
    handleSave: () => Promise<void>;
    handleCopy: (text: string, id?: string) => Promise<void>;
    handleShare: (id: string) => Promise<void>;
    handleToggleTheme: () => void;
    handleShowShortcuts: () => void;
    handleFilterByTag: (tag: string) => void;
    handleFilterByVisibility: (visibility: 'all' | 'public' | 'private') => void;
    handleFocusSearch: () => void;
    handleCloseModals: () => void;
}

export function useCommandPaletteManager(options: CommandPaletteManagerOptions) {
    const navigate = useNavigate();
    const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

    const commandPalette = useCommandPalette({
        navigate: (path: string) => navigate(path),
        onNewPrompt: options.handleNewPrompt,
        onSavePrompt: options.handleSave,
        onCopyPrompt: options.handleCopy,
        onSharePrompt: options.handleShare,
        onToggleTheme: options.handleToggleTheme,
        onShowShortcuts: options.handleShowShortcuts,
        onFilterByTag: options.handleFilterByTag,
        onFilterByVisibility: options.handleFilterByVisibility,
        onFocusSearch: options.handleFocusSearch,
        isEditing: !!options.editingId,
        currentPrompt: options.selectedPrompt,
        tags: options.allUserTags,
        recentPrompts: options.prompts.slice(0, 5),
    });

    const globalShortcuts: ShortcutDefinition[] = useMemo(() => [
        { id: 'open-command-palette', keys: ['Ctrl', 'K'], description: 'Open command palette', action: () => commandPalette.open(), context: 'global' },
        { id: 'new-prompt', keys: ['Ctrl', 'N'], description: 'Create new prompt', action: options.handleNewPrompt, context: 'global' },
        { id: 'focus-search', keys: ['Ctrl', 'F'], description: 'Focus search input', action: options.handleFocusSearch, context: 'global' },
        { id: 'save-prompt', keys: ['Ctrl', 'S'], description: 'Save prompt', action: options.handleSave, context: 'global' },
        { id: 'show-shortcuts', keys: ['Ctrl', '/'], description: 'Show keyboard shortcuts', action: options.handleShowShortcuts, context: 'global' },
        { id: 'close-modals', keys: ['Escape'], description: 'Close modals', action: options.handleCloseModals, context: 'global' },
    ], [commandPalette.open, options.handleNewPrompt, options.handleFocusSearch, options.handleSave, options.handleShowShortcuts, options.handleCloseModals]);

    useGlobalShortcuts(globalShortcuts, !!options.user);

    return {
        commandPalette,
        showShortcutsHelp,
        setShowShortcutsHelp,
    };
}
