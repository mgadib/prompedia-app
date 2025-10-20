import { useState, useEffect, useCallback, useRef } from 'react';
import { Copy, Save, Share2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { storage, Prompt } from '@/lib/storage';
import ModelSelector from './ModelSelector';
import ModeSelector from './ModeSelector';
import TagInput from './TagInput';

interface PromptEditorProps {
  currentPrompt: Prompt | null;
  onPromptChange: (prompt: Prompt) => void;
}

const PromptEditor = ({ currentPrompt, onPromptChange }: PromptEditorProps) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [model, setModel] = useState('GPT-4');
  const [mode, setMode] = useState('zero-shot');
  const [tags, setTags] = useState<string[]>([]);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasUnsavedChanges = useRef(false);

  useEffect(() => {
    if (currentPrompt) {
      setTitle(currentPrompt.title);
      setContent(currentPrompt.content);
      setModel(currentPrompt.model || 'GPT-4');
      setMode((currentPrompt as any).mode || 'zero-shot');
      setTags(currentPrompt.tags);
    }
  }, [currentPrompt]);

  // Auto-save function
  const autoSave = useCallback(() => {
    if (!currentPrompt || !hasUnsavedChanges.current) return;

    setIsAutoSaving(true);
    const updatedPrompt: Prompt = {
      ...currentPrompt,
      title,
      content,
      model,
      mode,
      tags,
      updatedAt: new Date().toISOString(),
    } as any;

    storage.savePrompt(updatedPrompt);
    onPromptChange(updatedPrompt);
    hasUnsavedChanges.current = false;
    
    setTimeout(() => setIsAutoSaving(false), 1000);
  }, [currentPrompt, title, content, model, tags, onPromptChange]);

  // Debounced auto-save effect
  useEffect(() => {
    if (!currentPrompt) return;

    hasUnsavedChanges.current = true;
    
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSave();
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [title, content, model, mode, tags, autoSave, currentPrompt]);

  const handleNew = () => {
    const user = storage.getUser();
    if (!user) return;

    const newPrompt: Prompt = {
      id: crypto.randomUUID(),
      userId: user.id,
      title: 'Untitled Prompt',
      content: '',
      model: 'GPT-4',
      tags: [],
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
      model,
      tags,
      updatedAt: new Date().toISOString(),
    };

    storage.savePrompt(updatedPrompt);
    onPromptChange(updatedPrompt);
    hasUnsavedChanges.current = false;
    toast.success('Prompt saved manually');
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
    <div className="flex-1 flex flex-col h-screen bg-background">
      {/* Header Bar */}
      <div className="border-b border-border px-6 py-4 bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              onClick={handleNew}
              variant="ghost"
              size="sm"
              className="prompedia-button text-white hover:bg-primary/90 font-mono"
            >
              <FileText className="w-4 h-4 mr-2" />
              New
            </Button>
            <Button
              onClick={handleCopy}
              variant="ghost"
              size="sm"
              className="hover:bg-accent/20 hover:text-accent font-mono"
              disabled={!content}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
            <Button
              onClick={handleSave}
              variant="ghost"
              size="sm"
              className="hover:bg-accent/20 hover:text-accent font-mono"
              disabled={!currentPrompt}
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button
              onClick={handleShare}
              variant="ghost"
              size="sm"
              className="hover:bg-accent/20 hover:text-accent font-mono"
              disabled={!currentPrompt}
            >
              <Share2 className="w-4 h-4 mr-2" />
              {currentPrompt?.isPublic ? 'Make Private' : 'Share'}
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <ModeSelector value={mode} onChange={setMode} />
            <ModelSelector value={model} onChange={setModel} />
          </div>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Title and Tags Section - Compact Layout */}
        <div className="flex items-start gap-6">
          {/* Title Section */}
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">
                Title
              </label>
              <span className={`text-xs font-mono ${title.length > 77 ? 'text-red-500' : 'text-muted-foreground'}`}>
                {title.length}/77
              </span>
            </div>
            <Input
              value={title}
              onChange={(e) => {
                const newValue = e.target.value;
                if (newValue.length <= 77) {
                  setTitle(newValue);
                }
              }}
              placeholder="Untitled Prompt"
              className={`text-xl font-bold bg-transparent border-none px-0 focus-visible:ring-0 font-mono prompedia-accent ${
                title.length > 77 ? 'text-red-500' : ''
              }`}
              maxLength={77}
            />
          </div>

          {/* Tags Section */}
          <div className="flex-1 space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">
              Tags
            </label>
            <TagInput tags={tags} onChange={setTags} />
          </div>
        </div>

        {/* Main Prompt Content */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">
            Prompt Content
          </label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your AI prompt here..."
            className="min-h-[400px] bg-card border-border font-mono text-sm resize-none leading-relaxed"
          />
        </div>
      </div>

      {/* Footer Status */}
      {currentPrompt && (
        <div className="border-t border-border px-4 py-2 bg-card">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
            <div className="flex items-center gap-4">
              <span>Last updated: {new Date(currentPrompt.updatedAt).toLocaleString()}</span>
              {isAutoSaving && (
                <span className="text-prompedia-green-400 animate-pulse">Auto-saving...</span>
              )}
              {hasUnsavedChanges.current && !isAutoSaving && (
                <span className="text-yellow-400">Unsaved changes</span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span>Model: {model}</span>
              <span>Mode: {mode}</span>
              <span>Tags: {tags.length}</span>
              <span className={`px-2 py-1 rounded-full text-xs ${currentPrompt.isPublic ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                {currentPrompt.isPublic ? 'Public' : 'Private'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptEditor;
