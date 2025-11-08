import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PromptEditor from '@/components/PromptEditor';
import MyLibrary from '@/components/MyLibrary';
import PublicLibrary from '@/components/PublicLibrary';
import AuthModal from '@/components/AuthModal';
import SEO from '@/components/SEO';
import { storage, Prompt, Tag } from '@/lib/storage';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSearchParams, useNavigate, useOutletContext } from 'react-router-dom';
import { ENV } from '@/lib/constants';
import type { User } from '@supabase/supabase-js';

interface PromptWithTags extends Prompt {
  tags: Tag[];
}
import { storageManager } from '@/lib/storage-manager';
import { AVAILABLE_MODELS } from '@/lib/models';
import { THINKING_MODES } from '@/lib/modes';
import { SupabaseService } from '@/lib/supabase-service';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { rateLimitingService } from '@/lib/rate-limiting';
import { STORAGE_KEYS } from '@/lib/constants';
import { ErrorBoundary } from '@/components/ErrorBoundary';


interface OutletContext {
  user: User | null;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  setAppActiveView: (view: 'my-library' | 'public-library' | null) => void;
  setAppIsPlaygroundActive: (active: boolean | null) => void;
  appActiveView: 'my-library' | 'public-library' | null;
  appIsPlaygroundActive: boolean | null;
}

