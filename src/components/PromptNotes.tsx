import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { useTheme } from "next-themes";
import { Moon, Sun, Globe } from "lucide-react";
import { User } from '@supabase/supabase-js';

import { Tables } from '@/integrations/supabase/types';
import { MarkdownEditor } from '@/components/editor';
import { formatDate } from '@/lib/date-utils';

interface Tag extends Tables<'tags'> { }

interface Prompt extends Tables<'prompts'> {
    prompt_contents: { body: string } | null;
    prompt_tags: { tags: Pick<Tag, 'id' | 'name'> | null }[]; // Adjusted to handle null possibility in join
    users: {
        username: string;
        display_name: string | null;
    } | null;
}

interface PromptUI extends Omit<Prompt, 'prompt_tags' | 'users' | 'prompt_contents'> {
    content: string;
    tags: Pick<Tag, 'id' | 'name'>[]; // Flattened tags
    author: string;
}

interface ToastState {
    visible: boolean;
    message: string;
    exiting: boolean;
}

type VisibilityFilter = 'all' | 'public' | 'private';

import { SEO } from '@/components/SEO';

const PromptNotes = () => {
    const { t, i18n } = useTranslation();

    // Schema for Home
    const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Prompedia",
        "url": "https://prompedia.ai/",
        "potentialAction": {
            "@type": "SearchAction",
            "target": "https://prompedia.ai/?q={search_term_string}",
            "query-input": "required name=search_term_string"
        }
    };

    // Auth state
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [showAuth, setShowAuth] = useState(false);

    // Auth form
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [authError, setAuthError] = useState('');
    const [authSubmitting, setAuthSubmitting] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

    // Data state
    const [prompts, setPrompts] = useState<PromptUI[]>([]);
    const [allUserTags, setAllUserTags] = useState<Tag[]>([]);

    // Public landing data (for unauthenticated users)
    const [publicTags, setPublicTags] = useState<{ name: string; count: number }[]>([]);
    const [publicPrompts, setPublicPrompts] = useState<{ id: string; title: string; content: string; description: string; tags: string[]; author: string; created_at: string; user_id: string }[]>([]);
    const [selectedPublicTag, setSelectedPublicTag] = useState<string | null>(null);
    const [publicCurrentPage, setPublicCurrentPage] = useState(1);
    const [publicItemsPerPage, setPublicItemsPerPage] = useState(10);

    // Form state
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tagsInput, setTagsInput] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [filter, setFilter] = useState('');
    const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('all');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Pagination State
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // Modal State
    const [selectedPrompt, setSelectedPrompt] = useState<PromptUI | null>(null);

    const { theme, setTheme } = useTheme();
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [toast, setToast] = useState<ToastState>({ visible: false, message: '', exiting: false });

    const showToast = useCallback((message: string) => {
        setToast({ visible: true, message, exiting: false });
        setTimeout(() => {
            setToast(prev => ({ ...prev, exiting: true }));
            setTimeout(() => {
                setToast({ visible: false, message: '', exiting: false });
            }, 150);
        }, 2000);
    }, []);

    // Check Auth
    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            setAuthLoading(false);
            if (!session?.user) setShowAuth(true);
        };
        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) setShowAuth(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Fetch public data for landing page (unauthenticated users)
    const fetchPublicData = useCallback(async () => {
        // Fetch public prompts with tags and content (for description)
        const { data: promptsData, error } = await supabase
            .from('prompts')
            .select(`
                id,
                title,
                created_at,
                is_public,
                user_id,
                prompt_tags(tags(name)),
                users(username, display_name),
                prompt_contents(body)
            `)
            .eq('is_public', true)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            console.error('Error fetching public prompts:', error);
            return;
        }

        if (promptsData) {
            const formatted = promptsData.map((p: any) => {
                const bodyText = p.prompt_contents?.body || '';
                const description = bodyText.length > 150 ? bodyText.substring(0, 150) + '...' : bodyText;

                return {
                    id: p.id,
                    title: p.title || t('prompt.untitled'),
                    content: bodyText,
                    description: description,
                    tags: p.prompt_tags?.map((pt: any) => pt.tags?.name).filter(Boolean) || [],
                    author: p.users?.display_name || p.users?.username || t('prompt.unknown_author'),
                    created_at: p.created_at,
                    user_id: p.user_id || ''
                };
            });
            setPublicPrompts(formatted);

            // Extract unique tags with counts
            const tagCounts: Record<string, number> = {};
            formatted.forEach(p => {
                p.tags.forEach((tag: string) => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            });
            const tagsArray = Object.entries(tagCounts)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count);
            setPublicTags(tagsArray);
        }
    }, [t]);

    useEffect(() => {
        if (!user && showAuth) {
            fetchPublicData();
        }
    }, [user, showAuth, fetchPublicData]);

    // Load Data
    const loadData = useCallback(async () => {
        if (!user) return;

        const { data: promptsData, error: promptsError } = await supabase
            .from('prompts')
            .select('*, prompt_contents(body), prompt_tags(tags(id, name)), users(username, display_name)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (!promptsError && promptsData) {
            // Safe cast because we know the query structure
            const data = promptsData as unknown as Prompt[];

            const formattedPrompts: PromptUI[] = data.map(p => {
                const content = p.prompt_contents?.body || '';
                return {
                    id: p.id,
                    user_id: p.user_id || '', // Handle potential null from type definition even if schema is restricted
                    title: p.title || t('prompt.untitled'),
                    content: content,
                    description: content.length > 150 ? content.substring(0, 150) + '...' : content,
                    is_public: Boolean(p.is_public),
                    created_at: p.created_at,
                    updated_at: p.updated_at || p.created_at,
                    tags: p.prompt_tags
                        ? p.prompt_tags
                            .map(pt => pt.tags)
                            .filter((t): t is Pick<Tag, 'id' | 'name'> => t !== null)
                        : [],
                    author: p.users?.display_name || p.users?.username || t('prompt.unknown_author')
                };
            });
            setPrompts(formattedPrompts);
        }

        const { data: tagsData, error: tagsError } = await supabase
            .from('tags')
            .select('*')
            .eq('user_id', user.id)
            .order('name');

        if (!tagsError && tagsData) {
            setAllUserTags(tagsData);
        }
    }, [user, t]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Handle Login
    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError('');
        setAuthSubmitting(true);

        if (authMode === 'login') {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) setAuthError(error.message);
            else { setEmail(''); setPassword(''); }
        } else {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        display_name: displayName,
                        username: email.split('@')[0] // Fallback username
                    }
                }
            });
            if (error) setAuthError(error.message);
            else {
                showToast(t('toast.registration_success'));
                setAuthMode('login'); // Switch to login after registration
            }
        }
        setAuthSubmitting(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setShowAuth(true);
    };

    // Save Functionality
    const handleSave = useCallback(async () => {
        if (!user || !content.trim() || saving) return;
        setSaving(true);

        try {
            const promptTitle = title.trim() || content.trim().slice(0, 50);
            let promptId = editingId;
            const now = new Date().toISOString();

            if (promptId) {
                // Update Metadata
                const { error: promptError } = await supabase
                    .from('prompts')
                    .update({
                        title: promptTitle,
                        is_public: isPublic,
                        updated_at: now
                    })
                    .eq('id', promptId)
                    .eq('user_id', user.id);

                if (promptError) throw promptError;

                // Update Content (Upsert to be safe)
                const { error: contentError } = await supabase
                    .from('prompt_contents')
                    .upsert({
                        prompt_id: promptId,
                        body: content.trim()
                    });

                if (contentError) throw contentError;

            } else {
                const newId = crypto.randomUUID();

                // Insert Metadata
                const { error: promptError } = await supabase.from('prompts').insert({
                    id: newId,
                    user_id: user.id,
                    title: promptTitle,
                    is_public: isPublic
                });

                if (promptError) throw promptError;

                // Insert Content
                const { error: contentError } = await supabase.from('prompt_contents').insert({
                    prompt_id: newId,
                    body: content.trim()
                });

                if (contentError) throw contentError;

                promptId = newId;
            }

            const tagNames = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
            const uniqueTagNames = [...new Set(tagNames)];
            const tagIdsToLink: string[] = [];

            if (uniqueTagNames.length > 0) {
                const { data: existingTags } = await supabase
                    .from('tags')
                    .select('id, name')
                    .eq('user_id', user.id)
                    .in('name', uniqueTagNames);

                const existingTagMap = new Map(existingTags?.map(t => [t.name, t.id]));
                const missingTags = uniqueTagNames.filter(name => !existingTagMap.has(name));

                if (missingTags.length > 0) {
                    const { data: createdTags, error: createError } = await supabase
                        .from('tags')
                        .insert(missingTags.map(name => ({ name, user_id: user.id })))
                        .select('id, name');

                    if (createError) throw createError;
                    createdTags?.forEach(t => tagIdsToLink.push(t.id));
                }
                existingTagMap.forEach(id => tagIdsToLink.push(id));
            }

            if (promptId) {
                await supabase.from('prompt_tags').delete().eq('prompt_id', promptId);
                if (tagIdsToLink.length > 0) {
                    const { error: linkError } = await supabase
                        .from('prompt_tags')
                        .insert(tagIdsToLink.map(tag_id => ({ prompt_id: promptId, tag_id })));
                    if (linkError) throw linkError;
                }
            }

            await loadData();
            showToast(t('toast.saved'));

            setTitle('');
            setContent('');
            setTagsInput('');
            setIsPublic(false);
            setEditingId(null);

        } catch (err) {
            console.error('Save error:', err);
            showToast(t('toast.save_failed'));
        } finally {
            setSaving(false);
        }
    }, [user, title, content, tagsInput, isPublic, editingId, saving, loadData, showToast]);

    const performDelete = async (id: string | null) => {
        if (!user || !id) return;

        const { error } = await supabase.from('prompts').delete().eq('id', id).eq('user_id', user.id);
        if (!error) {
            setPrompts(prev => prev.filter(p => p.id !== id));
            showToast(t('toast.deleted'));
            if (editingId === id) {
                setTitle('');
                setContent('');
                setTagsInput('');
                setIsPublic(false);
                setEditingId(null);
            }
            if (selectedPrompt?.id === id) setSelectedPrompt(null);
            loadData();
        }
    };

    const handleDeleteClick = (id: string) => {
        setConfirmDeleteId(id);
    };

    const handleEdit = (prompt: PromptUI) => {
        setTitle(prompt.title);
        setContent(prompt.content);
        setTagsInput(prompt.tags.map(t => t.name).join(', '));
        setIsPublic(Boolean(prompt.is_public));
        setEditingId(prompt.id);
        setSelectedPrompt(null); // Close modal if open
    };

    const handleCopy = async (text: string) => {
        await navigator.clipboard.writeText(text);
        showToast(t('toast.copied'));
    };

    const filteredPrompts = useMemo(() => {
        let result = prompts;
        if (visibilityFilter === 'public') result = result.filter(p => p.is_public);
        else if (visibilityFilter === 'private') result = result.filter(p => !p.is_public);

        if (filter.trim()) {
            const term = filter.toLowerCase();
            result = result.filter(p =>
                p.title.toLowerCase().includes(term) ||
                p.content.toLowerCase().includes(term) ||
                p.tags.some(t => t.name.toLowerCase().includes(term))
            );
        }
        return result;
    }, [prompts, filter, visibilityFilter]);

    // Reset pagination when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filter, visibilityFilter, prompts.length]);

    const paginatedPrompts = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredPrompts.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredPrompts, currentPage, itemsPerPage]);

    const handleTagFilter = (tagName: string) => setFilter(tagName);

    // Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
            if (e.key === 'Escape' && selectedPrompt) {
                setSelectedPrompt(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSave, selectedPrompt]);



    const promptDetailModal = selectedPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={() => setSelectedPrompt(null)}>
            <div className="w-full max-w-2xl bg-card border border-border rounded-lg shadow-md flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-border flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h3 className="text-xl font-semibold font-mono text-foreground">{selectedPrompt.title}</h3>
                            <span className="text-2xs font-medium px-1.5 py-0.5 rounded border border-border text-muted-foreground bg-secondary/30 flex-shrink-0">
                                {selectedPrompt.is_public ? t('prompt.public') : t('prompt.private')}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-muted-foreground">{t('prompt.by', { author: selectedPrompt.author })}</span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">{formatDate(selectedPrompt.created_at, i18n.language)}</span>
                            {selectedPrompt.tags.map(t => (
                                <span key={t.id} className="font-normal text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{t.name}</span>
                            ))}
                        </div>
                    </div>
                    <button onClick={() => setSelectedPrompt(null)} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                        {t('actions.close')}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-secondary/20">
                    <pre className="whitespace-pre-wrap text-sm text-foreground leading-relaxed font-mono">{selectedPrompt.content}</pre>
                </div>

                <div className="p-4 border-t border-border flex justify-end gap-6 bg-card rounded-b-lg">
                    {user && user.id === selectedPrompt.user_id && (
                        <button
                            onClick={() => handleEdit(selectedPrompt)}
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {t('actions.edit')}
                        </button>
                    )}
                    <button
                        onClick={() => handleCopy(selectedPrompt.content)}
                        className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                    >
                        {t('actions.copy')}
                    </button>
                </div>
            </div>
        </div>
    );

    if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

    if (showAuth || !user) {
        const filteredPublicPrompts = selectedPublicTag
            ? publicPrompts.filter(p => p.tags.includes(selectedPublicTag))
            : publicPrompts;

        const paginatedPublicPrompts = filteredPublicPrompts.slice((publicCurrentPage - 1) * publicItemsPerPage, publicCurrentPage * publicItemsPerPage);

        return (
            <div className="min-h-screen bg-background font-sans">
                {/* Header */}
                <header className="border-b border-border bg-card sticky top-0 z-40">
                    <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img src="/logo.png" alt="Logo" className="w-8 h-8" />
                            <h1 className="text-xl font-bold font-mono text-foreground tracking-tight">prompedia.app</h1>
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
                        </div>
                    </div>
                </header>

                <div className="max-w-6xl mx-auto px-4 py-6">
                    <div className="flex flex-col lg:flex-row gap-6 items-start">
                        <div className="flex-1 w-full min-w-0">
                            {/* Hero Section */}
                            <div className="mb-8">
                                <div className="bg-card border border-border rounded-lg p-8 text-left shadow-sm">
                                    <h2 className="text-2xl font-bold font-mono tracking-tight sm:text-3xl mb-3 text-foreground">{t('app.tagline')}</h2>
                                    <p className="text-base text-muted-foreground max-w-xl">{t('app.description')}</p>
                                    <div className="geo-content opacity-0 h-0 overflow-hidden" aria-hidden="true">
                                        {t('geo.semantic_description')}
                                    </div>
                                </div>
                            </div>

                            {/* Public Tags Section */}


                            {/* Recent Public Prompts */}
                            <section>
                                <h2 className="text-sm font-medium text-muted-foreground mb-3">{t('landing.recent_prompts_title')}</h2>
                                {filteredPublicPrompts.length > 0 ? (
                                    <div className="space-y-3">
                                        {paginatedPublicPrompts.map(prompt => (
                                            <div
                                                key={prompt.id}
                                                onClick={() => setSelectedPrompt({
                                                    id: prompt.id,
                                                    user_id: prompt.user_id,
                                                    title: prompt.title,
                                                    content: prompt.content,
                                                    description: prompt.description,
                                                    is_public: true,
                                                    created_at: prompt.created_at,
                                                    updated_at: prompt.created_at,
                                                    tags: prompt.tags.map(t => ({ id: t, name: t })),
                                                    author: prompt.author
                                                })}
                                                className="block bg-card border border-border rounded-md p-4 hover:border-primary/50 transition-colors cursor-pointer text-left shadow-sm"
                                            >
                                                <h3 className="text-sm font-semibold text-foreground font-mono mb-1">{prompt.title}</h3>
                                                {prompt.description && (
                                                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{prompt.description}</p>
                                                )}
                                                <div className="flex items-center gap-2 flex-wrap mt-2">
                                                    {prompt.tags.slice(0, 3).map(tag => (
                                                        <span key={tag} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                    <span className="text-xs bg-secondary/50 text-muted-foreground px-2 py-0.5 rounded-md">
                                                        @{prompt.author}
                                                    </span>
                                                    <span className="text-xs bg-secondary/50 text-muted-foreground px-2 py-0.5 rounded-md">
                                                        {formatDate(prompt.created_at, i18n.language)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Public Pagination Controls */}
                                        {filteredPublicPrompts.length > 0 && (
                                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                                                <div className="text-sm text-muted-foreground">
                                                    {t('list.showing', { start: Math.min(filteredPublicPrompts.length, (publicCurrentPage - 1) * publicItemsPerPage + 1), end: Math.min(filteredPublicPrompts.length, publicCurrentPage * publicItemsPerPage), total: filteredPublicPrompts.length })}
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-muted-foreground">{t('list.show')}</span>
                                                        <select
                                                            value={publicItemsPerPage}
                                                            onChange={(e) => { setPublicItemsPerPage(Number(e.target.value)); setPublicCurrentPage(1); }}
                                                            className="text-sm bg-transparent border-none p-0 focus:outline-none focus:ring-0 text-foreground font-medium cursor-pointer"
                                                        >
                                                            <option value={10}>10</option>
                                                            <option value={50}>50</option>
                                                        </select>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => setPublicCurrentPage(p => Math.max(1, p - 1))}
                                                            disabled={publicCurrentPage === 1}
                                                            className="text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                        >
                                                            {t('list.previous')}
                                                        </button>
                                                        <button
                                                            onClick={() => setPublicCurrentPage(p => Math.min(Math.ceil(filteredPublicPrompts.length / publicItemsPerPage), p + 1))}
                                                            disabled={publicCurrentPage >= Math.ceil(filteredPublicPrompts.length / publicItemsPerPage)}
                                                            className="text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                        >
                                                            {t('list.next')}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">{t('landing.no_public_prompts')}</p>
                                )}
                            </section>
                        </div>

                        {/* Compact Auth Form */}
                        <aside className="w-full lg:w-80 flex-shrink-0 sticky top-20">
                            <div className="bg-card border border-border rounded-md p-6 shadow-sm">
                                <form onSubmit={handleAuth} className="space-y-3">
                                    {authMode === 'register' && (
                                        <div>
                                            <label className="block text-xs font-medium text-foreground mb-1">{t('auth.name')}</label>
                                            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} required placeholder={t('auth.placeholders.name')} disabled={authSubmitting} className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50" />
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-xs font-medium text-foreground mb-1">{t('auth.email')}</label>
                                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder={t('auth.placeholders.email')} disabled={authSubmitting} className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-foreground mb-1">{t('auth.password')}</label>
                                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder={t('auth.placeholders.password')} disabled={authSubmitting} className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50" />
                                    </div>
                                    {authError && <p className="text-xs text-destructive">{authError}</p>}
                                    <button type="submit" disabled={authSubmitting} className="w-full py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm">
                                        {authSubmitting ? t('auth.processing') : (authMode === 'login' ? t('auth.login') : t('auth.register'))}
                                    </button>
                                </form>
                                <div className="mt-4 text-center">
                                    <p className="text-xs text-muted-foreground">
                                        {authMode === 'login' ? t('auth.no_account') : t('auth.have_account')}{' '}
                                        <button
                                            onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }}
                                            className="text-primary hover:underline font-medium"
                                        >
                                            {authMode === 'login' ? t('auth.switch_to_register') : t('auth.switch_to_login')}
                                        </button>
                                    </p>
                                </div>
                            </div>

                            {/* Public Tags Section (Moved) */}
                            <div className="bg-card border border-border rounded-md p-6 shadow-sm mt-6">
                                <h2 className="text-sm font-medium text-muted-foreground mb-3">{t('landing.public_tags_title')}</h2>
                                {publicTags.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => { setSelectedPublicTag(null); setPublicCurrentPage(1); }}
                                            className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${selectedPublicTag === null
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                                }`}
                                        >
                                            {t('list.all')}
                                        </button>
                                        {publicTags.map(tag => (
                                            <button
                                                key={tag.name}
                                                onClick={() => { setSelectedPublicTag(tag.name); setPublicCurrentPage(1); }}
                                                className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${selectedPublicTag === tag.name
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                                    }`}
                                            >
                                                {tag.name}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">{t('landing.no_public_tags')}</p>
                                )}
                            </div>
                        </aside>
                    </div>
                </div>
                {promptDetailModal}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background relative font-sans">
            <SEO structuredData={websiteSchema} />
            <header className="border-b border-border bg-card sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="Logo" className="w-8 h-8" />
                        <h1 className="text-xl font-bold font-mono text-foreground tracking-tight">prompedia.app</h1>
                    </div>
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => i18n.changeLanguage(i18n.resolvedLanguage === 'id' ? 'en' : 'id')}
                            className="text-muted-foreground hover:text-foreground transition-colors p-1"
                            title={i18n.resolvedLanguage === 'id' ? 'Ganti ke Bahasa Inggris' : 'Switch to Indonesian'}
                        >
                            <Globe className="h-[1.2rem] w-[1.2rem]" />
                            <span className="sr-only">{i18n.resolvedLanguage === 'id' ? 'English' : 'Indonesia'}</span>
                        </button>
                        <button
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            className="text-muted-foreground hover:text-foreground transition-colors p-1"
                            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                        >
                            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 block dark:hidden" />
                            <Moon className="h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 hidden dark:block" />
                            <span className="sr-only">Toggle theme</span>
                        </button>
                        <span className="text-sm-md text-muted-foreground border-r border-border pr-6 mr-0">
                            {user?.email}
                        </span>
                        <button onClick={() => setShowLogoutConfirm(true)} className="text-sm-md text-muted-foreground hover:text-foreground transition-colors font-normal">
                            {t('auth.logout')}
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6">
                <main className="flex-1 min-w-0">
                    <div className="mb-6">
                        <input type="text" value={filter} onChange={e => setFilter(e.target.value)} placeholder={t('prompt.search_placeholder')} className="w-full px-3 py-2.5 bg-card border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                    </div>

                    <div className="mb-8 bg-card border border-border rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-4">
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder={t('prompt.title_placeholder')} className="flex-1 py-2 bg-transparent text-sm font-bold font-mono text-foreground placeholder:text-muted-foreground focus:outline-none" />
                            <span className="text-2xs font-medium px-1.5 py-0.5 rounded border border-border text-muted-foreground bg-secondary/30 flex-shrink-0">
                                {isPublic ? t('prompt.public') : t('prompt.private')}
                            </span>
                        </div>
                        <MarkdownEditor
                            value={content}
                            onChange={setContent}
                            placeholder={t('prompt.content_placeholder')}
                            minHeight="200px"
                        />

                        <div className="mt-4">
                            <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                                <div className="flex-1">
                                    <input type="text" value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder={t('prompt.tags_placeholder')} className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                                </div>
                                <div className="flex items-center gap-4 flex-shrink-0">
                                    <div className="flex items-center gap-2 group">
                                        <input type="checkbox" id="isPublic" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="rounded border-border text-primary focus:ring-primary h-4 w-4 accent-primary cursor-pointer" />
                                        <label htmlFor="isPublic" className="text-sm text-muted-foreground select-none cursor-pointer whitespace-nowrap group-hover:text-foreground transition-colors">{t('prompt.public')}</label>
                                    </div>
                                    <button onClick={handleSave} disabled={!content.trim() || saving} className="text-sm font-medium text-foreground hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap">{saving ? t('prompt.saving') : editingId ? t('prompt.update') : t('prompt.save')}</button>
                                </div>
                            </div>
                            {editingId && <button onClick={() => { setTitle(''); setContent(''); setTagsInput(''); setIsPublic(false); setEditingId(null); }} className="mt-2 text-sm text-muted-foreground hover:text-foreground transition-colors">{t('prompt.cancel_edit')}</button>}
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-semibold text-muted-foreground">{t('list.title', { count: filteredPrompts.length })}</h2>
                            <div className="flex gap-4 items-center">
                                <button onClick={() => setVisibilityFilter('all')} className={`text-sm transition-colors ${visibilityFilter === 'all' ? 'font-medium text-foreground underline decoration-primary underline-offset-4' : 'text-muted-foreground hover:text-foreground'}`}>{t('list.all')}</button>
                                <button onClick={() => setVisibilityFilter('public')} className={`text-sm transition-colors ${visibilityFilter === 'public' ? 'font-medium text-foreground underline decoration-primary underline-offset-4' : 'text-muted-foreground hover:text-foreground'}`}>{t('prompt.public')}</button>
                                <button onClick={() => setVisibilityFilter('private')} className={`text-sm transition-colors ${visibilityFilter === 'private' ? 'font-medium text-foreground underline decoration-primary underline-offset-4' : 'text-muted-foreground hover:text-foreground'}`}>{t('prompt.private')}</button>
                            </div>
                        </div>

                        {filteredPrompts.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">{prompts.length === 0 ? t('list.empty') : t('list.no_match')}</div>
                        ) : (
                            <div className="grid gap-3">
                                {paginatedPrompts.map(prompt => (
                                    <div
                                        key={prompt.id}
                                        onClick={() => setSelectedPrompt(prompt)}
                                        className={`flex flex-col p-3 bg-card border rounded-lg hover:border-primary/50 transition-colors cursor-pointer ${editingId === prompt.id ? 'border-primary' : 'border-border'}`}
                                    >
                                        {/* Top: Title & Badge */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                                {prompt.title}
                                            </h3>
                                            <span className="text-2xs font-medium px-1.5 py-0.5 rounded border border-border text-muted-foreground bg-secondary/30 flex-shrink-0">
                                                {formatDate(prompt.created_at, i18n.language)}
                                            </span>
                                            <span className="text-2xs font-medium px-1.5 py-0.5 rounded border border-border text-muted-foreground bg-secondary/30 flex-shrink-0">
                                                {prompt.is_public ? t('prompt.public') : t('prompt.private')}
                                            </span>
                                        </div>

                                        {/* Bottom: Tags & Actions */}
                                        <div className="flex items-end justify-between gap-4 mt-auto">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {prompt.tags.map((tag, i) => (
                                                    <span key={i} className="font-normal text-xs-sm bg-secondary/50 px-1.5 py-0.5 rounded text-foreground/80 leading-none">{tag.name}</span>
                                                ))}
                                            </div>

                                            <div className="flex items-center gap-3 flex-shrink-0" onClick={e => e.stopPropagation()}>
                                                {prompt.is_public && (
                                                    <button
                                                        onClick={() => {
                                                            const url = `${window.location.origin}/share/${prompt.id}`;
                                                            navigator.clipboard.writeText(url);
                                                            showToast(t('toast.link_copied', 'Link copied to clipboard'));
                                                        }}
                                                        className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline transition-colors"
                                                    >
                                                        {t('actions.share', 'Share')}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleCopy(prompt.content)}
                                                    className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline transition-colors"
                                                >
                                                    {t('actions.copy')}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(prompt.id)}
                                                    className="text-xs font-medium text-muted-foreground hover:text-destructive hover:underline transition-colors"
                                                >
                                                    {t('actions.delete')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination Controls */}
                        {filteredPrompts.length > 0 && (
                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                                <div className="text-sm text-muted-foreground">
                                    {t('list.showing', { start: Math.min(filteredPrompts.length, (currentPage - 1) * itemsPerPage + 1), end: Math.min(filteredPrompts.length, currentPage * itemsPerPage), total: filteredPrompts.length })}
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">{t('list.show')}</span>
                                        <select
                                            value={itemsPerPage}
                                            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                            className="text-sm bg-transparent border-none p-0 focus:outline-none focus:ring-0 text-foreground font-medium cursor-pointer"
                                        >
                                            <option value={10}>10</option>
                                            <option value={50}>50</option>
                                        </select>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {t('list.previous')}
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredPrompts.length / itemsPerPage), p + 1))}
                                            disabled={currentPage >= Math.ceil(filteredPrompts.length / itemsPerPage)}
                                            className="text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {t('list.next')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>

                <aside className="hidden lg:block w-56 flex-shrink-0">
                    <div className="sticky top-20">
                        <h2 className="text-sm font-semibold text-muted-foreground mb-3">{t('sidebar.title', { count: allUserTags.length })}</h2>
                        {allUserTags.length === 0 ? <p className="text-sm text-muted-foreground">{t('sidebar.no_tags')}</p> : (
                            <div className="flex flex-wrap gap-2">
                                {allUserTags.map(tag => (
                                    <button key={tag.id} onClick={() => handleTagFilter(tag.name)} className={`tag cursor-pointer hover:text-foreground transition-colors ${filter.toLowerCase() === tag.name.toLowerCase() ? 'text-primary font-medium underline decoration-primary underline-offset-4' : 'text-muted-foreground'}`}>{tag.name}</button>
                                ))}
                            </div>
                        )}
                        {filter && <button onClick={() => setFilter('')} className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors">{t('sidebar.clear_filter')}</button>}
                    </div>
                </aside>
            </div>

            {toast.visible && (
                <div className={`fixed z-50 bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-foreground text-background text-sm font-medium rounded-md shadow-lg ${toast.exiting ? 'toast-exit' : 'toast-enter'}`}>
                    {toast.message}
                </div>
            )}

            {/* Prompt Detail Modal */}
            {promptDetailModal}

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)}>
                    <div className="w-full max-w-sm bg-card border border-border rounded-lg shadow-lg p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-base font-semibold text-foreground mb-2">{t('auth.logout_confirm_title')}</h3>
                        <p className="text-sm text-muted-foreground mb-6">{t('auth.logout_confirm_desc')}</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowLogoutConfirm(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">{t('actions.cancel')}</button>
                            <button onClick={() => { handleLogout(); setShowLogoutConfirm(false); }} className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">{t('auth.logout')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {confirmDeleteId && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={() => setConfirmDeleteId(null)}>
                    <div className="w-full max-w-sm bg-card border border-border rounded-lg shadow-lg p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-base font-semibold text-foreground mb-2">{t('prompt.delete_confirm')}</h3>
                        <p className="text-sm text-muted-foreground mb-6">{t('prompt.delete_warning')}</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setConfirmDeleteId(null)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">{t('actions.cancel')}</button>
                            <button onClick={() => { performDelete(confirmDeleteId); setConfirmDeleteId(null); }} className="px-4 py-2 text-sm font-medium bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors">{t('actions.delete')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PromptNotes;
