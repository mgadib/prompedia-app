import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
// Lazy load heavy components for better code splitting
const PromptEditor = React.lazy(() => import('@/features/prompts/components/PromptEditor'));
const MyLibrary = React.lazy(() => import('@/features/library/components/MyLibrary'));
const PublicLibrary = React.lazy(() => import('@/features/library/components/PublicLibrary'));
const AuthModal = React.lazy(() => import('@/features/auth/components/AuthModal'));
const SEO = React.lazy(() => import('@/shared/components/SEO'));
import { storage, Prompt } from '@/lib/storage';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import { ENV } from '@/lib/constants';
import type { User } from '@supabase/supabase-js';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { promptService } from '@/features/prompts/services/prompt-service';
import { sanitizePrompt } from '@/features/prompts/utils/prompt-utils';
import { toast } from 'sonner';
import { STORAGE_KEYS } from '@/lib/constants';
import { useAppState } from '@/features/app/hooks/useAppState';
import { usePromptLoading } from '@/features/app/hooks/usePromptLoading';
import { usePromptActions } from '@/features/app/hooks/usePromptActions';
import { useViewNavigation } from '@/features/app/hooks/useViewNavigation';
import type { PromptWithTags } from '@/shared/types/prompts';

interface OutletContext {
  user: User | null;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  setAppActiveView: (view: 'my-library' | 'public-library' | null) => void;
  setAppIsPlaygroundActive: (active: boolean | null) => void;
  appActiveView: 'my-library' | 'public-library' | null;
  appIsPlaygroundActive: boolean | null;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
}

