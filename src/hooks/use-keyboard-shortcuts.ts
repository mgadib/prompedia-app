import { useEffect } from 'react';
import { type ShortcutDefinition, matchesShortcut, shouldHandleShortcut } from '@/lib/keyboard-shortcuts';
export type { ShortcutDefinition };

/**
 * Hook for managing keyboard shortcuts.
 * 
 * @param shortcuts - Array of shortcut definitions
 * @param enabled - Whether shortcuts are enabled
 * @param context - Current context (editor, global, list)
 */
export function useKeyboardShortcuts(
    shortcuts: ShortcutDefinition[],
    enabled: boolean = true,
    context?: string
) {
    useEffect(() => {
        if (!enabled) return;

        const handler = (e: KeyboardEvent) => {
            // Filter shortcuts by context if provided
            const contextShortcuts = context
                ? shortcuts.filter(s => !s.context || s.context === context)
                : shortcuts.filter(s => !s.context || s.context === 'global');

            // Check if we should handle this shortcut
            const shouldHandle = contextShortcuts.some(s =>
                s.context === 'editor' || shouldHandleShortcut(e)
            );

            if (!shouldHandle) return;

            // Find matching shortcut
            for (const shortcut of contextShortcuts) {
                if (matchesShortcut(e, shortcut)) {
                    // Check context-specific handling
                    if (shortcut.context === 'editor') {
                        // Editor shortcuts work even in inputs
                        shortcut.action();
                        if (shortcut.preventDefault !== false) {
                            e.preventDefault();
                        }
                        return;
                    } else if (shouldHandleShortcut(e)) {
                        // Global shortcuts only work outside inputs
                        shortcut.action();
                        if (shortcut.preventDefault !== false) {
                            e.preventDefault();
                        }
                        return;
                    }
                }
            }
        };

        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [shortcuts, enabled, context]);
}

/**
 * Hook for editor-specific keyboard shortcuts.
 * These shortcuts work even when typing in the editor.
 */
export function useEditorShortcuts(
    shortcuts: ShortcutDefinition[],
    enabled: boolean = true
) {
    return useKeyboardShortcuts(shortcuts, enabled, 'editor');
}

/**
 * Hook for global keyboard shortcuts.
 * These shortcuts only work when not typing in inputs.
 */
export function useGlobalShortcuts(
    shortcuts: ShortcutDefinition[],
    enabled: boolean = true
) {
    return useKeyboardShortcuts(shortcuts, enabled, 'global');
}
