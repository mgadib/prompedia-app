import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import PromptEditor from '@/components/PromptEditor';
import PromptLibrary from '@/components/PromptLibrary';
import { storage, Prompt } from '@/lib/storage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AppPage = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<'my-library' | 'public-library'>('my-library');
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'library'>('editor');

  useEffect(() => {
    const user = storage.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }

    // Load last opened prompt
    const lastPromptId = storage.getCurrentPromptId();
    if (lastPromptId) {
      const prompts = storage.getPrompts();
      const lastPrompt = prompts.find(p => p.id === lastPromptId);
      if (lastPrompt) {
        setCurrentPrompt(lastPrompt);
      }
    }
  }, [navigate]);

  const handlePromptChange = (prompt: Prompt) => {
    setCurrentPrompt(prompt);
    storage.setCurrentPrompt(prompt.id);
  };

  const handleSelectPrompt = (prompt: Prompt) => {
    setCurrentPrompt(prompt);
    storage.setCurrentPrompt(prompt.id);
    setActiveTab('editor');
  };

  const user = storage.getUser();
  const myPrompts = user ? storage.getUserPrompts(user.id) : [];
  const publicPrompts = storage.getPublicPrompts();
  const displayPrompts = activeView === 'my-library' ? myPrompts : publicPrompts;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      <div className="flex-1 flex flex-col">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'editor' | 'library')} className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent h-12 px-6">
            <TabsTrigger
              value="editor"
              className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              Editor
            </TabsTrigger>
            <TabsTrigger
              value="library"
              className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              Library
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="flex-1 m-0">
            <PromptEditor
              currentPrompt={currentPrompt}
              onPromptChange={handlePromptChange}
            />
          </TabsContent>

          <TabsContent value="library" className="flex-1 m-0 overflow-auto">
            <PromptLibrary
              prompts={displayPrompts}
              onSelectPrompt={handleSelectPrompt}
              currentPromptId={currentPrompt?.id}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AppPage;
