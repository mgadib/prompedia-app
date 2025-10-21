import { useState, useEffect, useCallback, useRef } from 'react';
import { Copy, Save, Share2, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { storage, Prompt } from '@/lib/storage';
import { AVAILABLE_MODELS } from '@/lib/models';
import { THINKING_MODES, getModeById } from '@/lib/modes';
import { generateActionInstructions } from '@/lib/actions';
import { supabase } from '@/integrations/supabase/client';
import ModelSelector from './ModelSelector';
import ModeSelector from './ModeSelector';
import TagInput from './TagInput';
import ActionButtons from './ActionButtons';

interface PromptEditorProps {
  currentPrompt: Prompt | null;
  onPromptChange: (prompt: Prompt) => void;
}

const PromptEditor = ({ currentPrompt, onPromptChange }: PromptEditorProps) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [model, setModel] = useState(AVAILABLE_MODELS[1].id);
  const [mode, setMode] = useState(THINKING_MODES[5].id);
  const [tags, setTags] = useState<string[]>([]);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string>('');
  
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasUnsavedChanges = useRef(false);

  useEffect(() => {
    if (currentPrompt) {
      setTitle(currentPrompt.title);
      setContent(currentPrompt.content);
      setModel(currentPrompt.model || AVAILABLE_MODELS[2].id);
      // Mode tidak berubah otomatis - user harus memilih manual
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
      model: AVAILABLE_MODELS[1].id,
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


  const handleAction = async (actionId: string) => {
    if (!content.trim()) {
      toast.error('Please enter prompt content first');
      return;
    }

    try {
      setIsActionLoading(true);
      setLoadingAction(actionId);

      // Generate action-specific instructions
      const actionInstructions = generateActionInstructions(actionId, content);
      
      // Call edge function to process the prompt
      // Note: Don't send mode when using action buttons - they have their own instructions
      const { data, error } = await supabase.functions.invoke('ai-processor', {
        body: {
          model: model,
          prompt: actionInstructions,
          options: {
            temperature: 0.7,
            max_tokens: 2048
          }
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to process prompt');
      }
      
      if (data) {
        // Check for API error in response
        if (data.error) {
          throw new Error(data.error);
        }
        
        const processedContent = data?.choices?.[0]?.message?.content || data?.response || '';
        if (!processedContent) throw new Error('No response from AI');
        
        // Prefer extracted refined content when available
        let nextContent = processedContent;
        const refinedMatch = processedContent.match(/##\s*Hasil\s*Refined\s*([\s\S]*?)(?:\n##|$)/i);
        if (refinedMatch) {
          nextContent = refinedMatch[1].trim();
        }
        
        // Update content with processed result
        setContent(nextContent);
        hasUnsavedChanges.current = true;
        
        toast.success(`Content ${actionId}d successfully`);
      } else {
        throw new Error('No response from AI');
      }
    } catch (error) {
      console.error(`Error processing ${actionId}:`, error);
      toast.error(error instanceof Error ? error.message : `Failed to ${actionId} content`);
    } finally {
      setIsActionLoading(false);
      setLoadingAction('');
    }
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
        {/* Title and Tags Section - Clean Layout */}
        <div className="flex items-start gap-6">
          {/* Title Section */}
          <div className="flex-1">
            <Input
              value={title}
              onChange={(e) => {
                const newValue = e.target.value;
                if (newValue.length <= 77) {
                  setTitle(newValue);
                }
              }}
              placeholder="Enter prompt title..."
              className="text-xl font-bold bg-transparent border-none px-0 focus-visible:ring-0 placeholder:text-muted-foreground/50"
              maxLength={77}
            />
          </div>

          {/* Tags Section */}
          <div className="flex-1">
            <TagInput tags={tags} onChange={setTags} />
          </div>
        </div>


        {/* Main Prompt Content */}
        <div className="space-y-3">
          <ActionButtons 
            onAction={handleAction}
            disabled={!content.trim()}
            isLoading={isActionLoading}
            loadingAction={loadingAction}
          />
          
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing..."
            className="min-h-[300px] bg-card border-border font-mono text-sm resize-none leading-relaxed"
          />
        </div>

      </div>

      {/* Footer Status - Minimal */}
      {currentPrompt && (
        <div className="border-t border-border px-4 py-3 bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isAutoSaving && (
                <div className="flex items-center gap-1 text-primary">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="text-xs">Saving...</span>
                </div>
              )}
              {hasUnsavedChanges.current && !isAutoSaving && (
                <div className="flex items-center gap-1 text-yellow-400">
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  <span className="text-xs">Unsaved</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-1 text-xs ${currentPrompt.isPublic ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-2 h-2 rounded-full ${currentPrompt.isPublic ? 'bg-primary' : 'bg-muted-foreground'}`} />
                {currentPrompt.isPublic ? 'Public' : 'Private'}
              </div>
              {tags.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>🏷️</span>
                  <span>{tags.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptEditor;
