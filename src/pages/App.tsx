import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Hash, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Sidebar from '@/components/Sidebar';
import PromptEditor from '@/components/PromptEditor';
import MyLibrary from '@/components/MyLibrary';
import PublicLibrary from '@/components/PublicLibrary';
import AuthModal from '@/components/AuthModal';
import PromptCard from '@/components/PromptCard';
import { storage, Prompt, Tag } from '@/lib/storage';
import { useIsMobile } from '@/hooks/use-mobile';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';

interface PromptWithTags extends Prompt {
  tags: Tag[];
}
import { storageManager } from '@/lib/storage-manager';
import SEO from '@/components/SEO';
import { AVAILABLE_MODELS } from '@/lib/models';
import { THINKING_MODES } from '@/lib/modes';
import { SupabaseService } from '@/lib/supabase-service';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { showSuccessToast, showErrorToast, showWarningToast } from '@/lib/toast-helpers';
import { rateLimitingService } from '@/lib/rate-limiting';
import { ENV, STORAGE_KEYS } from '@/lib/constants';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { TagService } from '@/lib/tag-service';
import { trackEvent } from '@/lib/analytics';
import PromptDetailModal from '@/components/PromptDetailModal';


const AppPage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [activeView, setActiveView] = useState<'my-library' | 'public-library'>('public-library');
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [showEditor, setShowEditor] = useState(true); // Default to playground
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [allPrompts, setAllPrompts] = useState<Prompt[]>([]);
  const [publicPrompts, setPublicPrompts] = useState<Prompt[]>([]);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const params = useParams<{ name?: string }>();
  const activeTagName = params.name ? decodeURIComponent(params.name) : null;
  const isTagView = Boolean(activeTagName);
  const [tagPrompts, setTagPrompts] = useState<PromptWithTags[]>([]);
  const [isTagLoading, setIsTagLoading] = useState(false);
  const [tagError, setTagError] = useState<string | null>(null);
  const [selectedTagPrompt, setSelectedTagPrompt] = useState<PromptWithTags | null>(null);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);

  const tagPageTitle = useMemo(() => {
    if (!activeTagName) return null;
    return `Tag: ${activeTagName} — ${ENV.SITE_TITLE}`;
  }, [activeTagName]);
  const contentViewKey = isTagView
    ? `tag-${activeTagName || 'none'}`
    : `${showEditor}-${activeView}`;

  // Handle navigation state from tag page
  useEffect(() => {
    const state = location.state as any;
    if (state?.targetView) {
      setActiveView(state.targetView);
      setShowEditor(false);
      // Clear state
      navigate(location.pathname, { replace: true, state: {} });
    } else if (state?.openPlayground) {
      setShowEditor(true);
      // Clear state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  const loadTagPrompts = useCallback(async () => {
    if (!activeTagName) return;

    setIsTagLoading(true);
    setTagError(null);

    try {
      let currentUser = user;

      if (!currentUser) {
        const {
          data: { user: supabaseUser },
        } = await supabase.auth.getUser();

        if (supabaseUser) {
          setUser(supabaseUser);
          currentUser = supabaseUser;
        }
      }

      const promptList = await TagService.getPromptsByTagName(
        activeTagName,
        currentUser?.id
      );
      setTagPrompts(promptList);
    } catch (error) {
      const message = (error as Error)?.message || t('errors:tag.loadFailed');
      setTagError(message);
      setTagPrompts([]);
    } finally {
      setIsTagLoading(false);
    }
  }, [activeTagName, t, user]);

  useEffect(() => {
    if (!isTagView) {
      setTagPrompts([]);
      setTagError(null);
      setIsTagModalOpen(false);
      setSelectedTagPrompt(null);
      return;
    }

    loadTagPrompts();
  }, [isTagView, loadTagPrompts, activeTagName]);

  const handleTagCardClick = (prompt: PromptWithTags) => {
    setSelectedTagPrompt(prompt);
    setIsTagModalOpen(true);
    trackEvent('open_prompt_modal', { prompt_id: prompt.id }, user?.id ?? undefined);
  };

  const handleCloseTagModal = () => {
    setIsTagModalOpen(false);
    setSelectedTagPrompt(null);
  };

  const handleTagCopy = useCallback(
    async (prompt: PromptWithTags) => {
      try {
        await navigator.clipboard.writeText(prompt.content);
        showSuccessToast('success:prompt.contentCopied');
        trackEvent('copy_prompt_content', { prompt_id: prompt.id }, user?.id ?? undefined);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Failed to copy prompt content:', error);
        }
        showErrorToast('errors:prompt.copyFailed');
      }
    },
    [user?.id]
  );

  const handleTagCopyUrl = useCallback(
    async (promptId: string) => {
      try {
        const base = ENV.SITE_URL || window.location.origin;
        const url = `${base}/p/${promptId}`;
        await navigator.clipboard.writeText(url);
        showSuccessToast('success:prompt.urlCopied');
        trackEvent('copy_prompt_url', { prompt_id: promptId }, user?.id ?? undefined);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Failed to copy prompt URL:', error);
        }
        showErrorToast('errors:prompt.copyFailed');
      }
    },
    [user?.id]
  );

  const handleTagUse = useCallback(
    (prompt: PromptWithTags) => {
      navigate(`/?use=${encodeURIComponent(prompt.id)}`);
      showSuccessToast('success:prompt.loadedForEditing');
      trackEvent('use_prompt', { prompt_id: prompt.id }, user?.id ?? undefined);
    },
    [navigate, user?.id]
  );

  const handleUsePromptFromModal = useCallback(
    (prompt: Prompt) => {
      navigate(`/?use=${encodeURIComponent(prompt.id)}`);
      showSuccessToast('success:prompt.loadedForEditing');
      trackEvent('use_prompt', { prompt_id: prompt.id }, user?.id ?? undefined);
    },
    [navigate, t, user?.id]
  );

  const handleCopyPromptFromModal = useCallback(
    async (prompt: Prompt) => {
      try {
        await navigator.clipboard.writeText(prompt.content);
        showSuccessToast('success:prompt.contentCopied');
        trackEvent('copy_prompt_content', { prompt_id: prompt.id }, user?.id ?? undefined);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Failed to copy prompt content:', error);
        }
        showErrorToast('errors:prompt.copyFailed');
      }
    },
    [user?.id]
  );

  const renderTagContent = () => (
    <div key={contentViewKey} className="flex h-full flex-col">
      {tagPageTitle && (
        <SEO
          title={tagPageTitle}
          description={t('library:tagPageDescription', { tag: activeTagName })}
          tags={activeTagName ? [activeTagName] : undefined}
        />
      )}

      {isMobile ? (
        <div className="md:hidden border-b border-border bg-card flex-shrink-0 px-4 py-3 flex items-center gap-3 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileSidebarOpen(true)}
            className="h-9 w-9 touch-manipulation"
            aria-label={t('common:labels.openMenu')}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Hash className="w-5 h-5 text-prompedia-green-400" />
            <h1 className="text-sm font-semibold font-mono truncate">{activeTagName || t('common:labels.tag')}</h1>
          </div>
        </div>
      ) : (
        <div className="border-b border-border bg-card flex-shrink-0 px-4 py-3 flex items-center gap-3 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-9 w-9 touch-manipulation"
            aria-label={t('common:labels.back')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Hash className="w-5 h-5 text-prompedia-green-400" />
            <h1 className="text-sm sm:text-base font-semibold font-mono truncate">{activeTagName || t('common:labels.tag')}</h1>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {isTagLoading ? (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 p-3 sm:p-4 md:p-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="bg-card border rounded-lg p-4 sm:p-6 space-y-4">
                  <div className="flex justify-between">
                    <div className="h-4 w-20 bg-muted rounded" />
                    <div className="h-4 w-16 bg-muted rounded" />
                  </div>
                  <div className="h-6 w-3/4 bg-muted rounded" />
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-muted rounded" />
                    <div className="h-4 w-5/6 bg-muted rounded" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-6 w-16 bg-muted rounded" />
                    <div className="h-6 w-20 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : tagError ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
            <Hash className="w-12 h-12 mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2 font-mono">{t('library:problemOccurred')}</h3>
            <p className="text-sm text-center mb-4">{tagError}</p>
            <div className="flex items-center gap-2">
              <Button variant="default" onClick={loadTagPrompts} className="touch-manipulation">
                {t('common:buttons.tryAgain')}
              </Button>
              <Link to="/" className="text-sm underline">
                {t('library:backToHome')}
              </Link>
            </div>
          </div>
        ) : tagPrompts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
            <Hash className="w-16 h-16 mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2 font-mono">{t('library:noPrompts')}</h3>
            <p className="text-sm text-center">{t('library:noPromptsWithTag')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 p-3 sm:p-4 md:p-6">
            {tagPrompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                variant="tag-view"
                onCardClick={handleTagCardClick}
                onCopy={handleTagCopy}
                onCopyUrl={handleTagCopyUrl}
                onUse={handleTagUse}
              />
            ))}
          </div>
        )}
      </div>

      <PromptDetailModal
        prompt={selectedTagPrompt}
        isOpen={isTagModalOpen}
        onClose={handleCloseTagModal}
        onUse={handleUsePromptFromModal}
        onCopy={handleCopyPromptFromModal}
      />
    </div>
  );

  const renderDefaultContent = () => (
    <div key={contentViewKey} className="flex h-full flex-col">
      {isMobile && (
        <div className="md:hidden border-b border-border bg-card flex-shrink-0 px-4 py-3 flex items-center gap-3 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileSidebarOpen(true)}
            className="h-9 w-9 touch-manipulation"
            aria-label={t('common:labels.openMenu')}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-sm font-semibold font-mono">Prompedia AI</h1>
          </div>
        </div>
      )}

      <div className="flex-1 w-full h-full">
        {showEditor ? (
          <PromptEditor
            currentPrompt={currentPrompt}
            onPromptChange={handlePromptChange}
            onDeletePrompt={handleDeletePrompt}
            onNewPrompt={handleNewPrompt}
            isFocusMode={isFocusMode}
            onToggleFocus={handleToggleFocus}
            user={user}
          />
        ) : activeView === 'my-library' ? (
          <MyLibrary
            key="my-library"
            prompts={myPromptsWithTags}
            onSelectPrompt={handleSelectPrompt}
            onEditPrompt={handleEditPrompt}
            onDeletePrompt={handleDeletePrompt}
            onCopyPrompt={handleCopyPrompt}
            currentPromptId={currentPrompt?.id}
          />
        ) : (
          <PublicLibrary
            key="public-library"
            prompts={publicPromptsWithTags}
            onSelectPrompt={handleSelectPrompt}
            onUsePrompt={handleUsePrompt}
            currentPromptId={currentPrompt?.id}
          />
        )}
      </div>
    </div>
  );

  const checkAuth = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      // Jangan otomatis memuat prompt terakhir yang dibuka - tetap playground sebagai default
      // User bisa memuat prompt secara manual dari library jika diperlukan

      setLoading(false);
      
      // Menambahkan delay kecil untuk memastikan transisi yang mulus
      setTimeout(() => {
        setIsInitializing(false);
      }, 300);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Auth check error:', error);
      }
      setLoading(false);
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Memuat prompt dari query param `use` ketika ada
  useEffect(() => {
    const promptId = searchParams.get('use');
    if (!promptId) return;

    const loadPromptById = async () => {
      try {
        const prompt = await SupabaseService.getPrompt(promptId);
        if (!prompt) {
          showErrorToast('errors:prompt.notFound');
        } else {
          const sanitizedPrompt: Prompt = {
            id: prompt.id || '',
            user_id: prompt.user_id || '',
            title: prompt.title || '',
            content: prompt.content || '',
            model_id: prompt.model_id || AVAILABLE_MODELS[1].id,
            mode_id: prompt.mode_id || THINKING_MODES[5].id,
            color: prompt.color || '#3b82f6',
            is_public: prompt.is_public || false,
            is_featured: prompt.is_featured || false,
            description: prompt.description || null,
            original_prompt_id: prompt.original_prompt_id || null,
          };

          setCurrentPrompt(sanitizedPrompt);
          storage.setCurrentPrompt(sanitizedPrompt.id);
          setShowEditor(true);
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Failed to load prompt from query:', error);
        }
        showErrorToast('errors:prompt.loadFailed');
      } finally {
        // Bersihkan query `use` dari URL
        const params = new URLSearchParams(searchParams);
        params.delete('use');
        setSearchParams(params, { replace: true });
      }
    };

    loadPromptById();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Mengatur listener untuk perubahan state autentikasi
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const newUser = session?.user ?? null;
        setUser(newUser);

        // Memperbarui tampilan default berdasarkan status autentikasi
        if (newUser) {
          // User baru login - tetap playground sebagai default, jangan paksa pindah ke library
          // Hanya pindah jika user secara eksplisit navigasi ke tampilan library
        } else {
          // User baru logout - tetap playground sebagai default
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);


  const loadAllPrompts = useCallback(async () => {
    try {
      const prompts = await storageManager.getPrompts();
      setAllPrompts(prompts || []);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to load prompts:', error);
      }
      setAllPrompts([]);
    }
  }, []);

  const loadPublicPrompts = useCallback(async () => {
    try {
      const publicPromptsData = await SupabaseService.getPublicPrompts();
      setPublicPrompts(publicPromptsData);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to load public prompts:', error);
      }
      showErrorToast('errors:library.loadFailed');
      setPublicPrompts([]);
    }
  }, []);

  // Load prompts on mount only
  useEffect(() => {
    loadAllPrompts();
    loadPublicPrompts();
  }, [loadAllPrompts, loadPublicPrompts]);

  // Refresh public prompts periodically with longer interval to reduce load
  useEffect(() => {
    const interval = setInterval(() => {
      loadPublicPrompts();
    }, 60000); // Increased from 30s to 60s

    return () => clearInterval(interval);
  }, [loadPublicPrompts]);

  const myPrompts = useMemo(() =>
    user ? allPrompts.filter(p => p.user_id === user.id) : [],
    [allPrompts, user]
  );

  // Mengonversi ke format PromptWithTags (tag dimuat terpisah melalui junction table)
  const myPromptsWithTags: PromptWithTags[] = useMemo(() =>
    myPrompts.map(prompt => ({
      ...prompt,
      tags: [] // Tag akan dimuat terpisah di komponen MyLibrary
    })),
    [myPrompts]
  );

  const publicPromptsWithTags: PromptWithTags[] = useMemo(() =>
    publicPrompts.map(prompt => ({
      ...prompt,
      tags: [] // Tag akan dimuat terpisah di komponen PublicLibrary
    })),
    [publicPrompts]
  );

  const handlePromptChange = (prompt: Prompt) => {
    setCurrentPrompt(prompt);
    storage.setCurrentPrompt(prompt.id);
    
    // Memperbarui array allPrompts untuk mencerminkan perubahan
    setAllPrompts(prevPrompts => {
      const existingIndex = prevPrompts.findIndex(p => p.id === prompt.id);
      if (existingIndex >= 0) {
        // Memperbarui prompt yang sudah ada
        const updatedPrompts = [...prevPrompts];
        updatedPrompts[existingIndex] = prompt;
        return updatedPrompts;
      } else {
        // Menambahkan prompt baru
        return [...prevPrompts, prompt];
      }
    });
  };

  const handleSelectPrompt = (prompt: PromptWithTags) => {
    // Ensure prompt has required fields for new schema
    const sanitizedPrompt: Prompt = {
      id: prompt.id || '',
      user_id: prompt.user_id || '',
      title: prompt.title || '',
      content: prompt.content || '',
      
      model_id: prompt.model_id || AVAILABLE_MODELS[1].id,
      mode_id: prompt.mode_id || THINKING_MODES[5].id,
      
      color: prompt.color || '#3b82f6',
      is_public: prompt.is_public || false,
      is_featured: prompt.is_featured || false,
      description: prompt.description || null,
      original_prompt_id: prompt.original_prompt_id || null,
    };

    setCurrentPrompt(sanitizedPrompt);
    storage.setCurrentPrompt(sanitizedPrompt.id);
    setShowEditor(true);
  };

  const handleEditPrompt = (prompt: PromptWithTags) => {
    // Ensure prompt has required fields for new schema
    const sanitizedPrompt: Prompt = {
      id: prompt.id || '',
      user_id: prompt.user_id || user?.id || '',
      title: prompt.title || '',
      content: prompt.content || '',
      
      model_id: prompt.model_id || AVAILABLE_MODELS[1].id,
      mode_id: prompt.mode_id || THINKING_MODES[5].id,
      
      color: prompt.color || '#3b82f6',
      is_public: prompt.is_public || false,
      is_featured: prompt.is_featured || false,
      description: prompt.description || null,
      original_prompt_id: prompt.original_prompt_id || null,
    };

    setCurrentPrompt(sanitizedPrompt);
    storage.setCurrentPrompt(sanitizedPrompt.id);
    setShowEditor(true);
  };

  const handleDeletePrompt = async (promptId: string) => {
    try {
      await storageManager.deletePrompt(promptId);
      if (currentPrompt?.id === promptId) {
        setCurrentPrompt(null);
        setShowEditor(false);
      }
      // Memuat ulang prompt setelah penghapusan berhasil
      await loadAllPrompts();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to delete prompt:', error);
      }
      showErrorToast('errors:prompt.deleteFailed');
      throw error;
    }
  };

  const handleCopyPrompt = async (prompt: PromptWithTags) => {
    const user = await supabase.auth.getUser().then(({ data }) => data.user);

    if (!user) {
      showErrorToast('errors:actions.signInToCopy');
      return;
    }

    try {
      // Mengecek apakah user bisa melakukan panggilan AI (menyalin memerlukan quota)
      const rateLimitCheck = await rateLimitingService.canMakeAICall(user);
      if (!rateLimitCheck.allowed) {
        showErrorToast('errors:usage.waitBeforeCopying');
        return;
      }

      // Show warning when approaching limit
      if (rateLimitCheck.usage.remaining <= 3) {
        if (user) {
          showWarningToast('common:warnings.remainingDailyCalls', { count: rateLimitCheck.usage.remaining });
        } else {
          showWarningToast('common:warnings.remainingCallsWithSignIn', { count: rateLimitCheck.usage.remaining });
        }
      }

      // Menyucikan prompt agar sesuai dengan schema baru
      const sanitizedPrompt: Prompt = {
        id: prompt.id || '',
        user_id: prompt.user_id || '',
        title: prompt.title || '',
        content: prompt.content || '',
        model: prompt.model || AVAILABLE_MODELS[1].id,
        mode: (prompt.mode || THINKING_MODES[5].id) as 'meta-prompt' | 'thinking' | 'normal',
        color: prompt.color || '#3b82f6',
        is_public: prompt.is_public || false,
        is_featured: prompt.is_featured || false,
        description: prompt.description,
        original_prompt_id: prompt.original_prompt_id,
      };

      const copiedPrompt: Prompt = {
        ...sanitizedPrompt,
        id: crypto.randomUUID(),
        user_id: user.id,
        title: `Copy of ${sanitizedPrompt.title}`,
        is_public: false,
      };

      await storageManager.savePrompt(copiedPrompt);
      
      // Update allPrompts dengan prompt yang baru di-copy tanpa mengubah currentPrompt atau membuka editor
      setAllPrompts(prevPrompts => [...prevPrompts, copiedPrompt]);
      
      showSuccessToast('success:prompt.copiedSuccessfully');

      // Menambah counter penggunaan setelah salinan berhasil
      await rateLimitingService.incrementUsage(user);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to copy prompt:', error);
      }
      showErrorToast('errors:prompt.copyFailed');
    }
  };

  const handleUsePrompt = (prompt: PromptWithTags) => {
    // User guest hanya bisa menggunakan prompt untuk melihat, bukan untuk pemrosesan AI
    if (!user) {
      showWarningToast('common:warnings.signInForAI');
    }

    // Ensure prompt has required fields for new schema
    const sanitizedPrompt: Prompt = {
      id: prompt.id || '',
      user_id: prompt.user_id || '',
      title: prompt.title || '',
      content: prompt.content || '',
      model: prompt.model || AVAILABLE_MODELS[1].id,
      mode: (prompt.mode || THINKING_MODES[5].id) as 'meta-prompt' | 'thinking' | 'normal',
      color: prompt.color || '#3b82f6',
      is_public: prompt.is_public || false,
      is_featured: prompt.is_featured || false,
      description: prompt.description || null,
      original_prompt_id: prompt.original_prompt_id || null,
    };

    setCurrentPrompt(sanitizedPrompt);
    storage.setCurrentPrompt(sanitizedPrompt.id);
    setShowEditor(true);
  };

  const handleViewChange = (view: 'my-library' | 'public-library') => {
    try {
      // User guest tidak bisa mengakses library private
      if (!user && view === 'my-library') {
        showErrorToast('errors:actions.signInToAccessLibrary');
        return;
      }

      // Instant state update for immediate UI response
      setActiveView(view);
      setShowEditor(false);
      setCurrentPrompt(null);
      storage.clearCurrentPrompt();
      setIsTagModalOpen(false);
      setSelectedTagPrompt(null);

      if (isTagView) {
        navigate('/', { replace: false, state: { targetView: view } });
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to change view:', error);
      }
      showErrorToast('errors:library.switchViewFailed');
    }
  };

  const handleNewPrompt = async () => {
    // Check rate limits before creating new prompt
    try {
      const rateLimitCheck = await rateLimitingService.canMakeAICall(user);

      if (!rateLimitCheck.allowed) {
        const limitType = user ? t('errors:usage.dailyLimit') : t('errors:usage.guestLimit');
        showErrorToast('errors:usage.limitReached', { 
          type: limitType, 
          error: rateLimitCheck.error || '' 
        });
        if (!user) {
          setShowAuthModal(true);
        }
        return;
      }

      // Show warning when approaching limit
      if (rateLimitCheck.usage.remaining <= 3) {
        if (user) {
          showWarningToast('common:warnings.remainingDailyCalls', { count: rateLimitCheck.usage.remaining });
        } else {
          showWarningToast('common:warnings.remainingCallsWithSignIn', { count: rateLimitCheck.usage.remaining });
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Rate limit check failed:', error);
      }
      showErrorToast('errors:usage.checkFailed');
      return;
    }

    const newPrompt: Prompt = {
      id: crypto.randomUUID(),
      user_id: user?.id || 'guest',
      title: t('prompt:untitled'),
      content: '',
      model: AVAILABLE_MODELS[1].id,
      color: '#3b82f6',
      mode: THINKING_MODES[5].id as 'meta-prompt' | 'thinking' | 'normal',
      is_public: false,
      is_featured: false,
    };

    // Mereset semua state playground secara atomik
    setCurrentPrompt(newPrompt);
    storage.setCurrentPrompt(newPrompt.id);
    setShowEditor(true);
    
    // Clear any previous prompt data from storage
    storage.clearCurrentPrompt();
    storage.setCurrentPrompt(newPrompt.id);
    setIsTagModalOpen(false);
    setSelectedTagPrompt(null);

    if (isTagView) {
      navigate('/', { replace: false, state: { openPlayground: true } });
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      showSuccessToast('success:auth.logoutSuccess');
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Logout error:', error);
      }
      showErrorToast('errors:auth.logoutFailed');
    }
  };

  const handleAuthSuccess = () => {
    // Mereset counter playground setelah login berhasil
    localStorage.removeItem(STORAGE_KEYS.GUEST_USAGE);
    showSuccessToast('success:auth.welcomeUnlimited');
  };

  const handleLogin = () => {
    setShowAuthModal(true);
  };

  const handleToggleFocus = () => {
    setIsFocusMode(prev => !prev);
  };

  // Menampilkan state loading
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-primary/20 rounded-full" />
            <div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground font-mono">Loading Prompedia...</p>
            <p className="text-xs text-muted-foreground/60 font-mono mt-1">Initializing your workspace</p>
          </div>
        </div>
      </div>
    );
  }

  // Close mobile sidebar when view changes
  const handleViewChangeWithMobile = (view: 'my-library' | 'public-library') => {
    handleViewChange(view);
    if (isMobile) {
      setMobileSidebarOpen(false);
    }
  };

  const handleNewPromptWithMobile = async () => {
    await handleNewPrompt();
    if (isMobile) {
      setMobileSidebarOpen(false);
    }
  };

  const handleLoginWithMobile = () => {
    handleLogin();
    if (isMobile) {
      setMobileSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden stable-layout">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className={`hidden md:block ${isInitializing ? 'opacity-0' : 'opacity-100'}`}>
          <Sidebar
            activeView={activeView}
            onViewChange={handleViewChange}
            onNewPrompt={handleNewPrompt}
            onLogout={handleLogout}
            onLogin={handleLogin}
            user={user}
            isPlaygroundActive={showEditor && !isTagView}
            isFocusMode={isFocusMode}
            mobileSidebarOpen={undefined}
            setMobileSidebarOpen={undefined}
          />
        </div>
      )}

      {/* Mobile Sidebar */}
      {isMobile && (
        <Sidebar
          activeView={activeView}
          onViewChange={handleViewChangeWithMobile}
          onNewPrompt={handleNewPromptWithMobile}
          onLogout={handleLogout}
          onLogin={handleLoginWithMobile}
          user={user}
          isPlaygroundActive={showEditor && !isTagView}
          isFocusMode={isFocusMode}
          mobileSidebarOpen={mobileSidebarOpen}
          setMobileSidebarOpen={setMobileSidebarOpen}
        />
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 overflow-hidden ${isMobile ? 'h-screen' : ''} ${isInitializing ? 'opacity-0' : 'opacity-100'}`}>
        <ErrorBoundary>
          {isTagView ? renderTagContent() : renderDefaultContent()}
        </ErrorBoundary>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default AppPage;
