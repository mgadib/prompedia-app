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
        className={`p-1.5 rounded-sm ${isActive
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

    if (!editor) return null;

    return (
        <div className="flex items-center gap-0 px-1.5 py-1 bg-surface-subtle flex-wrap">
            {/* Text formatting */}
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive('bold')}
                title={`${t('editor.toolbar.bold', 'Bold')} (Ctrl+B)`}
            >
                <Bold className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive('italic')}
                title={`${t('editor.toolbar.italic', 'Italic')} (Ctrl+I)`}
            >
                <Italic className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                isActive={editor.isActive('underline')}
                title={`${t('editor.toolbar.underline', 'Underline')} (Ctrl+U)`}
            >
                <UnderlineIcon className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleStrike().run()}
                isActive={editor.isActive('strike')}
                title={t('editor.toolbar.strikethrough', 'Strikethrough')}
            >
                <Strikethrough className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleCode().run()}
                isActive={editor.isActive('code')}
                title={`${t('editor.toolbar.code', 'Inline Code')} (Ctrl+\`)`}
            >
                <Code className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarDivider />

            {/* Headings */}
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                isActive={editor.isActive('heading', { level: 1 })}
                title={t('editor.toolbar.heading1', 'Heading 1')}
            >
                <Heading1 className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                isActive={editor.isActive('heading', { level: 2 })}
                title={t('editor.toolbar.heading2', 'Heading 2')}
            >
                <Heading2 className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                isActive={editor.isActive('heading', { level: 3 })}
                title={t('editor.toolbar.heading3', 'Heading 3')}
            >
                <Heading3 className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarDivider />

            {/* Lists */}
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editor.isActive('bulletList')}
                title={t('editor.toolbar.list_bullet', 'Bullet List')}
            >
                <List className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                isActive={editor.isActive('orderedList')}
                title={t('editor.toolbar.list_ordered', 'Numbered List')}
            >
                <ListOrdered className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarDivider />

            {/* Block elements */}
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                isActive={editor.isActive('blockquote')}
                title={t('editor.toolbar.quote', 'Blockquote')}
            >
                <Quote className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                isActive={editor.isActive('codeBlock')}
                title={t('editor.toolbar.code_block', 'Code Block')}
            >
                <Code2 className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                title={t('editor.toolbar.horizontal_rule', 'Horizontal Rule')}
            >
                <Minus className="w-4 h-4" />
            </ToolbarButton>
        </div>
    );
};
