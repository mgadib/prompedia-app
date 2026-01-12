import { PromptUI } from '@/types/prompts';

/**
 * Command definitions for the command palette.
 * Each command represents an action that can be triggered via the palette.
 */

export interface Command {
    id: string;
    label: string;
    description?: string;
    icon?: React.ComponentType<{ className?: string }>;
    shortcut?: string[];
    category: 'actions' | 'navigation' | 'view' | 'search';
    action: () => void;
    keywords?: string[]; // For fuzzy search
    disabled?: boolean;
    hidden?: boolean;
}

export interface CommandPaletteContext {
    // Navigation
    navigate?: (path: string) => void;
    
    // Prompt actions
    onNewPrompt?: () => void;
    onSavePrompt?: () => void;
    onDeletePrompt?: (id: string) => void;
    onEditPrompt?: (prompt: PromptUI) => void;
    onCopyPrompt?: (text: string) => void;
    onSharePrompt?: (id: string) => void;
    
    // View actions
    onToggleTheme?: () => void;
    onShowShortcuts?: () => void;
    onFilterByTag?: (tag: string) => void;
    onFilterByVisibility?: (visibility: 'all' | 'public' | 'private') => void;
    
    // Search
    onFocusSearch?: () => void;
    onSearchPrompts?: (query: string) => void;
    
    // State
    isEditing?: boolean;
    currentPrompt?: PromptUI | null;
    tags?: Array<{ id: string; name: string }>;
    recentPrompts?: PromptUI[];
}

/**
 * Generate commands based on context.
 */
export function generateCommands(context: CommandPaletteContext): Command[] {
    const commands: Command[] = [];

    // Actions
    if (context.onNewPrompt) {
        commands.push({
            id: 'new-prompt',
            label: 'New Prompt',
            description: 'Create a new prompt',
            shortcut: ['Ctrl', 'N'],
            category: 'actions',
            action: context.onNewPrompt,
            keywords: ['create', 'add', 'new'],
        });
    }

    if (context.onSavePrompt && context.isEditing) {
        commands.push({
            id: 'save-prompt',
            label: 'Save Prompt',
            description: 'Save the current prompt',
            shortcut: ['Ctrl', 'S'],
            category: 'actions',
            action: context.onSavePrompt,
            keywords: ['save', 'store'],
        });
    }

    if (context.onCopyPrompt && context.currentPrompt) {
        commands.push({
            id: 'copy-prompt',
            label: 'Copy Prompt',
            description: 'Copy prompt content to clipboard',
            category: 'actions',
            action: () => context.onCopyPrompt?.(context.currentPrompt!.content),
            keywords: ['copy', 'clipboard'],
        });
    }

    if (context.onSharePrompt && context.currentPrompt?.is_public) {
        commands.push({
            id: 'share-prompt',
            label: 'Share Prompt',
            description: 'Copy sharing link',
            category: 'actions',
            action: () => context.onSharePrompt?.(context.currentPrompt!.id),
            keywords: ['share', 'link'],
        });
    }

    // Navigation
    if (context.navigate) {
        commands.push(
            {
                id: 'go-home',
                label: 'Go to Home',
                description: 'Navigate to home page',
                shortcut: ['Ctrl', 'H'],
                category: 'navigation',
                action: () => context.navigate?.('/'),
                keywords: ['home', 'main'],
            },
            {
                id: 'go-about',
                label: 'Go to About',
                description: 'View about page',
                category: 'navigation',
                action: () => context.navigate?.('/about'),
                keywords: ['about', 'info'],
            },
            {
                id: 'go-faq',
                label: 'Go to FAQ',
                description: 'View frequently asked questions',
                category: 'navigation',
                action: () => context.navigate?.('/faq'),
                keywords: ['faq', 'help', 'questions'],
            },
            {
                id: 'go-use-cases',
                label: 'Go to Use Cases',
                description: 'View use cases',
                category: 'navigation',
                action: () => context.navigate?.('/use-cases'),
                keywords: ['use', 'cases', 'examples'],
            }
        );
    }

    // View
    if (context.onToggleTheme) {
        commands.push({
            id: 'toggle-theme',
            label: 'Toggle Theme',
            description: 'Switch between light and dark mode',
            shortcut: ['Ctrl', 'Shift', 'T'],
            category: 'view',
            action: context.onToggleTheme,
            keywords: ['theme', 'dark', 'light', 'mode'],
        });
    }

    if (context.onShowShortcuts) {
        commands.push({
            id: 'show-shortcuts',
            label: 'Show Keyboard Shortcuts',
            description: 'View all available keyboard shortcuts',
            shortcut: ['Ctrl', '/'],
            category: 'view',
            action: context.onShowShortcuts,
            keywords: ['shortcuts', 'keys', 'keyboard', 'help'],
        });
    }

    // Filter by tag (dynamic)
    if (context.onFilterByTag && context.tags) {
        context.tags.forEach(tag => {
            commands.push({
                id: `filter-tag-${tag.id}`,
                label: `Filter by ${tag.name}`,
                description: `Show prompts with tag: ${tag.name}`,
                category: 'view',
                action: () => context.onFilterByTag?.(tag.name),
                keywords: ['filter', 'tag', tag.name.toLowerCase()],
            });
        });
    }

    // Filter by visibility
    if (context.onFilterByVisibility) {
        commands.push(
            {
                id: 'filter-all',
                label: 'Show All Prompts',
                description: 'Show all prompts',
                category: 'view',
                action: () => context.onFilterByVisibility?.('all'),
                keywords: ['filter', 'all'],
            },
            {
                id: 'filter-public',
                label: 'Show Public Prompts',
                description: 'Show only public prompts',
                category: 'view',
                action: () => context.onFilterByVisibility?.('public'),
                keywords: ['filter', 'public'],
            },
            {
                id: 'filter-private',
                label: 'Show Private Prompts',
                description: 'Show only private prompts',
                category: 'view',
                action: () => context.onFilterByVisibility?.('private'),
                keywords: ['filter', 'private'],
            }
        );
    }

    // Search
    if (context.onFocusSearch) {
        commands.push({
            id: 'focus-search',
            label: 'Focus Search',
            description: 'Focus the search input',
            shortcut: ['Ctrl', 'F'],
            category: 'search',
            action: context.onFocusSearch,
            keywords: ['search', 'find'],
        });
    }

    // Recent prompts (dynamic)
    if (context.recentPrompts) {
        context.recentPrompts.slice(0, 5).forEach(prompt => {
            commands.push({
                id: `open-prompt-${prompt.id}`,
                label: prompt.title,
                description: `Open: ${prompt.title}`,
                category: 'search',
                action: () => context.onEditPrompt?.(prompt),
                keywords: ['open', 'recent', prompt.title.toLowerCase()],
            });
        });
    }

    return commands.filter(cmd => !cmd.hidden);
}

/**
 * Group commands by category.
 */
export function groupCommandsByCategory(commands: Command[]): Record<string, Command[]> {
    return commands.reduce((acc, cmd) => {
        if (!acc[cmd.category]) {
            acc[cmd.category] = [];
        }
        acc[cmd.category].push(cmd);
        return acc;
    }, {} as Record<string, Command[]>);
}
