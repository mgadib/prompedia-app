import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
// Note: Underline is included in StarterKit v3+, so we don't need to import it separately
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import type { AnyExtension } from '@tiptap/core';

// Create lowlight instance with common languages (singleton pattern)
const lowlight = createLowlight(common);

// Create extension instances at module level to prevent duplicates
// This ensures extensions are only created once, even in React StrictMode
// CRITICAL: These must be created once at module level to prevent duplicate extension warnings
// 
// Note: In TipTap 3.x, StarterKit includes Underline by default, so we don't need to add it separately
// We disable codeBlock in StarterKit because we use CodeBlockLowlight for syntax highlighting
const starterKitExtension = StarterKit.configure({
    codeBlock: false, // We use CodeBlockLowlight instead for syntax highlighting
    heading: {
        levels: [1, 2, 3, 4, 5, 6],
    },
    // Underline is included in StarterKit v3+, so we don't need to disable it
    // If you need to disable it, use: underline: false
});

// Create singleton extension instances - these are reused across all editor instances
// These instances are created once at module load time and reused for all editor instances
const typographyExtension = Typography;
// Note: Underline is now included in StarterKit v3+, so we don't add it separately
// const underlineExtension = Underline; // REMOVED - already in StarterKit
const codeBlockExtension = CodeBlockLowlight.configure({
    lowlight,
    defaultLanguage: 'plaintext',
});

export interface EditorExtensionsOptions {
    placeholder?: string;
}

/**
 * Creates TipTap editor extensions with proper configuration.
 * 
 * Best practices:
 * - StarterKit v3+ includes Underline by default, so we don't add it separately
 * - Use singleton pattern for extension instances (created at module level)
 * - Placeholder extension is created per-instance since it needs dynamic placeholder text
 * - This prevents duplicate extension warnings in React StrictMode
 * 
 * @param options - Configuration options for extensions
 * @returns Array of TipTap extensions
 */
export const createExtensions = (options: EditorExtensionsOptions = {}): AnyExtension[] => {
    // Only Placeholder needs to be created per-instance (for dynamic placeholder)
    // All other extensions are singleton instances created at module level
    const placeholderExtension = Placeholder.configure({
        placeholder: options.placeholder || 'Start writing...',
        emptyEditorClass: 'is-editor-empty',
    });

    // Return extensions array with singleton instances
    // Order matters: StarterKit first (includes underline), then custom extensions
    return [
        starterKitExtension, // Includes underline in v3+
        placeholderExtension,
        typographyExtension,
        // underlineExtension removed - already in StarterKit v3+
        codeBlockExtension,
    ];
};

export { lowlight };
