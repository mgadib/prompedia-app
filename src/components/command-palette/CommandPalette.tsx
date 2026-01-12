import React, { useEffect, useState } from 'react';
import { Command as CmdkCommand } from 'cmdk';
import { useTranslation } from 'react-i18next';
import { 
    FileText, 
    Home, 
    Info, 
    HelpCircle, 
    Lightbulb, 
    Moon, 
    Sun, 
    Keyboard,
    Search,
    Tag,
    Eye,
    EyeOff,
    Copy,
    Share2,
    Save,
    Plus,
    X
} from 'lucide-react';
import { Command, groupCommandsByCategory } from '@/lib/commands';
import { getShortcutDisplay } from '@/lib/keyboard-shortcuts';
import { cn } from '@/lib/utils';

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    commands: Command[];
    searchPlaceholder?: string;
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    actions: FileText,
    navigation: Home,
    view: Eye,
    search: Search,
};

const categoryLabels: Record<string, string> = {
    actions: 'Actions',
    navigation: 'Navigation',
    view: 'View',
    search: 'Search',
};

export const CommandPalette: React.FC<CommandPaletteProps> = ({
    isOpen,
    onClose,
    commands,
    searchPlaceholder,
}) => {
    const { t } = useTranslation();
    const [search, setSearch] = useState('');

    // Reset search when palette closes
    useEffect(() => {
        if (!isOpen) {
            setSearch('');
        }
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const groupedCommands = groupCommandsByCategory(commands);
    const categories = Object.keys(groupedCommands).sort();

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] p-4 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-2xl bg-card border border-border rounded-lg shadow-xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <CmdkCommand
                    shouldFilter={true}
                    loop={true}
                    className="[&_[cmdk-input]]:h-12 [&_[cmdk-input]]:text-base"
                >
                    <div className="flex items-center border-b border-border px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <CmdkCommand.Input
                            placeholder={searchPlaceholder || t('command_palette.search', 'Search commands...')}
                            value={search}
                            onValueChange={setSearch}
                            className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            autoFocus
                        />
                        <button
                            onClick={onClose}
                            className="ml-2 h-8 w-8 flex items-center justify-center rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                            aria-label={t('actions.close', 'Close')}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <CmdkCommand.List className="max-h-[400px] overflow-y-auto p-2 custom-scrollbar">
                        <CmdkCommand.Empty className="py-6 text-center text-sm text-muted-foreground">
                            {t('command_palette.no_results', 'No results found.')}
                        </CmdkCommand.Empty>

                        {categories.map((category) => {
                            const categoryCommands = groupedCommands[category];
                            if (categoryCommands.length === 0) return null;

                            const CategoryIcon = categoryIcons[category] || FileText;
                            const categoryLabel = t(`command_palette.category.${category}`, categoryLabels[category]);

                            return (
                                <CmdkCommand.Group
                                    key={category}
                                    heading={
                                        <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            <CategoryIcon className="h-3.5 w-3.5" />
                                            <span>{categoryLabel}</span>
                                        </div>
                                    }
                                >
                                    {categoryCommands.map((command) => {
                                        const Icon = command.icon || FileText;
                                        return (
                                            <CmdkCommand.Item
                                                key={command.id}
                                                value={`${command.label} ${command.description || ''} ${command.keywords?.join(' ') || ''}`}
                                                onSelect={() => {
                                                    command.action();
                                                    onClose();
                                                }}
                                                disabled={command.disabled}
                                                className={cn(
                                                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none transition-colors",
                                                    "aria-selected:bg-accent aria-selected:text-accent-foreground",
                                                    "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                                                )}
                                            >
                                                <Icon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                                <div className="flex-1">
                                                    <div className="font-medium">{command.label}</div>
                                                    {command.description && (
                                                        <div className="text-xs text-muted-foreground">
                                                            {command.description}
                                                        </div>
                                                    )}
                                                </div>
                                                {command.shortcut && (
                                                    <kbd className="pointer-events-none ml-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                                                        {getShortcutDisplay(command.shortcut)}
                                                    </kbd>
                                                )}
                                            </CmdkCommand.Item>
                                        );
                                    })}
                                </CmdkCommand.Group>
                            );
                        })}
                    </CmdkCommand.List>
                </CmdkCommand>
            </div>
        </div>
    );
};
