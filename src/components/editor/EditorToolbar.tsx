import { useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { useTranslation } from 'react-i18next';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Quote,
    Code,
    Code2,
    Minus,
    Table,
} from 'lucide-react';

interface EditorToolbarProps {
    editor: Editor | null;
}

interface ToolbarButtonProps {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    title: string;
    children: React.ReactNode;
}

const ToolbarButton = ({ onClick, isActive, disabled, title, children }: ToolbarButtonProps) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`p-2 rounded transition-colors duration-fast ease-default hover:transition-duration-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${isActive
            ? 'bg-action-secondary text-brand'
            : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
        {children}
    </button>
);

const ToolbarDivider = () => (
    <div className="w-px h-5 bg-border mx-1" />
);

export const EditorToolbar = ({ editor }: EditorToolbarProps) => {
    const { t } = useTranslation();

    const handleBold = useCallback(() => editor?.chain().focus().toggleBold().run(), [editor]);
    const handleItalic = useCallback(() => editor?.chain().focus().toggleItalic().run(), [editor]);
    const handleUnderline = useCallback(() => editor?.chain().focus().toggleUnderline().run(), [editor]);
    const handleStrike = useCallback(() => editor?.chain().focus().toggleStrike().run(), [editor]);
    const handleCode = useCallback(() => editor?.chain().focus().toggleCode().run(), [editor]);
    const handleHeading1 = useCallback(() => editor?.chain().focus().toggleHeading({ level: 1 }).run(), [editor]);
    const handleHeading2 = useCallback(() => editor?.chain().focus().toggleHeading({ level: 2 }).run(), [editor]);
    const handleHeading3 = useCallback(() => editor?.chain().focus().toggleHeading({ level: 3 }).run(), [editor]);
    const handleBulletList = useCallback(() => editor?.chain().focus().toggleBulletList().run(), [editor]);
    const handleOrderedList = useCallback(() => editor?.chain().focus().toggleOrderedList().run(), [editor]);
    const handleBlockquote = useCallback(() => editor?.chain().focus().toggleBlockquote().run(), [editor]);
    const handleCodeBlock = useCallback(() => editor?.chain().focus().toggleCodeBlock().run(), [editor]);
    const handleHorizontalRule = useCallback(() => editor?.chain().focus().setHorizontalRule().run(), [editor]);
    const handleInsertTable = useCallback(() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(), [editor]);

    if (!editor) return null;

    return (
        <div className="flex items-center gap-2 px-2 py-1.5 bg-surface-subtle flex-wrap">
            {/* Text formatting */}
            <ToolbarButton
                onClick={handleBold}
                isActive={editor.isActive('bold')}
                title={`${t('editor.toolbar.bold', 'Bold')} (Ctrl+B)`}
            >
                <Bold className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={handleItalic}
                isActive={editor.isActive('italic')}
                title={`${t('editor.toolbar.italic', 'Italic')} (Ctrl+I)`}
            >
                <Italic className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={handleUnderline}
                isActive={editor.isActive('underline')}
                title={`${t('editor.toolbar.underline', 'Underline')} (Ctrl+U)`}
            >
                <UnderlineIcon className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={handleStrike}
                isActive={editor.isActive('strike')}
                title={t('editor.toolbar.strikethrough', 'Strikethrough')}
            >
                <Strikethrough className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={handleCode}
                isActive={editor.isActive('code')}
                title={`${t('editor.toolbar.code', 'Inline Code')} (Ctrl+\`)`}
            >
                <Code className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarDivider />

            {/* Headings */}
            <ToolbarButton
                onClick={handleHeading1}
                isActive={editor.isActive('heading', { level: 1 })}
                title={t('editor.toolbar.heading1', 'Heading 1')}
            >
                <Heading1 className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={handleHeading2}
                isActive={editor.isActive('heading', { level: 2 })}
                title={t('editor.toolbar.heading2', 'Heading 2')}
            >
                <Heading2 className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={handleHeading3}
                isActive={editor.isActive('heading', { level: 3 })}
                title={t('editor.toolbar.heading3', 'Heading 3')}
            >
                <Heading3 className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarDivider />

            {/* Lists */}
            <ToolbarButton
                onClick={handleBulletList}
                isActive={editor.isActive('bulletList')}
                title={t('editor.toolbar.list_bullet', 'Bullet List')}
            >
                <List className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={handleOrderedList}
                isActive={editor.isActive('orderedList')}
                title={t('editor.toolbar.list_ordered', 'Numbered List')}
            >
                <ListOrdered className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarDivider />

            {/* Block elements */}
            <ToolbarButton
                onClick={handleBlockquote}
                isActive={editor.isActive('blockquote')}
                title={t('editor.toolbar.quote', 'Blockquote')}
            >
                <Quote className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={handleCodeBlock}
                isActive={editor.isActive('codeBlock')}
                title={t('editor.toolbar.code_block', 'Code Block')}
            >
                <Code2 className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={handleHorizontalRule}
                title={t('editor.toolbar.horizontal_rule', 'Horizontal Rule')}
            >
                <Minus className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={handleInsertTable}
                isActive={editor.isActive('table')}
                title={t('editor.toolbar.table', 'Insert Table')}
            >
                <Table className="w-4 h-4" />
            </ToolbarButton>
        </div>
    );
};
