import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { useTranslation } from 'react-i18next';
import { Eye, Edit3 } from 'lucide-react';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';
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

        case 'table': {
            const rows = content || [];
            const mdRows: string[] = [];
            rows.forEach((row, rowIdx) => {
                const cells = (row.content as Record<string, unknown>[]) || [];
                const cellTexts = cells.map(cell => {
                    const text = jsonToMarkdown(cell).trim();
                    return text.replace(/\|/g, '\\|').replace(/\n/g, ' ');
                });
                mdRows.push('| ' + cellTexts.join(' | ') + ' |');
                if (rowIdx === 0) {
                    mdRows.push('| ' + cellTexts.map(() => '---').join(' | ') + ' |');
                }
            });
            return mdRows.join('\n');
        }

        case 'tableHeader':
        case 'tableCell':
            return content?.map(jsonToMarkdown).join('') || '';

        default:
            return content?.map(jsonToMarkdown).join('') || '';
    }
};

const markdownProcessor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: false })
    .use(rehypeKatex)
    .use(rehypeStringify);

/**
 * Converts Markdown string to TipTap-compatible HTML using unified pipeline.
 * Supports GFM (tables, etc.), LaTeX math, code blocks with language.
 */
const markdownToHtml = async (markdown: string): Promise<string> => {
    if (!markdown || !markdown.trim()) return '<p></p>';

    try {
        const result = await markdownProcessor.process(markdown);
        return String(result);
    } catch {
        return '<p></p>';
    }
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

    // Memoize extensions to prevent recreation and avoid duplicate extension warnings
    // This ensures extensions are only created once per placeholder change
    // Critical: Prevents TipTap duplicate extension warnings in React StrictMode
    const extensions = useMemo(
        () => createExtensions({ placeholder }),
        [placeholder]
    );

    // Memoize onChange callback to prevent editor recreation
    const handleUpdate = useCallback(
        ({ editor }: { editor: ReturnType<typeof useEditor> }) => {
            const markdown = editorToMarkdown(editor);
            onChange(markdown);
        },
        [onChange]
    );

    // Create editor instance with stable configuration
    // useEditor handles its own memoization internally based on extensions array reference
    // Setting immediatelyRender: false helps prevent duplicate extension warnings in React StrictMode
    // Content is set asynchronously via useEffect (markdownToHtml is async)
    const editor = useEditor({
        extensions,
        content: '<p></p>',
        editable: !disabled,
        immediatelyRender: false, // Defer rendering to prevent duplicate extensions in StrictMode
        onUpdate: handleUpdate,
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

    // Sync external value changes (only when editor is not focused to avoid conflicts)
    // Use cancelled flag to prevent race condition when value changes rapidly
    useEffect(() => {
        if (!editor) return;
        let cancelled = false;

        const applyContent = async () => {
            if (!editor.isFocused) {
                const currentMarkdown = editorToMarkdown(editor);
                if (currentMarkdown !== value) {
                    const html = await markdownToHtml(value);
                    if (!cancelled && !editor.isDestroyed) {
                        editor.commands.setContent(html);
                    }
                }
            }
        };

        applyContent();
        return () => {
            cancelled = true;
        };
    }, [value, editor]);

    // Cleanup editor on unmount to prevent memory leaks
    useEffect(() => {
        return () => {
            if (editor) {
                editor.destroy();
            }
        };
    }, [editor]);

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
        <div className={`border border-border rounded-sm overflow-hidden bg-card ${className}`}>
            {/* Toolbar */}
            <div className="flex items-center justify-between border-b border-border">
                <EditorToolbar editor={editor} />
                <button
                    type="button"
                    onClick={handleTogglePreview}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-colors duration-fast ease-default rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
                        isPreview 
                            ? 'text-brand bg-action-secondary' 
                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                    title={isPreview ? t('editor.toggle_edit', 'Edit') : t('editor.toggle_preview', 'Preview')}
                    aria-label={isPreview ? t('editor.toggle_edit', 'Edit') : t('editor.toggle_preview', 'Preview')}
                >
                    {isPreview ? (
                        <>
                            <Edit3 className="w-4 h-4" aria-hidden="true" />
                            <span className="hidden sm:inline">{t('editor.toggle_edit', 'Edit')}</span>
                        </>
                    ) : (
                        <>
                            <Eye className="w-4 h-4" aria-hidden="true" />
                            <span className="hidden sm:inline">{t('editor.toggle_preview', 'Preview')}</span>
                        </>
                    )}
                </button>
            </div>

            {/* Content */}
            <div 
                className={`p-3 ${isPreview ? 'bg-surface-subtle border-l-2 border-l-brand/20' : 'bg-card'}`} 
                style={{ minHeight }}
            >
                {isPreview ? (
                    <MarkdownPreview content={value} />
                ) : (
                    <EditorContent editor={editor} />
                )}
            </div>
        </div>
    );
};
