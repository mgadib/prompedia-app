/**
 * Keyboard shortcut utilities and definitions.
 * Provides functions to parse and match keyboard shortcuts.
 */

export interface ShortcutDefinition {
    id: string;
    keys: string[];
    description: string;
    action: () => void;
    context?: 'editor' | 'global' | 'list';
    preventDefault?: boolean;
}

/**
 * Parse a keyboard event into a normalized key string.
 * Handles platform differences (Mac vs Windows/Linux).
 * Normalizes Meta (Cmd) on Mac to Ctrl for consistency.
 */
export function parseKeyboardEvent(e: KeyboardEvent): string {
    const parts: string[] = [];
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    
    // Modifier keys - normalize Meta (Cmd) on Mac to Ctrl
    if (e.metaKey && isMac) {
        parts.push('Ctrl'); // Normalize Cmd to Ctrl for consistency
    } else if (e.ctrlKey) {
        parts.push('Ctrl');
    }
    
    if (e.altKey) {
        parts.push('Alt');
    }
    
    if (e.shiftKey) {
        parts.push('Shift');
    }
    
    // Main key
    const key = e.key;
    if (key && key.length === 1) {
        // Single character key
        parts.push(key.toUpperCase());
    } else if (key === ' ') {
        parts.push('Space');
    } else if (key === 'Escape' || key === 'Esc') {
        parts.push('Escape');
    } else if (key === 'Enter') {
        parts.push('Enter');
    } else if (key === 'Backspace') {
        parts.push('Backspace');
    } else if (key === 'Delete') {
        parts.push('Delete');
    } else if (key === 'ArrowUp') {
        parts.push('ArrowUp');
    } else if (key === 'ArrowDown') {
        parts.push('ArrowDown');
    } else if (key === 'ArrowLeft') {
        parts.push('ArrowLeft');
    } else if (key === 'ArrowRight') {
        parts.push('ArrowRight');
    } else if (key === '`' || key === 'Backquote') {
        parts.push('`');
    } else if (key.startsWith('F') && key.length <= 3) {
        // Function keys (F1-F12)
        parts.push(key);
    } else {
        // Other special keys - use the key as-is
        parts.push(key);
    }
    
    return parts.join('+');
}

/**
 * Check if a keyboard event matches a shortcut definition.
 */
export function matchesShortcut(e: KeyboardEvent, shortcut: ShortcutDefinition): boolean {
    const eventKey = parseKeyboardEvent(e);
    const shortcutKey = shortcut.keys.join('+');
    
    // Normalize for comparison (case-insensitive, order-independent for modifiers)
    const normalize = (str: string) => {
        const parts = str.split('+').map(p => p.trim().toUpperCase());
        // Put non-modifier keys last, modifiers first
        const modifiers = ['CTRL', 'META', 'ALT', 'SHIFT'];
        const modifierParts = parts.filter(p => modifiers.includes(p));
        const keyParts = parts.filter(p => !modifiers.includes(p));
        // Sort modifiers consistently, then add key parts
        const sortedModifiers = modifierParts.sort((a, b) => {
            const order = ['CTRL', 'META', 'ALT', 'SHIFT'];
            return order.indexOf(a) - order.indexOf(b);
        });
        return [...sortedModifiers, ...keyParts].join('+');
    };
    
    return normalize(eventKey) === normalize(shortcutKey);
}

/**
 * Get display string for a shortcut (platform-aware).
 */
export function getShortcutDisplay(keys: string[]): string {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    
    return keys.map(key => {
        if (key === 'Meta' && isMac) {
            return '⌘';
        } else if (key === 'Ctrl') {
            return isMac ? '⌃' : 'Ctrl';
        } else if (key === 'Alt') {
            return isMac ? '⌥' : 'Alt';
        } else if (key === 'Shift') {
            return isMac ? '⇧' : 'Shift';
        } else if (key === ' ') {
            return 'Space';
        } else if (key.length === 1) {
            return key.toUpperCase();
        }
        return key;
    }).join(isMac ? '' : '+');
}

/**
 * Check if we should handle a shortcut (not in input/textarea/contenteditable).
 */
export function shouldHandleShortcut(e: KeyboardEvent): boolean {
    const target = e.target as HTMLElement;
    if (!target) return true;
    
    // Don't handle shortcuts when typing in inputs
    const tagName = target.tagName.toLowerCase();
    if (tagName === 'input' && (target as HTMLInputElement).type !== 'checkbox' && (target as HTMLInputElement).type !== 'radio') {
        return false;
    }
    if (tagName === 'textarea') {
        return false;
    }
    if (target.isContentEditable) {
        return false;
    }
    
    return true;
}
