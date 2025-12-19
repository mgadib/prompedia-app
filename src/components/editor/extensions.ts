import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import Underline from '@tiptap/extension-underline';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import type { Extension } from '@tiptap/core';

// Create lowlight instance with common languages (singleton pattern)
const lowlight = createLowlight(common);

export interface EditorExtensionsOptions {
    placeholder?: string;
}

/**
 * Creates TipTap editor extensions with proper configuration.
 * Best practices:
 * - Disable underline in StarterKit since we add it separately for better control
 * - Use singleton pattern for lowlight instance
 * - Ensure no duplicate extensions
 */
export const createExtensions = (options: EditorExtensionsOptions = {}): Extension[] => {
    const extensions: Extension[] = [
        StarterKit.configure({
            codeBlock: false, // We use CodeBlockLowlight instead for syntax highlighting
            heading: {
                levels: [1, 2, 3, 4, 5, 6],
            },
            // Disable underline in StarterKit to avoid duplicate extension warning
            // We add Underline extension separately for explicit control
            underline: false,
        }),
        Placeholder.configure({
            placeholder: options.placeholder || 'Start writing...',
            emptyEditorClass: 'is-editor-empty',
        }),
        Typography,
        // Add Underline extension explicitly after disabling it in StarterKit
        Underline,
        CodeBlockLowlight.configure({
            lowlight,
            defaultLanguage: 'plaintext',
        }),
    ];

    return extensions;
};

export { lowlight };
