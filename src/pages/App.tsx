import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import PromptEditor from '@/components/PromptEditor';
import MyLibrary from '@/components/MyLibrary';
import PublicLibrary from '@/components/PublicLibrary';
import AuthModal from '@/components/AuthModal';
import { storage, Prompt } from '@/lib/storage';
import { Tag } from '@/integrations/supabase/types';

interface PromptWithTags extends Prompt {
  tags: Tag[];
}
import { storageManager } from '@/lib/storage-manager';
import { AVAILABLE_MODELS } from '@/lib/models';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';

const PLAYGROUND_LIMIT = 17;
const PLAYGROUND_COUNT_KEY = 'prompedia_playground_count';

const AppPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'my-library' | 'public-library'>('my-library');
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [playgroundCount, setPlaygroundCount] = useState(0);

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);

        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (_event, session) => {
            setUser(session?.user ?? null);
          }
        );

        // Load playground count for non-logged in users
        if (!session?.user) {
          const savedCount = localStorage.getItem(PLAYGROUND_COUNT_KEY);
          if (savedCount) {
            setPlaygroundCount(parseInt(savedCount));
          }
        }

        // Set up global callback for updating playground count
        window.updatePlaygroundCount = (newCount: number) => {
          setPlaygroundCount(newCount);
        };

        // Load last opened prompt
        const lastPromptId = storage.getCurrentPromptId();
        if (lastPromptId) {
          const prompts = storage.getPrompts();
          const lastPrompt = prompts.find(p => p.id === lastPromptId);
          if (lastPrompt) {
            setCurrentPrompt(lastPrompt);
            setShowEditor(true);
          }
        }

        setLoading(false);

        return () => {
          subscription.unsubscribe();
          delete window.updatePlaygroundCount;
        };
      } catch (error) {
        console.error('Auth check error:', error);
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handlePromptChange = (prompt: Prompt) => {
    setCurrentPrompt(prompt);
    storage.setCurrentPrompt(prompt.id);
  };

  const handleSelectPrompt = (prompt: PromptWithTags) => {
    // Ensure prompt has required fields for new schema
    const sanitizedPrompt: Prompt = {
      id: prompt.id || '',
      user_id: prompt.user_id || '',
      title: prompt.title || '',
      content: prompt.content || '',
      model: prompt.model || AVAILABLE_MODELS[1].id,
      mode: prompt.mode || THINKING_MODES[5].id,
      color: prompt.color || '#3b82f6',
      is_public: prompt.is_public || false,
      is_featured: prompt.is_featured || false,
      description: prompt.description,
      original_prompt_id: prompt.original_prompt_id,
    };

    setCurrentPrompt(sanitizedPrompt);
    storage.setCurrentPrompt(sanitizedPrompt.id);
    setShowEditor(true);
  };

  const handleEditPrompt = (prompt: PromptWithTags) => {
    // Ensure prompt has required fields for new schema
    const sanitizedPrompt: Prompt = {
      id: prompt.id || '',
      user_id: prompt.user_id || '',
      title: prompt.title || '',
      content: prompt.content || '',
      model: prompt.model || AVAILABLE_MODELS[1].id,
      mode: prompt.mode || THINKING_MODES[5].id,
      color: prompt.color || '#3b82f6',
      is_public: prompt.is_public || false,
      is_featured: prompt.is_featured || false,
      description: prompt.description,
      original_prompt_id: prompt.original_prompt_id,
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
    } catch (error) {
      console.error('Failed to delete prompt:', error);
      toast.error('Failed to delete prompt');
    }
  };

  const handleCopyPrompt = (prompt: PromptWithTags) => {
    const user = storage.getUser();
    if (!user) {
      toast.error('Please log in to copy prompts');
      return;
    }

    // Sanitize prompt to match new schema
    const sanitizedPrompt: Prompt = {
      id: prompt.id || '',
      user_id: prompt.user_id || '',
      title: prompt.title || '',
      content: prompt.content || '',
      model: prompt.model || AVAILABLE_MODELS[1].id,
      mode: prompt.mode || THINKING_MODES[5].id,
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

    storage.savePrompt(copiedPrompt);
  };

  const handleUsePrompt = (prompt: PromptWithTags) => {
    // Ensure prompt has required fields for new schema
    const sanitizedPrompt: Prompt = {
      id: prompt.id || '',
      user_id: prompt.user_id || '',
      title: prompt.title || '',
      content: prompt.content || '',
      model: prompt.model || AVAILABLE_MODELS[1].id,
      mode: prompt.mode || THINKING_MODES[5].id,
      color: prompt.color || '#3b82f6',
      is_public: prompt.is_public || false,
      is_featured: prompt.is_featured || false,
      description: prompt.description,
      original_prompt_id: prompt.original_prompt_id,
    };

    setCurrentPrompt(sanitizedPrompt);
    storage.setCurrentPrompt(sanitizedPrompt.id);
    setShowEditor(true);
  };

  const handleViewChange = (view: 'my-library' | 'public-library') => {
    setActiveView(view);
    setShowEditor(false); // Keluar dari playground ketika pindah ke library
  };

  const handleNewPrompt = () => {
    // Check if user has reached limit (non-logged in users only)
    if (!user) {
      if (playgroundCount >= PLAYGROUND_LIMIT) {
        toast.error(`You've reached the limit of ${PLAYGROUND_LIMIT} playgrounds. Please sign in to continue.`);
        setShowAuthModal(true);
        return;
      }
    }

    const newPrompt: Prompt = {
      id: crypto.randomUUID(),
      user_id: user?.id || 'guest',
      title: 'Untitled Prompt',
      content: '',
      model: AVAILABLE_MODELS[2].id,
      color: '#3b82f6',
      is_public: false,
      is_featured: false,
    };

    setCurrentPrompt(newPrompt);
    setShowEditor(true);
    // Removed toast - this is just navigation to playground, not creating a new prompt
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
    localStorage.removeItem(PLAYGROUND_COUNT_KEY);
    setPlaygroundCount(0);
    toast.success('Welcome! You now have unlimited access.');
  };

  const handleLogin = () => {
    setShowAuthModal(true);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground font-mono">Loading...</p>
        </div>
      </div>
    );
  }

  // Get prompts based on current view
  const allPrompts = storage.getPrompts();
  const myPrompts = user ? allPrompts.filter(p => p.user_id === user.id) : [];
  const publicPrompts = allPrompts.filter(p => p.is_public);

  // Convert to PromptWithTags format (tags loaded separately via junction table)
  const myPromptsWithTags: PromptWithTags[] = myPrompts.map(prompt => ({
    ...prompt,
    tags: [] // Tags will be loaded separately in MyLibrary component
  }));

  const publicPromptsWithTags: PromptWithTags[] = publicPrompts.map(prompt => ({
    ...prompt,
    tags: [] // Tags will be loaded separately in PublicLibrary component
  }));

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        activeView={activeView}
        onViewChange={handleViewChange}
        onNewPrompt={handleNewPrompt}
        onLogout={handleLogout}
        onLogin={handleLogin}
        user={user}
        playgroundCount={playgroundCount}
        playgroundLimit={PLAYGROUND_LIMIT}
        isPlaygroundActive={showEditor}
      />

      <div className="flex-1 flex flex-col">
        {showEditor ? (
          <PromptEditor
            currentPrompt={currentPrompt}
            onPromptChange={handlePromptChange}
          />
        ) : (
          <>
            {activeView === 'my-library' ? (
              <MyLibrary
                prompts={myPromptsWithTags}
                onSelectPrompt={handleSelectPrompt}
                onEditPrompt={handleEditPrompt}
                onDeletePrompt={handleDeletePrompt}
                currentPromptId={currentPrompt?.id}
              />
            ) : (
              <PublicLibrary
                prompts={publicPromptsWithTags}
                onSelectPrompt={handleSelectPrompt}
                onCopyPrompt={handleCopyPrompt}
                onUsePrompt={handleUsePrompt}
                currentPromptId={currentPrompt?.id}
              />
            )}
          </>
        )}
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
