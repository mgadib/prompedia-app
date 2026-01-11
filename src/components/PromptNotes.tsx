import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { useIdleLogout } from '@/hooks/use-idle-logout';

import { Copy, Share2, Trash2 } from "lucide-react";
import { User } from '@supabase/supabase-js';

import { Tables } from '@/integrations/supabase/types';
import { formatDate } from '@/lib/date-utils';
import { Button } from '@/components/ui/button';
import { TagChipStatic } from '@/components/ui/tag-chip';
import { StatusBadge } from '@/components/ui/status-badge';
import { SEO } from '@/components/SEO';

// Refactored Components
import { AuthScreen } from '@/components/auth/AuthScreen';
import { PromptList } from '@/components/prompts/PromptList';
import { PromptEditor } from '@/components/prompts/PromptEditor';
import { FilterBar, MobileFilterButton } from '@/components/prompts/FilterBar';
import { usePrompts, PromptUI } from '@/hooks/use-prompts';
import { TagChip } from './ui/tag-chip';
import { MarkdownPreview } from '@/components/editor/MarkdownPreview';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';

// Local Types
interface Tag extends Tables<'tags'> { }

interface ToastState {
    visible: boolean;
    message: string;
    exiting: boolean;
}

type VisibilityFilter = 'all' | 'public' | 'private';

