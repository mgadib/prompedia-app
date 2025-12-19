import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import Underline from '@tiptap/extension-underline';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';

// Create lowlight instance with common languages
const lowlight = createLowlight(common);

export interface EditorExtensionsOptions {
    placeholder?: string;
}

export const createExtensions = (options: EditorExtensionsOptions = {}) => [
    StarterKit.configure({
        codeBlock: false, // We use CodeBlockLowlight instead
        heading: {
            levels: [1, 2, 3, 4, 5, 6],
        },
    }),
    Placeholder.configure({
        placeholder: options.placeholder || 'Start writing...',
        emptyEditorClass: 'is-editor-empty',
    }),
    Typography,
    Underline,
    CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'plaintext',
    }),
];

export { lowlight };
