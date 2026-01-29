import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CommandPaletteContext, generateCommands } from '@/lib/commands';
import { Command } from '@/lib/commands';

/**
 * Hook for managing command palette state and commands.
 * Commands are memoized to prevent unnecessary regeneration on every render.
 */
export function useCommandPalette(context: CommandPaletteContext) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const open = useCallback(() => {
        setIsOpen(true);
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
    }, []);

    const toggle = useCallback(() => {
        setIsOpen(prev => !prev);
    }, []);

    // Memoize commands generation - only regenerate when context or language changes
    const commands = useMemo(() => {
        return generateCommands(context, t);
    }, [
        t,
        context.navigate,
        context.onNewPrompt,
        context.onSavePrompt,
        context.onDeletePrompt,
        context.onEditPrompt,
        context.onCopyPrompt,
        context.onSharePrompt,
        context.onToggleTheme,
        context.onShowShortcuts,
        context.onFilterByTag,
        context.onFilterByVisibility,
        context.onFocusSearch,
        context.onSearchPrompts,
        context.isEditing,
        context.currentPrompt?.id,
        context.currentPrompt?.is_public,
        // Memoize tags array reference
        context.tags?.length,
        context.tags?.map(t => t.id).join(','),
        // Memoize recent prompts array reference
        context.recentPrompts?.length,
        context.recentPrompts?.map(p => p.id).join(','),
    ]);

    return {
        isOpen,
        open,
        close,
        toggle,
        commands,
    };
}
