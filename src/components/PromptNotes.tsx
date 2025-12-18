import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { useTheme } from "next-themes";
import { Moon, Sun, Globe } from "lucide-react";
import { User } from '@supabase/supabase-js';

// Interfaces based on Supabase schema
interface Tag {
    id: string;
    name: string;
}

interface Prompt {
    id: string;
    user_id: string;
    title: string;
    content: string;
    is_public: boolean;
    tags?: { tags: Tag }[];
    users?: {
        username: string | null;
        display_name: string | null;
    } | null;
    created_at: string;
    updated_at: string;
}

interface PromptUI extends Omit<Prompt, 'tags' | 'users'> {
    tags: Tag[]; // Flattened tags
    author: string;
}

interface ToastState {
    visible: boolean;
    message: string;
    exiting: boolean;
}

type VisibilityFilter = 'all' | 'public' | 'private';

const PromptNotes = () => {
    const { t, i18n } = useTranslation();
    // Auth state
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [showAuth, setShowAuth] = useState(false);

    // Auth form
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState('');
    const [authSubmitting, setAuthSubmitting] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

    // Data state
    const [prompts, setPrompts] = useState<PromptUI[]>([]);
    const [allUserTags, setAllUserTags] = useState<Tag[]>([]);

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
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-expand textarea
    const autoExpand = useCallback(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.max(200, textarea.scrollHeight)}px`;
        }
    }, []);

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

    // Load Data
    const loadData = useCallback(async () => {
        if (!user) return;

        const { data: promptsData, error: promptsError } = await supabase
            .from('prompts')
            .select('*, prompt_tags(tags(id, name)), users(username, display_name)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (!promptsError && promptsData) {
            const formattedPrompts: PromptUI[] = promptsData.map((p: any) => ({
                id: p.id,
                user_id: p.user_id,
                title: p.title || t('prompt.untitled'),
                content: p.content,
                is_public: p.is_public || false,
                created_at: p.created_at,
                updated_at: p.updated_at,
                tags: p.prompt_tags ? p.prompt_tags.map((pt: any) => pt.tags).filter(Boolean) : [],
                author: p.users?.display_name || p.users?.username || t('prompt.unknown_author')
            }));
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
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) setAuthError(error.message);
            else {
                showToast(t('toast.success'));
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
                const { error } = await supabase
                    .from('prompts')
                    .update({
                        title: promptTitle,
                        content: content.trim(),
                        is_public: isPublic,
                        updated_at: now
                    })
                    .eq('id', promptId)
                    .eq('user_id', user.id);

                if (error) throw error;
            } else {
                const newId = crypto.randomUUID();
                const { error } = await supabase.from('prompts').insert({
                    id: newId,
                    user_id: user.id,
                    title: promptTitle,
                    content: content.trim(),
                    is_public: isPublic,
                    is_featured: false
                });

                if (error) throw error;
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
            textareaRef.current?.focus();

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
        setIsPublic(prompt.is_public);
        setEditingId(prompt.id);
        textareaRef.current?.focus();
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

    useEffect(() => {
        if (user && textareaRef.current) textareaRef.current.focus();
    }, [user]);

    useEffect(() => {
        autoExpand();
    }, [content, autoExpand]);

    if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

    if (showAuth || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="w-full max-w-sm">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-semibold text-foreground">{t('app.title')}</h1>
                        <p className="text-sm text-muted-foreground mt-2">{t('app.description')}</p>
                    </div>
                    <form onSubmit={handleAuth} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">{t('auth.email')}</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder={t('auth.placeholders.email')} disabled={authSubmitting} className="w-full px-3 py-2.5 bg-card border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">{t('auth.password')}</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder={t('auth.placeholders.password')} disabled={authSubmitting} className="w-full px-3 py-2.5 bg-card border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50" />
                        </div>
                        {authError && <p className="text-sm text-destructive">{authError}</p>}
                        <button type="submit" disabled={authSubmitting} className="w-full py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors">
                            {authSubmitting ? t('auth.processing') : (authMode === 'login' ? t('auth.login') : t('auth.register'))}
                        </button>
                    </form>
                    <div className="mt-6 text-center">
                        <p className="text-sm text-muted-foreground">
                            {authMode === 'login' ? t('auth.no_account') : t('have_account')}{' '}
                            <button
                                onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }}
                                className="text-primary hover:underline font-medium"
                            >
                                {authMode === 'login' ? t('auth.switch_to_register') : t('auth.switch_to_login')}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background relative font-sans">
            <header className="border-b border-border bg-card">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                    <h1 className="text-base font-semibold text-foreground">{t('app.title')}</h1>
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
                        <span className="text-[13px] text-muted-foreground border-r border-border pr-6 mr-0">
                            {user?.email}
                        </span>
                        <button onClick={() => setShowLogoutConfirm(true)} className="text-[13px] text-muted-foreground hover:text-foreground transition-colors font-normal">
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
                        <div className="flex items-center gap-3 border-b border-border mb-4">
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder={t('prompt.title_placeholder')} className="flex-1 py-2 bg-transparent text-sm font-bold font-mono text-foreground placeholder:text-muted-foreground focus:outline-none" />
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-border text-muted-foreground bg-secondary/30 flex-shrink-0">
                                {isPublic ? t('prompt.public') : t('prompt.private')}
                            </span>
                        </div>
                        <textarea ref={textareaRef} value={content} onChange={e => setContent(e.target.value)} placeholder={t('prompt.content_placeholder')} className="w-full min-h-[200px] bg-transparent text-sm leading-[1.7] text-foreground placeholder:text-muted-foreground focus:outline-none resize-none textarea-auto-expand font-mono" />

                        <div className="mt-4 pt-4 border-t border-border">
                            <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                                <div className="flex-1">
                                    <input type="text" value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder={t('prompt.tags_placeholder')} className="w-full px-3 py-2 bg-background border border-border rounded-md text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
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
                                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-border text-muted-foreground bg-secondary/30 flex-shrink-0">
                                                {prompt.is_public ? t('prompt.public') : t('prompt.private')}
                                            </span>
                                        </div>

                                        {/* Bottom: Tags & Actions */}
                                        <div className="flex items-end justify-between gap-4 mt-auto">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {prompt.tags.map((tag, i) => (
                                                    <span key={i} className="font-normal text-[11px] bg-secondary/50 px-1.5 py-0.5 rounded text-foreground/80 leading-none">{tag.name}</span>
                                                ))}
                                            </div>

                                            <div className="flex items-center gap-3 flex-shrink-0" onClick={e => e.stopPropagation()}>
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
                    <div className="sticky top-6">
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
            {selectedPrompt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={() => setSelectedPrompt(null)}>
                    <div className="w-full max-w-2xl bg-card border border-border rounded-lg shadow-md flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-border flex items-start justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-xl font-semibold font-mono text-foreground">{selectedPrompt.title}</h3>
                                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-border text-muted-foreground bg-secondary/30 flex-shrink-0">
                                        {selectedPrompt.is_public ? t('prompt.public') : t('prompt.private')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs text-muted-foreground">{t('prompt.by', { author: selectedPrompt.author })}</span>
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
                            <button
                                onClick={() => handleEdit(selectedPrompt)}
                                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {t('actions.edit')}
                            </button>
                            <button
                                onClick={() => handleCopy(selectedPrompt.content)}
                                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                            >
                                {t('actions.copy')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
