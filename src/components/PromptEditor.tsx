import { useState, useEffect, useCallback, useRef } from 'react';
import { Copy, Save, Share2, FileText, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { storage, Prompt } from '@/lib/storage';
import { storageManager } from '@/lib/storage-manager';
import { AVAILABLE_MODELS } from '@/lib/models';
import { THINKING_MODES, getModeById } from '@/lib/modes';
import { generateModeAwareActionInstructions } from '@/lib/actions';
import { supabase } from '@/integrations/supabase/client';
import ModelSelector from './ModelSelector';
import ModeSelector from './ModeSelector';
import TagInput from './TagInput';
import ActionButtons from './ActionButtons';
import DeletePromptDialog from './DeletePromptDialog';

interface PromptEditorProps {
  currentPrompt: Prompt | null;
  onPromptChange: (prompt: Prompt) => void;
  onDeletePrompt?: (promptId: string) => void;
}

const PromptEditor = ({ currentPrompt, onPromptChange, onDeletePrompt }: PromptEditorProps) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [model, setModel] = useState(AVAILABLE_MODELS[1].id);
  const [mode, setMode] = useState(THINKING_MODES[5].id);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string>('');
  
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasUnsavedChanges = useRef(false);

  useEffect(() => {
    if (currentPrompt) {
      // Sanitize currentPrompt to match new schema
      const sanitizedPrompt: Prompt = {
        id: currentPrompt.id || '',
        user_id: currentPrompt.user_id || '',
        title: currentPrompt.title || '',
        content: currentPrompt.content || '',
        model: currentPrompt.model || AVAILABLE_MODELS[1].id,
        mode: mode || 'role-prompt',
        color: currentPrompt.color || '#3b82f6',
        is_public: currentPrompt.is_public || false,
        is_featured: currentPrompt.is_featured || false,
        description: currentPrompt.description,
        original_prompt_id: currentPrompt.original_prompt_id,
      };

      setTitle(sanitizedPrompt.title);
      setContent(sanitizedPrompt.content);
      setModel(sanitizedPrompt.model);
      // Mode tidak berubah otomatis - user harus memilih manual
      // Note: tags are now loaded separately via junction table
      setSelectedTags([]);
    } else {
      // Reset form when no prompt is selected
      setTitle('');
      setContent('');
      setModel(AVAILABLE_MODELS[1].id);
      setSelectedTags([]);
    }
  }, [currentPrompt, mode]);

  // Auto-save function
  const autoSave = useCallback(async () => {
    if (!currentPrompt || !hasUnsavedChanges.current) return;

    setIsAutoSaving(true);
    try {
      // Sanitize currentPrompt to match new schema
      const sanitizedPrompt: Prompt = {
        id: currentPrompt.id || '',
        user_id: currentPrompt.user_id || '',
        title: title || '',
        content: content || '',
        model: model || AVAILABLE_MODELS[1].id,
        mode: mode || THINKING_MODES[5].id,
        color: currentPrompt.color || '#3b82f6',
        is_public: currentPrompt.is_public || false,
        is_featured: currentPrompt.is_featured || false,
        description: currentPrompt.description,
        original_prompt_id: currentPrompt.original_prompt_id,
      };

      const updatedPrompt: Prompt = {
        ...sanitizedPrompt,
      };

      await storageManager.savePrompt(updatedPrompt);
      onPromptChange(updatedPrompt);
      hasUnsavedChanges.current = false;
    } catch (error) {
      console.error('Auto-save failed:', error);
      toast.error('Failed to auto-save prompt');
    } finally {
      setTimeout(() => setIsAutoSaving(false), 1000);
    }
  }, [currentPrompt, title, content, model, mode, onPromptChange]);

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
  }, [title, content, model, mode, currentPrompt]); // Removed autoSave from dependencies to prevent infinite loop


  const handleNew = () => {
    const user = storage.getUser();
    if (!user) return;

    const newPrompt: Prompt = {
      id: crypto.randomUUID(),
      userId: user.id,
      title: 'Untitled Prompt',
      content: '',
      model: AVAILABLE_MODELS[1].id,
      mode: THINKING_MODES[5].id,
      color: '#3b82f6',
      isPublic: false,
      isFeatured: false,
    };

    onPromptChange(newPrompt);
    toast.success('New prompt created');
  };

  const handleSave = async () => {
    if (!currentPrompt) return;

    try {
      // Sanitize currentPrompt to match new schema
      const sanitizedPrompt: Prompt = {
        id: currentPrompt.id || '',
        user_id: currentPrompt.user_id || '',
        title: title || '',
        content: content || '',
        model: model || AVAILABLE_MODELS[1].id,
        mode: mode || THINKING_MODES[5].id,
        color: currentPrompt.color || '#3b82f6',
        is_public: currentPrompt.is_public || false,
        is_featured: currentPrompt.is_featured || false,
        description: currentPrompt.description,
        original_prompt_id: currentPrompt.original_prompt_id,
      };

      const updatedPrompt: Prompt = {
        ...sanitizedPrompt,
      };

      await storageManager.savePrompt(updatedPrompt);
      onPromptChange(updatedPrompt);
      hasUnsavedChanges.current = false;
      toast.success('Prompt saved successfully');
    } catch (error) {
      console.error('Failed to save prompt:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save prompt');
    }
  };

  const handleCopy = async () => {
    if (!currentPrompt) return;

    try {
      // Create a copy of the current prompt
      const copiedPrompt: Prompt = {
        id: crypto.randomUUID(),
        user_id: currentPrompt.user_id || '',
        title: `Copy of ${currentPrompt.title}`,
        content: currentPrompt.content,
        model: currentPrompt.model || AVAILABLE_MODELS[1].id,
        mode: currentPrompt.mode || THINKING_MODES[5].id,
        color: currentPrompt.color || '#3b82f6',
        is_public: false, // Copies start as private
        is_featured: false,
        description: currentPrompt.description,
        original_prompt_id: currentPrompt.id, // Reference to original prompt
      };

      await storageManager.savePrompt(copiedPrompt);
      onPromptChange(copiedPrompt);
      toast.success('Prompt copied successfully');
    } catch (error) {
      console.error('Failed to copy prompt:', error);
      toast.error('Failed to copy prompt');
    }
  };

  const handleShare = async () => {
    if (!currentPrompt) return;

    try {
      const user = storage.getUser();
      if (!user && !currentPrompt.is_public) {
        toast.error('Please sign in to make prompts public');
        return;
      }

      const updatedPrompt: Prompt = {
        ...currentPrompt,
        is_public: !currentPrompt.is_public,
      };

      await storageManager.savePrompt(updatedPrompt);
      onPromptChange(updatedPrompt);
      toast.success(updatedPrompt.is_public ? 'Prompt is now public' : 'Prompt is now private');
    } catch (error) {
      console.error('Failed to update prompt visibility:', error);
      toast.error('Failed to update prompt visibility');
    }
  };

  const handleDelete = async (promptId: string) => {
    try {
      if (onDeletePrompt) {
        onDeletePrompt(promptId);
      } else {
        await storageManager.deletePrompt(promptId);
        onPromptChange({
          id: crypto.randomUUID(),
          user_id: currentPrompt?.user_id || '',
          title: 'Untitled Prompt',
          content: '',
          model: AVAILABLE_MODELS[1].id,
          mode: THINKING_MODES[5].id,
          color: '#3b82f6',
          is_public: false,
          is_featured: false,
        });
      }
      toast.success('Prompt deleted successfully');
    } catch (error) {
      console.error('Failed to delete prompt:', error);
      toast.error('Failed to delete prompt');
    }
  };


  const handleAction = async (actionId: string) => {
    if (!content.trim()) {
      toast.error('Please enter prompt content first');
      return;
    }

    try {
      setIsActionLoading(true);
      setLoadingAction(actionId);

      // Generate action-specific instructions WITH MODE
      const actionInstructions = generateModeAwareActionInstructions(
        actionId,
        mode,  // Pass current selected mode
        content
      );

      // Call edge function with mode parameter
      const { data, error } = await supabase.functions.invoke('ai-processor', {
        body: {
          model: model,
          prompt: actionInstructions,
          mode: mode,  // Add mode to request
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
        
        // Increment playground count after successful AI response (for non-logged in users only)
        const user = storage.getUser();
        if (!user) {
          const currentCount = parseInt(localStorage.getItem('prompedia_playground_count') || '0');
          const newCount = currentCount + 1;
          localStorage.setItem('prompedia_playground_count', newCount.toString());
          
          // Update parent component's state if available
          if (window.updatePlaygroundCount) {
            window.updatePlaygroundCount(newCount);
          }
          
          // Log the counting event
          console.log(`[Prompt Count] Incremented to ${newCount} after successful AI response`, {
            timestamp: new Date().toISOString(),
            context: 'AI action completion',
            actionId,
            promptLength: content.length,
            responseLength: nextContent.length,
            model
          });
          
          // Show warning when approaching limit
          const PLAYGROUND_LIMIT = 10;
          if (newCount >= PLAYGROUND_LIMIT - 3) {
            toast.warning(`${PLAYGROUND_LIMIT - newCount} playgrounds remaining. Sign in for unlimited access!`);
          }
        }
        
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
              {currentPrompt?.is_public ? 'Make Private' : 'Share'}
            </Button>
            <DeletePromptDialog
              promptTitle={currentPrompt?.title || 'Untitled Prompt'}
              onConfirm={() => handleDelete(currentPrompt?.id || '')}
            />

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
            <TagInput selectedTagNames={selectedTags} onChange={setSelectedTags} />
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
              {selectedTags.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>🏷️</span>
                  <span>{selectedTags.length}</span>
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
