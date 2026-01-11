import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import Underline from '@tiptap/extension-underline';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import type { AnyExtension } from '@tiptap/core';

// Create lowlight instance with common languages (singleton pattern)
const lowlight = createLowlight(common);

// Create extension instances at module level to prevent duplicates
// This ensures extensions are only created once, even in React StrictMode
const starterKitExtension = StarterKit.configure({
    codeBlock: false, // We use CodeBlockLowlight instead for syntax highlighting
    heading: {
        levels: [1, 2, 3, 4, 5, 6],
    },
});

const typographyExtension = Typography;
const underlineExtension = Underline;
const codeBlockExtension = CodeBlockLowlight.configure({
    lowlight,
    defaultLanguage: 'plaintext',
});

export interface EditorExtensionsOptions {
    placeholder?: string;
}

/**
 * Creates TipTap editor extensions with proper configuration.
 * Best practices:
 * - StarterKit does not include Underline by default, so we add it separately
 * - Use singleton pattern for lowlight instance
 * - Create extension instances at module level to prevent duplicates in React StrictMode
 */
export const createExtensions = (options: EditorExtensionsOptions = {}): AnyExtension[] => {
    const extensions: AnyExtension[] = [
        starterKitExtension,
        Placeholder.configure({
            placeholder: options.placeholder || 'Start writing...',
            emptyEditorClass: 'is-editor-empty',
        }),
        typographyExtension,
        underlineExtension,
        codeBlockExtension,
    ];

    return extensions;
};

export { lowlight };
