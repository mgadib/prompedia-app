import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Copy, FileText } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { toast } from "sonner";
import { MarkdownPreview } from '@/components/editor';
import { formatDate } from '@/lib/date-utils';
import { SEO } from './SEO';
import { PromptUI, Prompt } from '@/types/prompts';
import { transformPromptToUI } from '@/lib/prompt-transformers';

// UI Components
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { TagChipStatic } from '@/components/ui/tag-chip';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';

const PublicPromptView = () => {
    const { id } = useParams<{ id: string }>();
    const { t, i18n } = useTranslation();
    const [prompt, setPrompt] = useState<PromptUI | null>(null);
    const [recentPrompts, setRecentPrompts] = useState<{ id: string; title: string; author: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRecentPrompts = async () => {
            try {
                const { data, error } = await supabase
                    .from('prompts')
                    .select('id, title, users(username, display_name)')
                    .eq('is_public', true)
                    .order('created_at', { ascending: false })
                    .limit(7);

                if (error) throw error;
                if (data) {
                    setRecentPrompts(data.map(p => ({
                        id: p.id,
                        title: p.title || t('prompt.untitled'),
                        author: (p.users as any)?.display_name || (p.users as any)?.username || t('prompt.unknown_author')
                    })));
                }
            } catch (err) {
                console.error('Error fetching recent prompts:', err);
            }
        };

        fetchRecentPrompts();
    }, [t]);

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

                // Safe cast and transform
                const p = data as unknown as Prompt;
                const formattedPrompt = transformPromptToUI(p, t);
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

    // Structured Data - Article Schema
    const promptSchema = prompt ? {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": prompt.title,
        "author": {
            "@type": "Person",
            "name": prompt.author
        },
        "datePublished": prompt.created_at,
        "dateModified": prompt.updated_at || prompt.created_at,
        "articleBody": prompt.content,
        "keywords": prompt.tags?.map(tag => tag.name).join(", "),
        "publisher": {
            "@type": "Organization",
            "name": "prompedia.app",
            "url": "https://prompedia.app"
        },
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": window.location.href
        }
    } : null;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground">{t('auth.processing', 'Loading...')}</p>
                </div>
            </div>
        );
    }

    if (error || !prompt) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
                <SEO title={t('public_view.not_found_title')} noIndex={true} />
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
    const formattedDate = prompt ? formatDate(prompt.created_at, i18n.language) : '';

    return (
        <div className="min-h-screen bg-background font-sans flex flex-col">
            <SEO
                title={prompt.title}
                description={prompt.content?.substring(0, 160)}
                structuredData={promptSchema || undefined}
                type="article"
            />
            <Header variant="public" />

            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full">
                <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 items-start">
                    {/* Left Column: Prompt Detail */}
                    <div className="flex-1 w-full min-w-0">
                        <div className="bg-card border border-border rounded shadow-sm overflow-hidden">
                            {/* Header */}
                            <div className="p-4 sm:p-6 border-b border-border">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4 mb-4">
                                    <h1 className="text-xl sm:text-2xl font-bold text-foreground">{prompt.title}</h1>
                                    <Button
                                        variant="brand"
                                        size="sm"
                                        onClick={handleCopy}
                                        className="flex-shrink-0 w-full sm:w-auto"
                                        aria-label={t('actions.copy')}
                                    >
                                        <Copy className="w-4 h-4" aria-hidden="true" />
                                        <span>{t('actions.copy')}</span>
                                    </Button>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-muted-foreground">
                                    {prompt.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {prompt.tags.map(tag => (
                                                <TagChipStatic key={tag.id} variant="outline" size="sm">
                                                    {tag.name}
                                                </TagChipStatic>
                                            ))}
                                        </div>
                                    )}
                                    <span className="font-medium text-foreground">@{prompt.author}</span>
                                    <span>{formattedDate}</span>
                                    <StatusBadge variant="public">{t('prompt.public')}</StatusBadge>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4 sm:p-6 lg:p-8">
                                <MarkdownPreview content={prompt.content} className="text-body" />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Recent Public Prompts */}
                    <aside className="w-full lg:w-72 flex-shrink-0 lg:sticky lg:top-20">
                        <div className="bg-card border border-border rounded shadow-sm overflow-hidden">
                            <div className="p-4 sm:p-6 border-b border-border bg-muted/30">
                                <h2 className="text-2xs font-bold text-muted-foreground uppercase tracking-widest leading-none">
                                    {t('landing.recent_prompts_title', 'Recent Public Prompts')}
                                </h2>
                            </div>
                            <div className="p-2">
                                <div className="space-y-1">
                                    {recentPrompts.length > 0 ? (
                                        recentPrompts.map(rp => (
                                            <Link
                                                key={rp.id}
                                                to={`/share/${rp.id}`}
                                                className="block p-3 rounded hover:bg-secondary/80 transition-all duration-fast ease-default group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                                            >
                                                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-fast block leading-tight">
                                                    {rp.title}
                                                </span>
                                            </Link>
                                        ))
                                    ) : (
                                        <div className="p-6 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                                                    <FileText className="w-6 h-6 text-muted-foreground" aria-hidden="true" />
                                                </div>
                                                <p className="text-sm text-muted-foreground">{t('landing.no_public_prompts', 'No public prompts yet')}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="p-3 sm:p-4 mt-2 border-t border-border/50">
                                    <Button variant="brand" size="sm" className="w-full text-xs font-semibold py-3 sm:py-4" asChild aria-label={t('public_view.open_app', 'Open prompedia.app')}>
                                        <Link to="/">{t('public_view.open_app', 'Open prompedia.app')}</Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default PublicPromptView;
