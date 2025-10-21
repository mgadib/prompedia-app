import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import PromptEditor from '@/components/PromptEditor';
import MyLibrary from '@/components/MyLibrary';
import PublicLibrary from '@/components/PublicLibrary';
import { storage, Prompt } from '@/lib/storage';
import { AVAILABLE_MODELS } from '@/lib/models';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const AppPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'my-library' | 'public-library'>('my-library');
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/auth');
          return;
        }

        setUser(session.user);

        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (_event, session) => {
            setUser(session?.user ?? null);
            if (!session) {
              navigate('/auth');
            }
          }
        );

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

        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('Auth check error:', error);
        navigate('/auth');
      }
    };

    checkAuth();
  }, [navigate]);

  const handlePromptChange = (prompt: Prompt) => {
    setCurrentPrompt(prompt);
    storage.setCurrentPrompt(prompt.id);
  };

  const handleSelectPrompt = (prompt: Prompt) => {
    setCurrentPrompt(prompt);
    storage.setCurrentPrompt(prompt.id);
    setShowEditor(true);
  };

  const handleEditPrompt = (prompt: Prompt) => {
    setCurrentPrompt(prompt);
    storage.setCurrentPrompt(prompt.id);
    setShowEditor(true);
  };

  const handleDeletePrompt = (promptId: string) => {
    storage.deletePrompt(promptId);
    if (currentPrompt?.id === promptId) {
      setCurrentPrompt(null);
      setShowEditor(false);
    }
  };

  const handleCopyPrompt = (prompt: Prompt) => {
    const user = storage.getUser();
    if (!user) {
      toast.error('Please log in to copy prompts');
      return;
    }

    const copiedPrompt: Prompt = {
      ...prompt,
      id: crypto.randomUUID(),
      userId: user.id,
      title: `Copy of ${prompt.title}`,
      isPublic: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storage.savePrompt(copiedPrompt);
  };

  const handleUsePrompt = (prompt: Prompt) => {
    setCurrentPrompt(prompt);
    storage.setCurrentPrompt(prompt.id);
    setShowEditor(true);
  };

  const handleViewChange = (view: 'my-library' | 'public-library') => {
    setActiveView(view);
    setShowEditor(false); // Keluar dari playground ketika pindah ke library
  };

  const handleNewPrompt = () => {
    if (!user) {
      toast.error('Please log in to create prompts');
      return;
    }

    const newPrompt: Prompt = {
      id: crypto.randomUUID(),
      userId: user.id,
      title: 'Untitled Prompt',
      content: '',
      model: AVAILABLE_MODELS[2].id,
      tags: [],
      isPublic: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCurrentPrompt(newPrompt);
    setShowEditor(true);
    toast.success('New prompt created');
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
      navigate('/auth');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-mono">Loading...</p>
        </div>
      </div>
    );
  }

  // Get prompts based on current view
  const allPrompts = storage.getPrompts();
  const myPrompts = user ? allPrompts.filter(p => p.userId === user.id) : [];
  const publicPrompts = allPrompts.filter(p => p.isPublic);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        activeView={activeView}
        onViewChange={handleViewChange}
        onNewPrompt={handleNewPrompt}
        onLogout={handleLogout}
        user={user}
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
                prompts={myPrompts}
                onSelectPrompt={handleSelectPrompt}
                onEditPrompt={handleEditPrompt}
                onDeletePrompt={handleDeletePrompt}
                currentPromptId={currentPrompt?.id}
              />
            ) : (
              <PublicLibrary
                prompts={publicPrompts}
                onSelectPrompt={handleSelectPrompt}
                onCopyPrompt={handleCopyPrompt}
                onUsePrompt={handleUsePrompt}
                currentPromptId={currentPrompt?.id}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AppPage;
