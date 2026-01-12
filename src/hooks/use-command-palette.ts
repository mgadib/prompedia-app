import { useState, useCallback } from 'react';
import { CommandPaletteContext, generateCommands } from '@/lib/commands';
import { Command } from '@/lib/commands';

/**
 * Hook for managing command palette state and commands.
 */
export function useCommandPalette(context: CommandPaletteContext) {
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

    // Generate commands based on current context
    const commands = generateCommands(context);

    return {
        isOpen,
        open,
        close,
        toggle,
        commands,
    };
}
