import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Moon, Sun, Globe, Copy, ArrowLeft } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { MarkdownPreview } from '@/components/editor';

interface Tag extends Tables<'tags'> { }

interface Prompt extends Tables<'prompts'> {
    prompt_contents: { body: string } | null;
    prompt_tags: { tags: Pick<Tag, 'id' | 'name'> | null }[];
    users: {
        username: string;
        display_name: string | null;
    } | null;
}

interface PromptUI extends Omit<Prompt, 'prompt_tags' | 'users' | 'prompt_contents'> {
    content: string;
    tags: Pick<Tag, 'id' | 'name'>[];
    author: string;
    description: string;
}

const PublicPromptView = () => {
    const { id } = useParams<{ id: string }>();
    const { t, i18n } = useTranslation();
    const { theme, setTheme } = useTheme();
    const [prompt, setPrompt] = useState<PromptUI | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPrompt = async () => {
            if (!id) return;
            setLoading(true);

            try {
                const { data, error } = await supabase
                    .from('prompts')
                    .select('*, prompt_contents(body), prompt_tags(tags(id, name)), users(username, display_name)')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                if (!data) throw new Error(t('public_view.not_found_title'));

                if (!data.is_public) {
                    throw new Error(t('public_view.private_error'));
                }

                // Safe cast
                const p = data as unknown as Prompt;

                const formattedPrompt: PromptUI = {
                    id: p.id,
                    user_id: p.user_id || '',
                    title: p.title || t('prompt.untitled'),
                    description: p.description || '',
                    content: p.prompt_contents?.body || '',
                    is_public: p.is_public || false,
                    created_at: p.created_at,
                    updated_at: p.updated_at || p.created_at,
                    tags: p.prompt_tags
                        ? p.prompt_tags
                            .map(pt => pt.tags)
                            .filter((t): t is Pick<Tag, 'id' | 'name'> => t !== null)
                        : [],
                    author: p.users?.username || t('prompt.unknown_author')
                };

                setPrompt(formattedPrompt);
            } catch (err: any) {
                console.error('Error fetching prompt:', err);
                setError(err.message || t('public_view.not_found_title'));
            } finally {
                setLoading(false);
            }
        };

        fetchPrompt();
    }, [id, t]);

    const handleCopy = async () => {
        if (!prompt) return;
        await navigator.clipboard.writeText(prompt.content);
        toast.success(t('toast.copied'));
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !prompt) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
                <h2 className="text-xl font-semibold mb-2 text-foreground">
                    {error || t('public_view.not_found_title')}
                </h2>
                <p className="text-muted-foreground mb-6">
                    {t('public_view.not_found_desc')}
                </p>
                <Link to="/" className="text-primary hover:underline">
                    {t('public_view.go_home')}
                </Link>
            </div>
        );
    }

    // Format date: 15 Januari 2025
    const formattedDate = prompt ? new Date(prompt.created_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }) : '';

    return (
        <div className="min-h-screen bg-background font-sans">
            <header className="border-b border-border bg-card sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to="/">
                            <img src="/logo.png" alt="Logo" className="w-8 h-8" />
                        </Link>
                        <h1 className="text-base font-semibold text-foreground hidden sm:block">{t('app.title')}</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => i18n.changeLanguage(i18n.resolvedLanguage === 'id' ? 'en' : 'id')}
                            className="text-muted-foreground hover:text-foreground transition-colors p-1"
                        >
                            <Globe className="h-[1.2rem] w-[1.2rem]" />
                        </button>
                        <button
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            className="text-muted-foreground hover:text-foreground transition-colors p-1"
                        >
                            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 block dark:hidden" />
                            <Moon className="h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 hidden dark:block" />
                        </button>
                        <Link to="/" className="text-sm font-medium text-primary hover:underline">
                            {t('public_view.open_app')}
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    {t('public_view.back_to_app')}
                </Link>

                <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-border">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                            <div>
                                <h1 className="text-2xl font-bold text-foreground mb-2 font-mono tracking-tight">{prompt.title}</h1>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                                    <span className="font-medium text-foreground">@{prompt.author}</span>
                                    <span>•</span>
                                    <span>{formattedDate}</span>
                                </div>
                            </div>
                            <button
                                onClick={handleCopy}
                                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                title={t('actions.copy')}
                            >
                                <Copy className="w-4 h-4" />
                                <span className="underline decoration-dotted underline-offset-4">{t('actions.copy')}</span>
                            </button>
                        </div>

                        {prompt.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {prompt.tags.map(tag => (
                                    <span key={tag.id} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-md font-medium">
                                        {tag.name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-secondary/5">
                        <MarkdownPreview content={prompt.content} className="text-sm" />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PublicPromptView;
