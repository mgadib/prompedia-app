import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getShortcutDisplay } from '@/lib/keyboard-shortcuts';

interface ShortcutGroup {
    title: string;
    shortcuts: Array<{
        keys: string[];
        description: string;
    }>;
}

interface ShortcutsHelpDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ShortcutsHelpDialog: React.FC<ShortcutsHelpDialogProps> = ({
    isOpen,
    onClose,
}) => {
    const { t } = useTranslation();

    if (!isOpen) return null;

    const shortcutGroups: ShortcutGroup[] = [
        {
            title: t('shortcuts.global.title', 'Global Shortcuts'),
            shortcuts: [
                { keys: ['Ctrl', 'K'], description: t('shortcuts.global.command_palette', 'Open command palette') },
                { keys: ['Ctrl', 'N'], description: t('shortcuts.global.new_prompt', 'Create new prompt') },
                { keys: ['Ctrl', 'F'], description: t('shortcuts.global.focus_search', 'Focus search input') },
                { keys: ['Ctrl', 'S'], description: t('shortcuts.global.save', 'Save prompt (when editing)') },
                { keys: ['Ctrl', '/'], description: t('shortcuts.global.show_shortcuts', 'Show keyboard shortcuts') },
                { keys: ['Escape'], description: t('shortcuts.global.close_modals', 'Close modals and dialogs') },
            ],
        },
        {
            title: t('shortcuts.editor.title', 'Editor Shortcuts'),
            shortcuts: [
                { keys: ['Ctrl', 'B'], description: t('shortcuts.editor.bold', 'Toggle bold') },
                { keys: ['Ctrl', 'I'], description: t('shortcuts.editor.italic', 'Toggle italic') },
                { keys: ['Ctrl', 'U'], description: t('shortcuts.editor.underline', 'Toggle underline') },
                { keys: ['Ctrl', '`'], description: t('shortcuts.editor.inline_code', 'Toggle inline code') },
                { keys: ['Ctrl', 'Shift', 'X'], description: t('shortcuts.editor.strikethrough', 'Toggle strikethrough') },
                { keys: ['Ctrl', '1'], description: t('shortcuts.editor.heading1', 'Heading 1') },
                { keys: ['Ctrl', '2'], description: t('shortcuts.editor.heading2', 'Heading 2') },
                { keys: ['Ctrl', '3'], description: t('shortcuts.editor.heading3', 'Heading 3') },
                { keys: ['Ctrl', 'Shift', '8'], description: t('shortcuts.editor.bullet_list', 'Bullet list') },
                { keys: ['Ctrl', 'Shift', '7'], description: t('shortcuts.editor.numbered_list', 'Numbered list') },
                { keys: ['Ctrl', 'Shift', '>'], description: t('shortcuts.editor.blockquote', 'Blockquote') },
                { keys: ['Ctrl', 'Alt', 'C'], description: t('shortcuts.editor.code_block', 'Code block') },
            ],
        },
    ];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-2xl bg-card border border-border rounded-lg shadow-xl overflow-hidden max-h-[85vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <Keyboard className="h-5 w-5 text-foreground" />
                        <h2 className="text-lg font-semibold text-foreground">
                            {t('shortcuts.title', 'Keyboard Shortcuts')}
                        </h2>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        aria-label={t('actions.close', 'Close')}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
                    <div className="space-y-6">
                        {shortcutGroups.map((group) => (
                            <div key={group.title}>
                                <h3 className="text-sm font-semibold text-foreground mb-3">
                                    {group.title}
                                </h3>
                                <div className="space-y-2">
                                    {group.shortcuts.map((shortcut, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between py-2 px-3 rounded-sm hover:bg-secondary/50 transition-colors"
                                        >
                                            <span className="text-sm text-muted-foreground">
                                                {shortcut.description}
                                            </span>
                                            <kbd className="pointer-events-none flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                                                {getShortcutDisplay(shortcut.keys)}
                                            </kbd>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-6 border-t border-border">
                    <p className="text-xs text-muted-foreground text-center">
                        {t('shortcuts.hint', 'Press Escape to close')}
                    </p>
                </div>
            </div>
        </div>
    );
};
