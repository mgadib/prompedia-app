import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import PromptEditor from '@/components/PromptEditor';
import MyLibrary from '@/components/MyLibrary';
import PublicLibrary from '@/components/PublicLibrary';
import { storage, Prompt } from '@/lib/storage';
import { AVAILABLE_MODELS } from '@/lib/models';
import { toast } from 'sonner';

const AppPage = () => {
  const [activeView, setActiveView] = useState<'my-library' | 'public-library'>('my-library');
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    // Load last opened prompt if user is logged in
    const user = storage.getUser();
    if (user) {
      const lastPromptId = storage.getCurrentPromptId();
      if (lastPromptId) {
        const prompts = storage.getPrompts();
        const lastPrompt = prompts.find(p => p.id === lastPromptId);
        if (lastPrompt) {
          setCurrentPrompt(lastPrompt);
          setShowEditor(true);
        }
      }
    }
  }, []);

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
    const user = storage.getUser();
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

  // Get prompts based on current view
  const allPrompts = storage.getPrompts();
  const user = storage.getUser();
  const myPrompts = user ? allPrompts.filter(p => p.userId === user.id) : [];
  const publicPrompts = allPrompts.filter(p => p.isPublic);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        activeView={activeView}
        onViewChange={handleViewChange}
        onNewPrompt={handleNewPrompt}
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
