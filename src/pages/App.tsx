import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import PromptEditor from '@/components/PromptEditor';
import { storage, Prompt } from '@/lib/storage';

const AppPage = () => {
  const [activeView, setActiveView] = useState<'my-library' | 'public-library'>('my-library');
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);

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
        }
      }
    }
  }, []);

  const handlePromptChange = (prompt: Prompt) => {
    setCurrentPrompt(prompt);
    storage.setCurrentPrompt(prompt.id);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      <div className="flex-1 flex flex-col">
        <PromptEditor
          currentPrompt={currentPrompt}
          onPromptChange={handlePromptChange}
        />
      </div>
    </div>
  );
};

export default AppPage;