const AppPage = () => {
  const { t } = useTranslation();
  // Get context from Layout
  const { user, mobileSidebarOpen, setMobileSidebarOpen, setAppActiveView, setAppIsPlaygroundActive, appActiveView, appIsPlaygroundActive } = useOutletContext<OutletContext>();
  const [loading, setLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [activeView, setActiveView] = useState<'my-library' | 'public-library'>('public-library');
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [showEditor, setShowEditor] = useState(false); // Default to library view
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [allPrompts, setAllPrompts] = useState<Prompt[]>([]);
  const [publicPrompts, setPublicPrompts] = useState<Prompt[]>([]);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevAppIsPlaygroundActiveRef = useRef<boolean | null>(null);
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const checkAuth = useCallback(async () => {
    try {
      // User sudah di-handle oleh Layout, hanya perlu set loading
      setLoading(false);
      
      // Menambahkan delay kecil untuk memastikan transisi yang mulus
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

  // Memuat prompt dari query param `use` ketika ada
  useEffect(() => {
    const promptId = searchParams.get('use');
    if (!promptId) return;

    const loadPromptById = async () => {
      try {
        const prompt = await SupabaseService.getPrompt(promptId);
        if (!prompt) {
          toast.error(t('errors:prompt.notFound'));
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
          // Update Layout untuk sync Sidebar state
          setAppIsPlaygroundActive(true);
        }
      } catch (error) {
        console.error('Failed to load prompt from query:', error);
        toast.error(t('errors:prompt.loadFailed'));
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
  // User state di-handle oleh Layout, hanya perlu reload prompts
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        // Reload prompts ketika auth state berubah (login/logout)
        // Ini memastikan prompts ter-load segera setelah login tanpa perlu refresh
        // Skip untuk event INITIAL_SESSION karena sudah di-handle di checkAuth
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          try {
            setIsLoadingPrompts(true);
            // Reload prompts untuk user baru atau setelah logout
            const prompts = await storageManager.getPrompts();
            setAllPrompts(prompts || []);
            // Public prompts juga perlu di-reload untuk memastikan data terbaru
            const publicPromptsData = await SupabaseService.getPublicPrompts();
            setPublicPrompts(publicPromptsData);
          } catch (error) {
            console.error('Failed to reload prompts after auth change:', error);
          } finally {
            setIsLoadingPrompts(false);
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sync dengan appActiveView dari Layout saat tombol di Sidebar diklik
  useEffect(() => {
    // Sync appActiveView - selalu update jika appActiveView tidak null
    // Ini memastikan view selalu sync meskipun sudah sama (untuk force update dari playground)
    if (appActiveView !== null) {
      // Skip jika user guest mencoba akses my-library (akan di-handle oleh handleViewChange)
      if (appActiveView === 'my-library' && !user) {
        return;
      }
      // Update local state jika berbeda, atau jika kita di playground (untuk force switch ke library)
      if (appActiveView !== activeView || showEditor) {
        setActiveView(appActiveView);
        setShowEditor(false);
        setCurrentPrompt(null);
        storage.clearCurrentPrompt();
      }
    }
  }, [appActiveView, activeView, user, showEditor]);

  // Sync appIsPlaygroundActive dengan showEditor (terpisah untuk menghindari dependency issues)
  useEffect(() => {
    if (appIsPlaygroundActive !== null) {
      const wasPlaygroundActive = prevAppIsPlaygroundActiveRef.current;
      const isPlaygroundJustOpened = appIsPlaygroundActive && !wasPlaygroundActive;
      
      // Jika playground harus aktif, pastikan showEditor true
      if (appIsPlaygroundActive) {
        setShowEditor(true);
        // Jika playground baru dibuka (dari false/null ke true) dan tidak ada current prompt,
        // buat prompt baru (untuk handle klik Playground dari sidebar)
        if (isPlaygroundJustOpened && !currentPrompt) {
          // Panggil handleNewPrompt untuk membuat prompt baru dengan rate limit check
          // Note: handleNewPrompt tidak di-dependencies karena akan menyebabkan infinite loop
          // (handleNewPrompt membuat currentPrompt baru yang trigger useEffect lagi)
          // Kondisi isPlaygroundJustOpened && !currentPrompt mencegah pemanggilan berulang
          handleNewPrompt();
        }
      } else {
        // Jika playground harus tidak aktif, pastikan showEditor false
        setShowEditor(false);
        // Juga clear current prompt saat switch dari playground ke library
        setCurrentPrompt((prev) => {
          if (prev) {
            storage.clearCurrentPrompt();
            return null;
          }
          return prev;
        });
      }
      
      // Update ref untuk track perubahan
      prevAppIsPlaygroundActiveRef.current = appIsPlaygroundActive;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appIsPlaygroundActive, currentPrompt]);

  const loadAllPrompts = useCallback(async () => {
    try {
      setIsLoadingPrompts(true);
      const prompts = await storageManager.getPrompts();
      setAllPrompts(prompts || []);
    } catch (error) {
      console.error('Failed to load prompts:', error);
      setAllPrompts([]);
      // Jangan tampilkan error toast karena tidak kritis untuk playground
    } finally {
      setIsLoadingPrompts(false);
    }
  }, []);

  const loadPublicPrompts = useCallback(async () => {
    try {
      console.log('Loading public prompts...');
      const publicPromptsData = await SupabaseService.getPublicPrompts();
      console.log('Public prompts loaded:', publicPromptsData.length);
      setPublicPrompts(publicPromptsData);
    } catch (error) {
      console.error('Failed to load public prompts:', error);
      toast.error(t('errors:library.loadFailed'));
      setPublicPrompts([]);
    }
  }, []);

  // Efek gabungan untuk memuat kedua jenis prompt
  // Juga reload saat user state berubah (login/logout)
  useEffect(() => {
    if (!loading) {
      // Hanya load prompts setelah initial auth check selesai
      loadAllPrompts();
      loadPublicPrompts();
    }
  }, [loadAllPrompts, loadPublicPrompts, user, loading]);

  // Efek terpisah untuk refresh berkala hanya untuk prompt public
  useEffect(() => {
    const interval = setInterval(() => {
      loadPublicPrompts();
    }, 30000);

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
    // Tambahkan visual feedback untuk transisi
    setIsTransitioning(true);
    
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
    // Update Layout untuk sync Sidebar state
    setAppIsPlaygroundActive(true);
    
    // Reset transition state setelah animasi selesai
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  const handleEditPrompt = (prompt: PromptWithTags) => {
    // Tambahkan visual feedback untuk transisi
    setIsTransitioning(true);
    
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
    // Update Layout untuk sync Sidebar state
    setAppIsPlaygroundActive(true);
    
    // Reset transition state setelah animasi selesai
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  const handleDeletePrompt = async (promptId: string) => {
    try {
      await storageManager.deletePrompt(promptId);
      if (currentPrompt?.id === promptId) {
        setCurrentPrompt(null);
        setShowEditor(false);
        // Update Layout untuk sync Sidebar state
        setAppIsPlaygroundActive(false);
      }
      // Memuat ulang prompt setelah penghapusan berhasil
      await loadAllPrompts();
    } catch (error) {
      console.error('Failed to delete prompt:', error);
      toast.error(t('errors:prompt.deleteFailed'));
      throw error; // Re-throw error so MyLibrary can handle it
    }
  };

  const handleCopyPrompt = async (prompt: PromptWithTags) => {
    const user = await supabase.auth.getUser().then(({ data }) => data.user);

    if (!user) {
      toast.error(t('errors:actions.signInToCopy'));
      return;
    }

    try {
      // Mengecek apakah user bisa melakukan panggilan AI (menyalin memerlukan quota)
      const rateLimitCheck = await rateLimitingService.canMakeAICall(user);
      if (!rateLimitCheck.allowed) {
        toast.error(t('errors:usage.waitBeforeCopying'));
        return;
      }

      // Show warning when approaching limit
      if (rateLimitCheck.usage.remaining <= 3) {
        if (user) {
          toast.warning(t('common:warnings.remainingDailyCalls', { count: rateLimitCheck.usage.remaining }));
        } else {
          toast.warning(t('common:warnings.remainingCallsWithSignIn', { count: rateLimitCheck.usage.remaining }));
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
      handlePromptChange(copiedPrompt);
      toast.success(t('success:prompt.copiedSuccessfully'));

      // Menambah counter penggunaan setelah salinan berhasil
      await rateLimitingService.incrementUsage(user);
    } catch (error) {
      console.error('Failed to copy prompt:', error);
      toast.error(t('errors:prompt.copyFailed'));
    }
  };

  const handleUsePrompt = (prompt: PromptWithTags) => {
    // User guest hanya bisa menggunakan prompt untuk melihat, bukan untuk pemrosesan AI
    if (!user) {
      toast.warning(t('common:warnings.signInForAI'));
    }

    // Tambahkan visual feedback untuk transisi
    setIsTransitioning(true);

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
    // Update Layout untuk sync Sidebar state
    setAppIsPlaygroundActive(true);
    
    // Reset transition state setelah animasi selesai
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  const handleViewChange = (view: 'my-library' | 'public-library') => {
    try {
      // User guest tidak bisa mengakses library private
      if (!user && view === 'my-library') {
        toast.error(t('errors:actions.signInToAccessLibrary'));
        return;
      }

      // Skip jika sudah di view yang sama DAN tidak di playground untuk mencegah unnecessary re-renders
      // Tapi tetap update jika di playground (untuk force close playground)
      if (activeView === view && !showEditor) {
        // Pastikan Layout state tetap sync
        setAppActiveView(view);
        setAppIsPlaygroundActive(false);
        return;
      }

      // Tambahkan visual feedback untuk transisi
      setIsTransitioning(true);
      
      // Mereset state playground saat beralih ke tampilan library
      // Transisi smooth tanpa flash/reload
      setCurrentPrompt(null);
      storage.clearCurrentPrompt();
      setActiveView(view);
      setShowEditor(false);
      // Update Layout untuk sync Sidebar state - selalu update untuk memastikan sync
      setAppActiveView(view);
      setAppIsPlaygroundActive(false);
      
      // Reset transition state setelah animasi selesai
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    } catch (error) {
      console.error('Failed to change view:', error);
      toast.error(t('errors:library.switchViewFailed'));
      setIsTransitioning(false);
    }
  };

  const handleNewPrompt = async () => {
    // Check rate limits before creating new prompt
    try {
      const rateLimitCheck = await rateLimitingService.canMakeAICall(user);

      if (!rateLimitCheck.allowed) {
        const limitType = user ? t('errors:usage.dailyLimit') : t('errors:usage.guestLimit');
        toast.error(
          t('errors:usage.limitReached', { 
            type: limitType, 
            error: rateLimitCheck.error || '' 
          })
        );
        if (!user) {
          setShowAuthModal(true);
        }
        return;
      }

      // Show warning when approaching limit
      if (rateLimitCheck.usage.remaining <= 3) {
        if (user) {
          toast.warning(t('common:warnings.remainingDailyCalls', { count: rateLimitCheck.usage.remaining }));
        } else {
          toast.warning(t('common:warnings.remainingCallsWithSignIn', { count: rateLimitCheck.usage.remaining }));
        }
      }
    } catch (error) {
      console.error('Rate limit check failed:', error);
      toast.error(t('errors:usage.checkFailed'));
      return;
    }

    // Tambahkan visual feedback untuk transisi
    setIsTransitioning(true);

    const newPrompt: Prompt = {
      id: crypto.randomUUID(),
      user_id: user?.id || 'guest',
      title: 'Untitled Prompt',
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
    // Update Layout untuk sync Sidebar state
    setAppIsPlaygroundActive(true);
    
    // Clear any previous prompt data from storage
    storage.clearCurrentPrompt();
    storage.setCurrentPrompt(newPrompt.id);
    
    // Reset transition state setelah animasi selesai
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  const handleAuthSuccess = () => {
    // Mereset counter playground setelah login berhasil
    localStorage.removeItem(STORAGE_KEYS.GUEST_USAGE);
    toast.success(t('success:auth.welcomeUnlimited'));
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
            <div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
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

  const baseUrl = ENV.SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://prompedia.app');
  const homepageUrl = baseUrl;

  return (
    <>
      {/* SEO Meta Tags & Structured Data */}
      <SEO
        title={ENV.SITE_TITLE}
        description={t('common:seo.description') || 'Build, optimize, and manage AI prompts with Prompedia AI. Free prompt engineering platform with 6 thinking modes, AI model integration, and public prompt library. Perfect for ChatGPT, Claude, and other AI tools.'}
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

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-opacity duration-300 will-change-[opacity] ${isInitializing ? 'opacity-0' : 'opacity-100'} min-w-0 overflow-hidden ${isMobile ? 'h-screen' : ''}`}>
        {/* Mobile Hamburger Menu Button */}
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

        <ErrorBoundary>
          {showEditor ? (
            <div className={`flex-1 flex flex-col min-w-0 overflow-hidden transition-opacity duration-300 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
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
            <div className={`flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 ${isTransitioning ? 'opacity-50 scale-[0.98]' : 'opacity-100 scale-100'}`}>
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
        </ErrorBoundary>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
};

export default AppPage;
