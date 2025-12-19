import { useState, useCallback, useEffect, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { useTranslation } from 'react-i18next';
import { Eye, Edit3 } from 'lucide-react';
import { createExtensions } from './extensions';
import { EditorToolbar } from './EditorToolbar';
import { MarkdownPreview } from './MarkdownPreview';

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    minHeight?: string;
    disabled?: boolean;
}

/**
 * Converts TipTap JSON to Markdown string
 * This is a simplified conversion - for production, consider using a proper serializer
 */
const editorToMarkdown = (editor: ReturnType<typeof useEditor>): string => {
    if (!editor) return '';

    const json = editor.getJSON();
    return jsonToMarkdown(json);
};

/**
 * Recursively converts TipTap JSON nodes to Markdown
 */
const jsonToMarkdown = (node: Record<string, unknown>): string => {
    if (!node) return '';

    const content = node.content as Record<string, unknown>[] | undefined;

    switch (node.type) {
        case 'doc':
            return content?.map(jsonToMarkdown).join('\n\n') || '';

        case 'paragraph':
            return content?.map(jsonToMarkdown).join('') || '';

        case 'heading': {
            const level = (node.attrs as { level: number })?.level || 1;
            const prefix = '#'.repeat(level);
            const text = content?.map(jsonToMarkdown).join('') || '';
            return `${prefix} ${text}`;
        }

        case 'text': {
            let text = (node.text as string) || '';
            const marks = node.marks as Array<{ type: string }> | undefined;
            if (marks) {
                marks.forEach(mark => {
                    switch (mark.type) {
                        case 'bold':
                            text = `**${text}**`;
                            break;
                        case 'italic':
                            text = `*${text}*`;
                            break;
                        case 'underline':
                            text = `<u>${text}</u>`;
                            break;
                        case 'strike':
                            text = `~~${text}~~`;
                            break;
                        case 'code':
                            text = `\`${text}\``;
                            break;
                    }
                });
            }
            return text;
        }

        case 'bulletList':
            return content?.map(item => `- ${jsonToMarkdown(item)}`).join('\n') || '';

        case 'orderedList':
            return content?.map((item, i) => `${i + 1}. ${jsonToMarkdown(item)}`).join('\n') || '';

        case 'listItem':
            return content?.map(jsonToMarkdown).join('') || '';

        case 'blockquote':
            return content?.map(c => `> ${jsonToMarkdown(c)}`).join('\n') || '';

        case 'codeBlock': {
            const lang = (node.attrs as { language?: string })?.language || '';
            const code = content?.map(c => (c.text as string) || '').join('') || '';
            return `\`\`\`${lang}\n${code}\n\`\`\``;
        }

        case 'horizontalRule':
            return '---';

        case 'hardBreak':
            return '\n';

        default:
            return content?.map(jsonToMarkdown).join('') || '';
    }
};

/**
 * Converts Markdown string to TipTap-compatible HTML
 * Uses a simple approach - TipTap will handle the parsing via StarterKit
 */
const markdownToHtml = (markdown: string): string => {
    if (!markdown) return '<p></p>';

    // Simple conversion for initial content
    // TipTap's paste handler will do more sophisticated parsing
    let html = markdown
        // Code blocks (must be before other patterns)
        .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
            `<pre><code class="language-${lang || 'plaintext'}">${escapeHtml(code.trim())}</code></pre>`
        )
        // Headings
        .replace(/^###### (.+)$/gm, '<h6>$1</h6>')
        .replace(/^##### (.+)$/gm, '<h5>$1</h5>')
        .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        // Blockquotes
        .replace(/^> (.+)$/gm, '<blockquote><p>$1</p></blockquote>')
        // Horizontal rules
        .replace(/^---$/gm, '<hr>')
        // Bold
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // Strikethrough
        .replace(/~~(.+?)~~/g, '<s>$1</s>')
        // Inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Unordered lists
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        // Ordered lists
        .replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

    // Wrap loose text in paragraphs
    const lines = html.split('\n');
    const wrapped = lines.map(line => {
        const trimmed = line.trim();
        if (!trimmed) return '';
        if (trimmed.startsWith('<')) return trimmed;
        return `<p>${trimmed}</p>`;
    });

    return wrapped.filter(Boolean).join('');
};

const escapeHtml = (text: string): string => {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

export const MarkdownEditor = ({
    value,
    onChange,
    placeholder,
    className = '',
    minHeight = '200px',
    disabled = false,
}: MarkdownEditorProps) => {
    const { t } = useTranslation();
    const [isPreview, setIsPreview] = useState(false);

    // Memoize extensions to prevent recreation
    const extensions = useMemo(
        () => createExtensions({ placeholder }),
        [placeholder]
    );

    const editor = useEditor({
        extensions,
        content: markdownToHtml(value),
        editable: !disabled,
        onUpdate: ({ editor }) => {
            const markdown = editorToMarkdown(editor);
            onChange(markdown);
        },
        // Strip external formatting on paste
        editorProps: {
            handlePaste: (view, event) => {
                const text = event.clipboardData?.getData('text/plain');
                if (text && !event.clipboardData?.types.includes('text/html')) {
                    // Plain text paste - let TipTap handle it normally
                    return false;
                }
                // For HTML paste, prefer plain text to strip formatting
                if (text) {
                    event.preventDefault();
                    view.dispatch(view.state.tr.insertText(text));
                    return true;
                }
                return false;
            },
            attributes: {
                class: 'prose-editor outline-none min-h-full',
                style: `min-height: ${minHeight}`,
            },
        },
    });

    // Sync external value changes
    useEffect(() => {
        if (editor && !editor.isFocused) {
            const currentMarkdown = editorToMarkdown(editor);
            if (currentMarkdown !== value) {
                editor.commands.setContent(markdownToHtml(value));
            }
        }
    }, [value, editor]);

    // Update editable state
    useEffect(() => {
        if (editor) {
            editor.setEditable(!disabled);
        }
    }, [disabled, editor]);

    const handleTogglePreview = useCallback(() => {
        setIsPreview(prev => !prev);
    }, []);

    return (
        <div className={`border border-border rounded-lg overflow-hidden bg-card ${className}`}>
            {/* Toolbar */}
            <div className="flex items-center justify-between border-b border-border">
                <EditorToolbar editor={editor} />
                <button
                    type="button"
                    onClick={handleTogglePreview}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    title={isPreview ? t('editor.toggle_edit', 'Edit') : t('editor.toggle_preview', 'Preview')}
                >
                    {isPreview ? (
                        <>
                            <Edit3 className="w-4 h-4" />
                            <span className="hidden sm:inline">{t('editor.toggle_edit', 'Edit')}</span>
                        </>
                    ) : (
                        <>
                            <Eye className="w-4 h-4" />
                            <span className="hidden sm:inline">{t('editor.toggle_preview', 'Preview')}</span>
                        </>
                    )}
                </button>
            </div>

            {/* Content */}
            <div className="p-4" style={{ minHeight }}>
                {isPreview ? (
                    <MarkdownPreview content={value} />
                ) : (
                    <EditorContent editor={editor} />
                )}
            </div>
        </div>
    );
};