const PromptNotes = () => {
    const { t, i18n } = useTranslation();

    // --- State ---

    // Auth
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [showAuth, setShowAuth] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [authError, setAuthError] = useState('');
    const [authSubmitting, setAuthSubmitting] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    // Public Landing Data
    const [publicTags, setPublicTags] = useState<{ name: string; count: number }[]>([]);
    const [publicPrompts, setPublicPrompts] = useState<any[]>([]); // simplified type for landing logic
    const [selectedPublicTag, setSelectedPublicTag] = useState<string | null>(null);
    const [publicCurrentPage, setPublicCurrentPage] = useState(1);
    const [publicItemsPerPage, setPublicItemsPerPage] = useState(10);

    // Filter & Pagination State
    const [filter, setFilter] = useState('');
    const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('all');
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // Editor & Active Prompt State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tagsInput, setTagsInput] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [selectedPrompt, setSelectedPrompt] = useState<PromptUI | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    // Toast State
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

    // Other Data
    const [allUserTags, setAllUserTags] = useState<Tag[]>([]);

    // --- Queries ---

    // React Query implementation for main functionality
    // Note: We use manual refetching for simplicity in actions or invalidate queries
    const {
        data: promptsData,
        isLoading: isPromptsLoading,
        refetch: refetchPrompts
    } = usePrompts({
        userId: user?.id,
        page: currentPage,
        pageSize: itemsPerPage,
        filterText: filter,
        filterTag: filter, // Using same input for simplicity as per UI
        visibility: visibilityFilter,
        enabled: !!user
    });

    // Extract data from Query
    const prompts = promptsData?.prompts || [];
    const totalItems = promptsData?.total || 0;

    // --- Side Effects & Loaders ---

    // Auth Check
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

    // Auto-logout setelah 27 menit tidak aktif
    useIdleLogout({
        timeoutMs: 27 * 60 * 1000, // 27 minutes
        onLogout: () => setShowAuth(true),
        enabled: !!user, // Hanya aktif jika user sudah login
    });

    // Load Tags (Separate from prompts for now)
    const loadTags = useCallback(async () => {
        if (!user) return;
        const { data, error } = await supabase.from('tags').select('*').eq('user_id', user.id).order('name');
        if (!error && data) setAllUserTags(data);
    }, [user]);

    useEffect(() => {
        loadTags();
    }, [loadTags]);

    // Public Data Fetcher (unchanged logic)
    const fetchPublicData = useCallback(async () => {
        const { data: promptsData, error } = await supabase
            .from('prompts')
            .select('id, title, created_at, is_public, user_id, prompt_tags(tags(id, name)), users(username, display_name), prompt_contents(body)')
            .eq('is_public', true)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) return;

        if (promptsData) {
            const formatted = promptsData.map((p: any) => {
                const bodyText = p.prompt_contents?.body || '';
                return {
                    id: p.id,
                    title: p.title || t('prompt.untitled'),
                    content: bodyText,
                    description: bodyText.length > 150 ? bodyText.substring(0, 150) + '...' : bodyText,
                    is_public: true,
                    tags: p.prompt_tags?.map((pt: any) => pt.tags).filter(Boolean) || [],
                    author: p.users?.display_name || p.users?.username || t('prompt.unknown_author'),
                    created_at: p.created_at,
                    user_id: p.user_id || ''
                };
            });
            setPublicPrompts(formatted);

            const tagCounts: Record<string, number> = {};
            formatted.forEach(p => {
                p.tags.forEach((tag: { id: string; name: string }) => {
                    tagCounts[tag.name] = (tagCounts[tag.name] || 0) + 1;
                });
            });
            setPublicTags(Object.entries(tagCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count));
        }
    }, [t]);

    useEffect(() => {
        if (!user && showAuth) fetchPublicData();
    }, [user, showAuth, fetchPublicData]);

    // Scroll Lock when modal is open
    useEffect(() => {
        const isModalOpen = !!selectedPrompt || !!confirmDeleteId || showLogoutConfirm;
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
            // Add padding to prevent layout shift if scrollbar disappears
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            if (scrollbarWidth > 0) {
                document.body.style.paddingRight = `${scrollbarWidth}px`;
            }
        } else {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }
        return () => {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        };
    }, [selectedPrompt, confirmDeleteId, showLogoutConfirm]);

    // --- Handlers ---

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError('');
        setAuthSubmitting(true);

        try {
            if (authMode === 'login') {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) {
                    // Handle rate limit error
                    if (error.message.toLowerCase().includes('rate limit') || error.status === 429) {
                        setAuthError(t('auth.error.rate_limited'));
                    } else {
                        setAuthError(error.message);
                    }
                } else {
                    setEmail('');
                    setPassword('');
                }
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { display_name: displayName, username: email.split('@')[0] } }
                });
                if (error) {
                    // Handle rate limit error
                    if (error.message.toLowerCase().includes('rate limit') || error.status === 429) {
                        setAuthError(t('auth.error.rate_limited'));
                    } else {
                        setAuthError(error.message);
                    }
                } else {
                    showToast(t('toast.registration_success'));
                    setAuthMode('login');
                }
            }
        } catch {
            setAuthError(t('auth.error.generic'));
        }
        setAuthSubmitting(false);
    };

    const handleLogout = async () => {
        // Use local scope to avoid 403 on global signout when session is invalid
        await supabase.auth.signOut({ scope: 'local' });
        setShowAuth(true);
    };

    const handleSave = useCallback(async () => {
        if (!user || !content.trim() || saving) return;
        setSaving(true);
        // ... (Keep existing complex logic, refactored slightly to not rely on loadData monolithic) 
        // For brevity in this artifact, I'll assume the same logic 
        // but call refetchPrompts() and loadTags() at end instead of loadData()

        try {
            const promptTitle = title.trim() || content.trim().slice(0, 50);
            let promptId = editingId;
            const now = new Date().toISOString();

            if (promptId) {
                const { error } = await supabase.from('prompts').update({ title: promptTitle, is_public: isPublic, updated_at: now }).eq('id', promptId).eq('user_id', user.id);
                if (error) throw error;
                const { error: contentError } = await supabase.from('prompt_contents').upsert({ prompt_id: promptId, body: content.trim() });
                if (contentError) throw contentError;
            } else {
                const newId = crypto.randomUUID();
                const { error } = await supabase.from('prompts').insert({ id: newId, user_id: user.id, title: promptTitle, is_public: isPublic });
                if (error) throw error;
                const { error: contentError } = await supabase.from('prompt_contents').insert({ prompt_id: newId, body: content.trim() });
                if (contentError) throw contentError;
                promptId = newId;
            }

            // Tag Logic (Simplified)
            const tagNames = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
            const uniqueTagNames = [...new Set(tagNames)];
            if (uniqueTagNames.length > 0) {
                // ... same tag logic ...
                const { data: existingTags } = await supabase.from('tags').select('id, name').eq('user_id', user.id).in('name', uniqueTagNames);
                const existingTagMap = new Map(existingTags?.map(t => [t.name, t.id]));
                const missingTags = uniqueTagNames.filter(name => !existingTagMap.has(name));

                const tagIdsToLink: string[] = [];
                if (missingTags.length > 0) {
                    const { data: created } = await supabase.from('tags').insert(missingTags.map(name => ({ name, user_id: user.id }))).select('id, name');
                    created?.forEach(t => tagIdsToLink.push(t.id));
                }
                existingTagMap.forEach(id => tagIdsToLink.push(id));

                if (promptId) {
                    await supabase.from('prompt_tags').delete().eq('prompt_id', promptId);
                    if (tagIdsToLink.length > 0) await supabase.from('prompt_tags').insert(tagIdsToLink.map(tag_id => ({ prompt_id: promptId, tag_id })));
                }
            }

            refetchPrompts();
            loadTags();
            showToast(t('toast.saved'));
            setTitle(''); setContent(''); setTagsInput(''); setIsPublic(false); setEditingId(null);
        } catch (err) {
            console.error(err);
            showToast(t('toast.save_failed'));
        } finally {
            setSaving(false);
        }

    }, [user, title, content, tagsInput, isPublic, editingId, saving, refetchPrompts, loadTags, showToast, t]);

    const handleDeleteClick = useCallback((id: string) => {
        setConfirmDeleteId(id);
    }, []);

    const performDelete = async (id: string | null) => {
        if (!user || !id) return;
        const { error } = await supabase.from('prompts').delete().eq('id', id).eq('user_id', user.id);
        if (!error) {
            refetchPrompts();
            showToast(t('toast.deleted'));
            if (editingId === id) { setTitle(''); setContent(''); setTagsInput(''); setIsPublic(false); setEditingId(null); }
            if (selectedPrompt?.id === id) setSelectedPrompt(null);
        }
    };

    const handleEdit = (prompt: PromptUI) => {
        setTitle(prompt.title);
        setContent(prompt.content);
        setTagsInput(prompt.tags.map(t => t.name).join(', '));
        setIsPublic(Boolean(prompt.is_public));
        setEditingId(prompt.id);
        setSelectedPrompt(null);
    };

    const handleCopy = async (text: string) => {
        await navigator.clipboard.writeText(text);
        showToast(t('toast.copied'));
    };

    // --- Render Helpers ---

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

    const toastElement = toast.visible && (
        <div className={`fixed z-[100] bottom-10 left-1/2 -translate-x-1/2 px-4 py-2.5 bg-foreground text-background text-sm font-medium rounded-sm shadow-lg transition-all duration-normal flex items-center gap-2 ${toast.exiting ? 'opacity-0 translate-y-4 scale-95' : 'opacity-100 translate-y-0 scale-100'}`}>
            {toast.message}
        </div>
    );

    const promptDetailModal = selectedPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-background/80 backdrop-blur-sm" onClick={() => setSelectedPrompt(null)}>
            <div className="w-full max-w-[42rem] bg-card border border-border rounded-sm shadow-lg flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-border">
                    <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-base font-semibold text-foreground flex-1">{selectedPrompt.title}</h3>
                        <Button variant="ghost" size="sm" className="flex-shrink-0" onClick={() => setSelectedPrompt(null)}>{t('actions.close')}</Button>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {selectedPrompt.tags && selectedPrompt.tags.map(tag => (
                            <TagChipStatic key={tag.id} variant="default" size="sm">{tag.name}</TagChipStatic>
                        ))}
                        <StatusBadge variant={selectedPrompt.is_public ? 'public' : 'private'} size="sm">
                            {selectedPrompt.is_public ? t('prompt.public') : t('prompt.private')}
                        </StatusBadge>
                        <span className="text-xs text-muted-foreground">
                            {formatDate(selectedPrompt.created_at, i18n.language)}
                        </span>
                        <StatusBadge variant="date" size="sm">@{selectedPrompt.author}</StatusBadge>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    <MarkdownPreview content={selectedPrompt.content} className="text-sm" />
                </div>
                <div className="px-4 py-3 border-t border-border flex justify-end gap-2">
                    {user && user.id === selectedPrompt.user_id && (
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEdit(selectedPrompt)}
                            className="hover:bg-secondary hover:border-primary/20"
                        >
                            {t('actions.edit')}
                        </Button>
                    )}
                    {selectedPrompt.is_public && (
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={async () => {
                                const url = `${window.location.origin}/share/${selectedPrompt.id}`;
                                await navigator.clipboard.writeText(url);
                                showToast(t('toast.link_copied', 'Link copied to clipboard'));
                            }}
                            className="gap-1.5 hover:bg-accent/10 hover:text-accent hover:border-accent/30"
                        >
                            <Share2 className="w-4 h-4" />
                            <span>{t('actions.share', 'Share')}</span>
                        </Button>
                    )}
                    <Button 
                        variant="brand" 
                        size="sm" 
                        onClick={() => handleCopy(selectedPrompt.content)}
                        className="gap-1.5 hover:bg-action-hover"
                    >
                        <Copy className="w-4 h-4" />
                        <span>{t('actions.copy')}</span>
                    </Button>
                    {user && user.id === selectedPrompt.user_id && (
                        <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => handleDeleteClick(selectedPrompt.id)}
                            className="gap-1.5 hover:bg-destructive/90"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span>{t('actions.delete')}</span>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );

    if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

    if (showAuth || !user) {
        // Landing Page Mode
        // Re-implementing simplified Public Landing view using the data we fetched manually in fetchPublicData
        // (For rigorous refactor, this should also be a Component, but keeping it inline as it's a distinct mode)
        // Actually, we can reuse PromptList logic even for public prompts if we shape the data right, but let's keep the existing structure to minimize UI risk.

        const filteredPublicPrompts = selectedPublicTag ? publicPrompts.filter(p => p.tags.some((t: any) => t.name === selectedPublicTag)) : publicPrompts;
        const paginatedPublicPrompts = filteredPublicPrompts.slice((publicCurrentPage - 1) * publicItemsPerPage, publicCurrentPage * publicItemsPerPage);

        return (
            <div className="min-h-screen bg-background font-sans flex flex-col">
                <Header variant="default" />
                <div className="max-w-6xl mx-auto px-4 py-4 flex-1 w-full">
                    <div className="flex flex-col lg:flex-row gap-4 items-start">
                        <div className="flex-1 w-full min-w-0">
                            <div className="mb-6">
                                <div className="bg-card border border-border rounded-sm p-5 text-left">
                                    <h2 className="text-xl font-semibold tracking-tight sm:text-2xl mb-2 text-foreground">{t('app.tagline')}</h2>
                                    <p className="text-sm text-muted-foreground">{t('app.description')}</p>
                                </div>
                            </div>
                            <section className="min-h-[50vh]">
                                <h2 className="text-section-title text-foreground mb-4">{t('landing.recent_prompts_title')}</h2>
                                <PromptList
                                    prompts={paginatedPublicPrompts}
                                    onSelectPrompt={setSelectedPrompt}
                                    onCopy={handleCopy}
                                    onDeleteClick={() => { }} // No delete on public view
                                    onShare={async (id) => {
                                        const url = `${window.location.origin}/share/${id}`;
                                        await navigator.clipboard.writeText(url);
                                        showToast(t('toast.link_copied', 'Link copied to clipboard'));
                                    }}
                                    editingId={null}
                                    currentPage={publicCurrentPage}
                                    itemsPerPage={publicItemsPerPage}
                                    totalItems={filteredPublicPrompts.length}
                                    onPageChange={setPublicCurrentPage}
                                    onItemsPerPageChange={setPublicItemsPerPage}
                                    currentUserId={user?.id}
                                />
                            </section>
                        </div>
                        <AuthScreen
                            handleAuth={handleAuth}
                            authMode={authMode} setAuthMode={setAuthMode}
                            displayName={displayName} setDisplayName={setDisplayName}
                            email={email} setEmail={setEmail}
                            password={password} setPassword={setPassword}
                            authError={authError} setAuthError={setAuthError}
                            authSubmitting={authSubmitting}
                            publicTags={publicTags}
                            selectedPublicTag={selectedPublicTag}
                            setSelectedPublicTag={setSelectedPublicTag}
                            setPublicCurrentPage={setPublicCurrentPage}
                        />
                    </div>
                </div>
                {promptDetailModal}
                {toastElement}
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col relative font-sans">
            <SEO structuredData={websiteSchema} />
            <Header variant="authenticated" userEmail={user?.email} onLogout={() => setShowLogoutConfirm(true)} />

            <div className="max-w-6xl mx-auto px-4 py-4 flex-1 w-full flex flex-col md:flex-row gap-4">
                <main className="flex-1 min-w-0">
                    <div className="mb-4">
                        <input type="text" value={filter} onChange={e => setFilter(e.target.value)} placeholder={t('prompt.search_placeholder')} className="w-full px-2 py-1.5 bg-card border border-border rounded-sm text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
                    </div>

                    <PromptEditor
                        title={title} setTitle={setTitle}
                        content={content} setContent={setContent}
                        tagsInput={tagsInput} setTagsInput={setTagsInput}
                        isPublic={isPublic} setIsPublic={setIsPublic}
                        onSave={handleSave} onCancel={() => { setTitle(''); setContent(''); setTagsInput(''); setIsPublic(false); setEditingId(null); }}
                        isEditing={!!editingId} saving={saving}
                    />

                    {/* Mobile Filter for Tags */}
                    <MobileFilterButton
                        tags={allUserTags}
                        currentFilter={filter}
                        onFilterChange={setFilter}
                    />

                    <div className="min-h-[50vh]">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-section-title text-foreground">{t('list.title', { count: totalItems })}</h2>
                            <div className="flex gap-1 items-center">
                                <TagChip variant={visibilityFilter === 'all' ? 'active' : 'outline'} size="sm" onClick={() => setVisibilityFilter('all')}>{t('list.all')}</TagChip>
                                <TagChip variant={visibilityFilter === 'public' ? 'active' : 'outline'} size="sm" onClick={() => setVisibilityFilter('public')}>{t('prompt.public')}</TagChip>
                                <TagChip variant={visibilityFilter === 'private' ? 'active' : 'outline'} size="sm" onClick={() => setVisibilityFilter('private')}>{t('prompt.private')}</TagChip>
                            </div>
                        </div>

                        <PromptList
                            prompts={prompts}
                            isLoading={isPromptsLoading}
                            editingId={editingId}
                            onSelectPrompt={setSelectedPrompt}
                            onCopy={handleCopy}
                            onDeleteClick={handleDeleteClick}
                            onShare={(id) => {
                                const url = `${window.location.origin}/share/${id}`;
                                navigator.clipboard.writeText(url);
                                showToast(t('toast.link_copied', 'Link copied to clipboard'));
                            }}
                            currentPage={currentPage}
                            itemsPerPage={itemsPerPage}
                            totalItems={totalItems}
                            onPageChange={setCurrentPage}
                            onItemsPerPageChange={setItemsPerPage}
                            currentUserId={user?.id}
                        />
                    </div>
                </main>

                <FilterBar
                    tags={allUserTags}
                    currentFilter={filter}
                    onFilterChange={setFilter}
                />
            </div>

            <Footer />
            {toastElement}

            {promptDetailModal}

            {showLogoutConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 bg-background/80 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)}>
                    <div className="w-full max-w-sm bg-card border border-border rounded-sm shadow-lg p-4" onClick={e => e.stopPropagation()}>
                        <h3 className="text-base font-semibold text-foreground mb-1">{t('auth.logout_confirm_title')}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{t('auth.logout_confirm_desc')}</p>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setShowLogoutConfirm(false)}>{t('actions.cancel')}</Button>
                            <Button variant="brand" size="sm" onClick={() => { handleLogout(); setShowLogoutConfirm(false); }}>{t('auth.logout')}</Button>
                        </div>
                    </div>
                </div>
            )}

            {confirmDeleteId && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 bg-background/80 backdrop-blur-sm" onClick={() => setConfirmDeleteId(null)}>
                    <div className="w-full max-w-sm bg-card border border-border rounded-sm shadow-lg p-4" onClick={e => e.stopPropagation()}>
                        <h3 className="text-base font-semibold text-foreground mb-1">{t('prompt.delete_confirm')}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{t('prompt.delete_warning')}</p>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteId(null)}>{t('actions.cancel')}</Button>
                            <Button variant="destructive" size="sm" onClick={() => { performDelete(confirmDeleteId); setConfirmDeleteId(null); }}>{t('actions.delete')}</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PromptNotes;