const AppPage = () => {
  const { t } = useTranslation();
  const { user, mobileSidebarOpen, setMobileSidebarOpen, setAppActiveView, setAppIsPlaygroundActive, appActiveView, appIsPlaygroundActive, showAuthModal, setShowAuthModal } = useOutletContext<OutletContext>();
  const [loading, setLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();

  // Use extracted hooks
  const appState = useAppState();
  const { activeView, setActiveView, currentPrompt, setCurrentPrompt, showEditor, setShowEditor, isFocusMode, setIsFocusMode, isTransitioning, setIsTransitioning, prevAppIsPlaygroundActiveRef } = appState;

  const promptLoading = usePromptLoading(user);
  const { allPrompts, setAllPrompts, publicPrompts, setPublicPrompts, loadAllPrompts, loadPublicPrompts } = promptLoading;

  const promptActions = usePromptActions({
    currentPrompt,
    setCurrentPrompt,
    setShowEditor,
    setAllPrompts,
    setAppIsPlaygroundActive,
    setIsTransitioning,
    loadAllPrompts,
    user,
    setShowAuthModal,
  });
  const { handlePromptChange, handleSelectPrompt, handleEditPrompt, handleDeletePrompt, handleCopyPrompt, handleUsePrompt, handleNewPrompt } = promptActions;

  const viewNavigation = useViewNavigation({
    activeView,
    setActiveView,
    showEditor,
    setShowEditor,
    setCurrentPrompt,
    setAppActiveView,
    setAppIsPlaygroundActive,
    setIsTransitioning,
    user,
  });
  const { handleViewChange } = viewNavigation;

  const checkAuth = useCallback(async () => {
    try {
      setLoading(false);
      setTimeout(() => {
        setIsInitializing(false);
      }, 300);
    } catch (error) {
      console.error('Auth check error:', error);
      setLoading(false);
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Load prompt from query param `use`
  useEffect(() => {
    const promptId = searchParams.get('use');
    if (!promptId) return;

    const loadPromptById = async () => {
      try {
        const prompt = await promptService.getPrompt(promptId);
        if (!prompt) {
          toast.error(t('errors:prompt.notFound'));
        } else {
          const sanitizedPrompt = sanitizePrompt(prompt);
          setCurrentPrompt(sanitizedPrompt);
          storage.setCurrentPrompt(sanitizedPrompt.id);
          setShowEditor(true);
          setAppIsPlaygroundActive(true);
        }
      } catch (error) {
        console.error('Failed to load prompt from query:', error);
        toast.error(t('errors:prompt.loadFailed'));
      } finally {
        const params = new URLSearchParams(searchParams);
        params.delete('use');
        setSearchParams(params, { replace: true });
      }
    };

    loadPromptById();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, setCurrentPrompt, setShowEditor, setAppIsPlaygroundActive, setSearchParams, t]);

  // Sync with appActiveView from Layout
  useEffect(() => {
    if (appActiveView !== null) {
      if (appActiveView === 'my-library' && !user) {
        return;
      }
      if (appActiveView !== activeView || showEditor) {
        setActiveView(appActiveView);
        setShowEditor(false);
        setCurrentPrompt(null);
        storage.clearCurrentPrompt();
      }
    }
  }, [appActiveView, activeView, user, showEditor, setActiveView, setShowEditor, setCurrentPrompt]);

  // Sync appIsPlaygroundActive with showEditor
  useEffect(() => {
    if (appIsPlaygroundActive !== null) {
      const wasPlaygroundActive = prevAppIsPlaygroundActiveRef.current;
      const isPlaygroundJustOpened = appIsPlaygroundActive && !wasPlaygroundActive;
      
      if (appIsPlaygroundActive) {
        setShowEditor(true);
        if (isPlaygroundJustOpened && !currentPrompt) {
          handleNewPrompt();
        }
      } else {
        setShowEditor(false);
        setCurrentPrompt((prev) => {
          if (prev) {
            storage.clearCurrentPrompt();
            return null;
          }
          return prev;
        });
      }
      
      prevAppIsPlaygroundActiveRef.current = appIsPlaygroundActive;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appIsPlaygroundActive, currentPrompt, setShowEditor, setCurrentPrompt]);

  // Reset current prompt when user logs out
  useEffect(() => {
    if (!user) {
      setCurrentPrompt(null);
      storage.clearCurrentPrompt();
      setShowEditor(false);
    }
  }, [user, setCurrentPrompt, setShowEditor]);

  // Load prompts after initial auth check
  useEffect(() => {
    if (!loading) {
      loadAllPrompts();
      loadPublicPrompts();
    }
  }, [loadAllPrompts, loadPublicPrompts, user, loading]);

  const myPrompts = useMemo(() =>
    user ? allPrompts.filter(p => p.user_id === user.id) : [],
    [allPrompts, user]
  );

  const myPromptsWithTags: PromptWithTags[] = useMemo(() =>
    myPrompts.map(prompt => ({
      ...prompt,
      tags: []
    })),
    [myPrompts]
  );

  const publicPromptsWithTags: PromptWithTags[] = useMemo(() =>
    publicPrompts.map(prompt => ({
      ...prompt,
      tags: []
    })),
    [publicPrompts]
  );

  const handleAuthSuccess = () => {
    localStorage.removeItem(STORAGE_KEYS.GUEST_USAGE);
    toast.success(t('success:auth.welcomeUnlimited'));
  };

  const handleToggleFocus = () => {
    setIsFocusMode(prev => !prev);
  };

  // Mobile-specific handlers
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

  const handleLogin = () => {
    setShowAuthModal(true);
  };

  const handleLoginWithMobile = () => {
    handleLogin();
    if (isMobile) {
      setMobileSidebarOpen(false);
    }
  };

  const baseUrl = ENV.SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://prompedia.app');
  const homepageUrl = baseUrl;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-primary/20 rounded-full" />
            <div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground font-mono">{t('common:loadingPrompedia')}</p>
            <p className="text-xs text-muted-foreground/60 font-mono mt-1">{t('common:initializingWorkspace')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <React.Suspense fallback={null}>
        <SEO
          title={ENV.SITE_TITLE}
          description={t('common:seo.description')}
          url={homepageUrl}
          canonical={homepageUrl}
          type="website"
          tags={['prompt engineering', 'AI prompt builder', 'prompt optimizer', 'ChatGPT prompts', 'AI prompt library', 'prompt engineering tools', 'free prompt builder', 'AI prompts', 'meta prompt', 'chain of thought']}
          schemaType="FAQPage"
          alternateLanguages={[
            { lang: 'en', url: homepageUrl },
            { lang: 'id', url: homepageUrl },
            { lang: 'x-default', url: homepageUrl },
          ]}
          jsonLd={[
            {
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Prompedia AI',
              alternateName: 'Prompedia',
              url: homepageUrl,
              description: 'Advanced prompt engineering platform for building, optimizing, and managing AI prompts. Features 6 thinking modes, multiple AI model integration, and public prompt library.',
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: `${homepageUrl}/?search={search_term_string}`,
                },
                'query-input': 'required name=search_term_string',
              },
              publisher: {
                '@type': 'Organization',
                name: 'Prompedia AI',
                logo: {
                  '@type': 'ImageObject',
                  url: `${homepageUrl}/logo.png`,
                },
              },
            },
            {
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Prompedia AI',
              applicationCategory: 'DeveloperApplication',
              operatingSystem: 'Web Browser',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
                availability: 'https://schema.org/InStock',
              },
              featureList: [
                'AI Prompt Enhancement',
                'Public Prompt Library',
                'Private Prompt Management',
                'Multiple Thinking Modes (Meta Prompt, Self-Refine, Chain-of-Thought, Self-Consistency, Chain-of-Prompt, Role Prompt)',
                'AI Model Integration (Llama 4 Maverick, Qwen 3 30B, Qwen 2.5 72B, Llama 3.1 70B)',
                'Usage Tracking & Rate Limiting',
                'Smart Tag System',
                'Real-time AI Processing',
              ],
              screenshot: `${homepageUrl}/og-image.png`,
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.8',
                ratingCount: '150',
              },
              provider: {
                '@type': 'Organization',
                name: 'Prompedia AI',
                url: homepageUrl,
                logo: {
                  '@type': 'ImageObject',
                  url: `${homepageUrl}/logo.png`,
                },
              },
            },
          ]}
          faqItems={[
            {
              question: 'What is Prompedia AI?',
              answer: 'Prompedia AI is a free prompt engineering platform that helps you build, optimize, and manage AI prompts. It features 6 thinking modes, multiple AI model integration, and a public prompt library.',
            },
            {
              question: 'How many AI calls can I make per day?',
              answer: 'Guest users can make 7 AI calls per day, while authenticated users can make 27 AI calls per day. Usage resets daily at midnight GMT+7.',
            },
            {
              question: 'What thinking modes are available?',
              answer: 'Prompedia AI supports 6 thinking modes: Meta Prompt, Self-Refine, Chain-of-Thought, Self-Consistency, Chain-of-Prompt, and Role Prompt.',
            },
            {
              question: 'Can I share my prompts publicly?',
              answer: 'Yes! You can make your prompts public and share them with the community. Public prompts are visible to everyone and can be discovered in the public library.',
            },
            {
              question: 'Which AI models are supported?',
              answer: 'Prompedia AI supports multiple AI models including Llama 4 Maverick, Qwen 3 30B, Qwen 2.5 72B, and Llama 3.1 70B.',
            },
          ]}
        />
      </React.Suspense>

      <div className={`flex-1 flex flex-col ${isInitializing ? 'opacity-0' : 'opacity-100'} min-w-0 overflow-hidden ${isMobile ? 'h-screen' : ''}`}>
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
              <h1 className="text-sm font-semibold font-mono">{t('common:app.name')}</h1>
            </div>
          </div>
        )}

        <ErrorBoundary>
          <React.Suspense fallback={
            <div className="flex-1 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            {showEditor ? (
              <div className={`flex-1 flex flex-col min-w-0 overflow-hidden ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
                <PromptEditor
                  key="prompt-editor"
                  currentPrompt={currentPrompt}
                  onPromptChange={handlePromptChange}
                  onDeletePrompt={handleDeletePrompt}
                  onNewPrompt={handleNewPrompt}
                  isFocusMode={isFocusMode}
                  onToggleFocus={handleToggleFocus}
                  user={user}
                />
              </div>
            ) : (
              <div className={`flex-1 flex flex-col min-w-0 overflow-hidden ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
                {activeView === 'my-library' ? (
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
            )}
          </React.Suspense>
        </ErrorBoundary>
      </div>

      <React.Suspense fallback={null}>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      </React.Suspense>
    </>
  );
};

export default AppPage;

