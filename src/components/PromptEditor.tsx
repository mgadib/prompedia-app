import { useState, useEffect } from 'react';
import { Copy, Save, Share2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { storage, Prompt } from '@/lib/storage';
import ModelSelector from './ModelSelector';
import TagInput from './TagInput';

interface PromptEditorProps {
  currentPrompt: Prompt | null;
  onPromptChange: (prompt: Prompt) => void;
}

const PromptEditor = ({ currentPrompt, onPromptChange }: PromptEditorProps) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [model, setModel] = useState('GPT-4');
  const [tags, setTags] = useState<string[]>([]);
  const [color, setColor] = useState('#10b981');

  useEffect(() => {
    if (currentPrompt) {
      setTitle(currentPrompt.title);
      setContent(currentPrompt.content);
      setDescription(currentPrompt.description || '');
      setModel(currentPrompt.model || 'GPT-4');
      setTags(currentPrompt.tags);
      setColor(currentPrompt.color || '#10b981');
    }
  }, [currentPrompt]);

  const handleNew = () => {
    const user = storage.getUser();
    if (!user) return;

    const newPrompt: Prompt = {
      id: crypto.randomUUID(),
      userId: user.id,
      title: 'Untitled Prompt',
      content: '',
      description: '',
      model: 'GPT-4',
      tags: [],
      color: '#10b981',
      isPublic: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onPromptChange(newPrompt);
    toast.success('New prompt created');
  };

  const handleSave = () => {
    if (!currentPrompt) return;

    const updatedPrompt: Prompt = {
      ...currentPrompt,
      title,
      content,
      description,
      model,
      tags,
      color,
      updatedAt: new Date().toISOString(),
    };

    storage.savePrompt(updatedPrompt);
    onPromptChange(updatedPrompt);
    toast.success('Prompt saved');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard');
  };

  const handleShare = () => {
    if (!currentPrompt) return;

    const updatedPrompt: Prompt = {
      ...currentPrompt,
      isPublic: !currentPrompt.isPublic,
    };

    storage.savePrompt(updatedPrompt);
    onPromptChange(updatedPrompt);
    toast.success(updatedPrompt.isPublic ? 'Prompt is now public' : 'Prompt is now private');
  };

  return (
    <div className="flex-1 flex flex-col h-screen">
      <div className="border-b border-border px-6 py-3 flex items-center gap-3">
        <Button
          onClick={handleNew}
          variant="ghost"
          size="sm"
          className="text-primary hover:bg-accent/50"
        >
          <FileText className="w-4 h-4 mr-2" />
          New
        </Button>
        <Button
          onClick={handleCopy}
          variant="ghost"
          size="sm"
          className="hover:bg-accent/50"
          disabled={!content}
        >
          <Copy className="w-4 h-4 mr-2" />
          Copy
        </Button>
        <Button
          onClick={handleSave}
          variant="ghost"
          size="sm"
          className="text-primary hover:bg-accent/50"
          disabled={!currentPrompt}
        >
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
        <Button
          onClick={handleShare}
          variant="ghost"
          size="sm"
          className="hover:bg-accent/50"
          disabled={!currentPrompt}
        >
          <Share2 className="w-4 h-4 mr-2" />
          {currentPrompt?.isPublic ? 'Make Private' : 'Share'}
        </Button>

        <div className="ml-auto flex items-center gap-3">
          <ModelSelector value={model} onChange={setModel} />
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border border-border"
            title="Prompt color"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-4">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled Prompt"
          className="text-xl font-semibold bg-transparent border-none px-0 focus-visible:ring-0"
        />

        <TagInput tags={tags} onChange={setTags} />

        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a description..."
          className="min-h-[80px] bg-secondary border-border resize-none"
        />

        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your prompt here..."
          className="min-h-[400px] bg-background border-border font-mono text-sm resize-none"
        />
      </div>

      {currentPrompt && (
        <div className="border-t border-border px-6 py-2 text-xs text-muted-foreground">
          Last updated: {new Date(currentPrompt.updatedAt).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default PromptEditor;
