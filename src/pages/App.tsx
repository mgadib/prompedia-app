import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Sidebar from '@/components/Sidebar';
import PromptEditor from '@/components/PromptEditor';
import MyLibrary from '@/components/MyLibrary';
import PublicLibrary from '@/components/PublicLibrary';
import AuthModal from '@/components/AuthModal';
import { storage, Prompt, Tag } from '@/lib/storage';
import { useIsMobile } from '@/hooks/use-mobile';

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


const AppPage = () => {
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

  const checkAuth = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      // Don't automatically load last opened prompt - keep playground as default
      // Users can manually load prompts from the library if needed

      setLoading(false);
      
      // Add a small delay to ensure smooth transition
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

  // Set up auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const newUser = session?.user ?? null;
        setUser(newUser);

        // Update default view based on authentication status
        if (newUser) {
          // User just logged in - keep playground as default, don't force switch to library
          // Only switch if user explicitly navigates to library views
        } else {
          // User just logged out - keep playground as default
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
      console.error('Failed to load prompts:', error);
      setAllPrompts([]);
      // Don't show error toast for this as it's not critical for playground
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
      toast.error('Failed to load public library');
      setPublicPrompts([]);
    }
  }, []);

  // Combined effect to load both types of prompts
  useEffect(() => {
    loadAllPrompts();
    loadPublicPrompts();
  }, [loadAllPrompts, loadPublicPrompts]);

  // Separate effect for periodic refresh of public prompts only
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

  // Convert to PromptWithTags format (tags loaded separately via junction table)
  const myPromptsWithTags: PromptWithTags[] = useMemo(() =>
    myPrompts.map(prompt => ({
      ...prompt,
      tags: [] // Tags will be loaded separately in MyLibrary component
    })),
    [myPrompts]
  );

  const publicPromptsWithTags: PromptWithTags[] = useMemo(() =>
    publicPrompts.map(prompt => ({
      ...prompt,
      tags: [] // Tags will be loaded separately in PublicLibrary component
    })),
    [publicPrompts]
  );

  const handlePromptChange = (prompt: Prompt) => {
    setCurrentPrompt(prompt);
    storage.setCurrentPrompt(prompt.id);
    
    // Update the allPrompts array to reflect the changes
    setAllPrompts(prevPrompts => {
      const existingIndex = prevPrompts.findIndex(p => p.id === prompt.id);
      if (existingIndex >= 0) {
        // Update existing prompt
        const updatedPrompts = [...prevPrompts];
        updatedPrompts[existingIndex] = prompt;
        return updatedPrompts;
      } else {
        // Add new prompt
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
      // Reload prompts after successful delete
      await loadAllPrompts();
    } catch (error) {
      console.error('Failed to delete prompt:', error);
      toast.error('Failed to delete prompt');
      throw error; // Re-throw error so MyLibrary can handle it
    }
  };

  const handleCopyPrompt = async (prompt: PromptWithTags) => {
    const user = await supabase.auth.getUser().then(({ data }) => data.user);

    if (!user) {
      toast.error('Please log in to copy prompts');
      return;
    }

    try {
      // Check if user can make AI calls (copying requires quota)
      const rateLimitCheck = await rateLimitingService.canMakeAICall(user);
      if (!rateLimitCheck.allowed) {
        toast.error('Please wait before copying. Use limit reached.');
        return;
      }

      // Show warning when approaching limit
      if (rateLimitCheck.usage.remaining <= 3) {
        toast.warning(
          `${rateLimitCheck.usage.remaining} AI calls remaining.`
        );
      }

      // Sanitize prompt to match new schema
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
      toast.success('Prompt copied successfully');

      // Increment usage counter after successful copy
      await rateLimitingService.incrementUsage(user);
    } catch (error) {
      console.error('Failed to copy prompt:', error);
      toast.error('Failed to copy prompt');
    }
  };

  const handleUsePrompt = (prompt: PromptWithTags) => {
    // Guest users can only use prompts for viewing, not for AI processing
    if (!user) {
      toast.warning('Sign in to use AI features with this prompt');
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
      // Guest users cannot access private library
      if (!user && view === 'my-library') {
        toast.error('Please sign in to access your private library');
        return;
      }

      // Reset playground state when switching to library views
      setCurrentPrompt(null);
      storage.clearCurrentPrompt();
      setActiveView(view);
      setShowEditor(false);
    } catch (error) {
      console.error('Failed to change view:', error);
      toast.error('Failed to switch view');
    }
  };

  const handleNewPrompt = async () => {
    // Check rate limits before creating new prompt
    try {
      const rateLimitCheck = await rateLimitingService.canMakeAICall(user);

      if (!rateLimitCheck.allowed) {
        const limitType = user ? 'daily' : 'guest';
        toast.error(
          `Use limit reached! ${limitType === 'daily' ? 'Daily' : 'Guest'} limit reached. ${rateLimitCheck.error || ''}`
        );
        if (!user) {
          setShowAuthModal(true);
        }
        return;
      }

      // Show warning when approaching limit
      if (rateLimitCheck.usage.remaining <= 3) {
        const limitType = user ? 'daily' : 'guest';
        toast.warning(
          `${rateLimitCheck.usage.remaining} ${limitType} AI calls remaining. ${user ? '' : 'Sign in for unlimited access!'}`
        );
      }
    } catch (error) {
      console.error('Rate limit check failed:', error);
      toast.error('Failed to check usage limits');
      return;
    }

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

    // Reset all playground state atomically
    setCurrentPrompt(newPrompt);
    storage.setCurrentPrompt(newPrompt.id);
    setShowEditor(true);
    
    // Clear any previous prompt data from storage
    storage.clearCurrentPrompt();
    storage.setCurrentPrompt(newPrompt.id);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const handleAuthSuccess = () => {
    // Reset playground count after successful login
    localStorage.removeItem(STORAGE_KEYS.GUEST_USAGE);
    toast.success('Welcome! You now have unlimited access.');
  };

  const handleLogin = () => {
    setShowAuthModal(true);
  };

  const handleToggleFocus = () => {
    setIsFocusMode(prev => !prev);
  };

  // Show loading state
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

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className={`transition-opacity duration-500 ${isInitializing ? 'opacity-0' : 'opacity-100'} hidden md:block`}>
          <Sidebar
            activeView={activeView}
            onViewChange={handleViewChange}
            onNewPrompt={handleNewPrompt}
            onLogout={handleLogout}
            onLogin={handleLogin}
            user={user}
            isPlaygroundActive={showEditor}
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
          isPlaygroundActive={showEditor}
          isFocusMode={isFocusMode}
          mobileSidebarOpen={mobileSidebarOpen}
          setMobileSidebarOpen={setMobileSidebarOpen}
        />
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-opacity duration-500 ${isInitializing ? 'opacity-0' : 'opacity-100'} min-w-0 overflow-hidden`}>
        {/* Mobile Hamburger Menu Button */}
        {isMobile && (
          <div className="md:hidden border-b border-border bg-card/50 px-4 py-3 flex items-center gap-3 z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileSidebarOpen(true)}
              className="h-11 w-11 touch-manipulation"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-base font-semibold font-mono">Prompedia AI</h1>
            </div>
          </div>
        )}

        <ErrorBoundary>
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
          ) : (
            <>
              {activeView === 'my-library' ? (
                <MyLibrary
                  prompts={myPromptsWithTags}
                  onSelectPrompt={handleSelectPrompt}
                  onEditPrompt={handleEditPrompt}
                  onDeletePrompt={handleDeletePrompt}
                  onCopyPrompt={handleCopyPrompt}
                  currentPromptId={currentPrompt?.id}
                />
              ) : (
                <PublicLibrary
                  prompts={publicPromptsWithTags}
                  onSelectPrompt={handleSelectPrompt}
                  onUsePrompt={handleUsePrompt}
                  currentPromptId={currentPrompt?.id}
                />
              )}
            </>
          )}
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
