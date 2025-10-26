import { useState, useEffect, useCallback } from 'react';
import { Copy, Save, Share2, FileText, Trash2, ArrowLeft, ArrowRight, CheckCircle, Lock, Globe, Leaf, EyeOff } from 'lucide-react';
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
import { rateLimitingService } from '@/lib/rate-limiting';
import { TagService } from '@/lib/tag-service';
import ModelSelector from './ModelSelector';
import ModeSelector from './ModeSelector';
import TagInput from './TagInput';
import ActionButtons from './ActionButtons';
import DeletePromptDialog from './DeletePromptDialog';

type ViewState = 'original' | 'ai-result';

interface PromptEditorProps {
  currentPrompt: Prompt | null;
  onPromptChange: (prompt: Prompt) => void;
  onDeletePrompt?: (promptId: string) => void;
  onNewPrompt?: () => void;
  isFocusMode?: boolean;
  onToggleFocus?: () => void;
  user?: any;
}

const PromptEditor = ({ currentPrompt, onPromptChange, onDeletePrompt, onNewPrompt, isFocusMode = false, onToggleFocus, user }: PromptEditorProps) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [aiResultContent, setAiResultContent] = useState('');
  const [viewState, setViewState] = useState<ViewState>('original');
  const [model, setModel] = useState(AVAILABLE_MODELS[1].id);
  const [mode, setMode] = useState(THINKING_MODES[5].id);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string>('');
  const [userCanUseAI, setUserCanUseAI] = useState(true);


  useEffect(() => {
    if (currentPrompt) {
      // Sanitize currentPrompt to match new schema
      const sanitizedPrompt: Prompt = {
        id: currentPrompt.id || '',
        user_id: currentPrompt.user_id || '',
        title: currentPrompt.title || '',
        content: currentPrompt.content || '',
        model: currentPrompt.model || AVAILABLE_MODELS[1].id,
        mode: currentPrompt.mode as 'meta-prompt' | 'thinking' | 'normal' || (mode as 'meta-prompt' | 'thinking' | 'normal') || 'normal',
        color: currentPrompt.color || '#3b82f6',
        is_public: currentPrompt.is_public || false,
        is_featured: currentPrompt.is_featured || false,
        description: currentPrompt.description,
        original_prompt_id: currentPrompt.original_prompt_id,
      };

      setTitle(sanitizedPrompt.title);
      setContent(sanitizedPrompt.content);
      setModel(sanitizedPrompt.model);
      setMode(sanitizedPrompt.mode);
      
      // Load existing tags for the prompt
      loadPromptTags(sanitizedPrompt.id);

      // Reset AI result state when loading a new prompt
      setOriginalContent('');
      setAiResultContent('');
      setViewState('original');
    } else {
      // Reset form when no prompt is selected
      setTitle('');
      setContent('');
      setModel(AVAILABLE_MODELS[1].id);
      setMode(THINKING_MODES[5].id);
      setSelectedTags([]);

      // Reset AI result state
      setOriginalContent('');
      setAiResultContent('');
      setViewState('original');
    }
  }, [currentPrompt]);

  // Load tags for a prompt
  const loadPromptTags = async (promptId: string) => {
    try {
      const tags = await TagService.getPromptTags(promptId);
      setSelectedTags(tags.map(tag => tag.name));
    } catch (error) {
      console.error('Failed to load prompt tags:', error);
      setSelectedTags([]);
    }
  };

  // Handle back to original prompt
  const handleBack = useCallback(() => {
    if (originalContent && viewState === 'ai-result') {
      setContent(originalContent);
      setViewState('original');
    }
  }, [originalContent, viewState]);

  // Handle forward to AI result
  const handleForward = useCallback(() => {
    if (aiResultContent && viewState === 'original') {
      setContent(aiResultContent);
      setViewState('ai-result');
    }
  }, [aiResultContent, viewState]);

  // Check rate limits periodically for real-time UI updates
  useEffect(() => {
    const checkRateLimits = async () => {
      try {
        const user = await supabase.auth.getUser().then(({ data }) => data.user);
        const rateLimitCheck = await rateLimitingService.canMakeAICall(user);
        setUserCanUseAI(rateLimitCheck.allowed);
      } catch (error) {
        console.error('Failed to check rate limits:', error);
        setUserCanUseAI(false);
      }
    };

    checkRateLimits();

    // Check every 30 seconds for real-time updates
    const interval = setInterval(checkRateLimits, 30000);

    return () => clearInterval(interval);
  }, []);



  const handleNew = async () => {
    if (onNewPrompt) {
      // Use the parent's new prompt handler
      onNewPrompt();
    } else {
      // Fallback to local implementation
      try {
        const user = await supabase.auth.getUser().then(({ data }) => data.user);
        
        if (!user) {
          toast.error('Please sign in to create new prompts');
          return;
        }

        const newPrompt: Prompt = {
          id: crypto.randomUUID(),
          user_id: user.id,
          title: 'Untitled Prompt',
          content: '',
          model: AVAILABLE_MODELS[1].id,
          mode: THINKING_MODES[5].id as 'meta-prompt' | 'thinking' | 'normal',
          color: '#3b82f6',
          is_public: false,
          is_featured: false,
          description: null,
          original_prompt_id: null,
        };

        try {
          onPromptChange(newPrompt);
        } catch (error) {
          console.error('Failed to update prompt:', error);
          toast.error('Failed to update prompt');
        }
        toast.success('New prompt created');
      } catch (error) {
        console.error('Failed to create new prompt:', error);
        toast.error('Failed to create new prompt');
      }
    }
  };

  const handleSave = async () => {
    if (!title || !content) {
      toast.error('Please enter a title and content');
      return;
    }

    console.log('Save button clicked:', {
      title,
      content,
      currentPrompt: currentPrompt?.id,
      hasCurrentPrompt: !!currentPrompt
    });

    try {
      const user = await supabase.auth.getUser().then(({ data }) => data.user);

      console.log('Save attempt:', {
        title,
        content,
        user,
        hasUser: !!user,
        userId: user?.id,
        currentPromptId: currentPrompt?.id,
        storageManagerAuth: storageManager.getAuthDebugInfo()
      });

      // Guest users cannot save prompts (only localStorage auto-save for current session)
      if (!user) {
        toast.error('Please sign in to save prompts permanently');
        return;
      }

      // Check if user can make AI calls (they need quota for saving)
      const rateLimitCheck = await rateLimitingService.canMakeAICall(user);
      if (!rateLimitCheck.allowed) {
        toast.error('Please wait before saving. AI limit reached.');
        return;
      }

      // Create or update prompt
      const promptToSave: Prompt = {
        id: currentPrompt?.id || crypto.randomUUID(),
        user_id: user.id,
        title: title || '',
        content: content || '',
        model: model || AVAILABLE_MODELS[1].id,
        mode: (mode || THINKING_MODES[5].id) as 'meta-prompt' | 'thinking' | 'normal',
        color: currentPrompt?.color || '#3b82f6',
        is_public: currentPrompt?.is_public || false,
        is_featured: currentPrompt?.is_featured || false,
        description: currentPrompt?.description || null,
        original_prompt_id: currentPrompt?.original_prompt_id || null,
      };

      console.log('Prompt to save:', promptToSave);

      await storageManager.savePrompt(promptToSave);
      
      // Save tags for the prompt
      if (selectedTags.length > 0) {
        await TagService.savePromptTags(promptToSave.id, selectedTags, user.id);
      }
      
      try {
        onPromptChange(promptToSave);
      } catch (error) {
        console.error('Failed to update prompt:', error);
        toast.error('Failed to update prompt');
      }
      toast.success('Prompt saved successfully');

      // Increment usage counter after successful save
      await rateLimitingService.incrementUsage(user);
    } catch (error) {
      console.error('Failed to save prompt:', error);
      console.error('Error details:', {
        errorType: typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        title,
        content,
        userId: user?.id,
        hasUser: !!user,
        storageManagerAuth: storageManager.getAuthDebugInfo()
      });
      toast.error(error instanceof Error ? error.message : 'Failed to save prompt');
    }
  };

  const handleCopy = async () => {
    if (!content) {
      toast.error('No content to copy');
      return;
    }

    try {
      await navigator.clipboard.writeText(content);
      toast.success('Content copied to clipboard');
    } catch (error) {
      console.error('Failed to copy content:', error);
      toast.error('Failed to copy content');
    }
  };

  const handleShare = async () => {
    if (!title || !content) {
      toast.error('Please enter a title and content');
      return;
    }

    console.log('Share button clicked:', {
      title,
      content,
      currentPrompt: currentPrompt?.id,
      hasCurrentPrompt: !!currentPrompt,
      currentIsPublic: currentPrompt?.is_public
    });

    try {
      const user = await supabase.auth.getUser().then(({ data }) => data.user);

      console.log('Share attempt:', {
        title,
        content,
        user,
        hasUser: !!user,
        userId: user?.id,
        currentIsPublic: currentPrompt?.is_public,
        currentPromptId: currentPrompt?.id,
        storageManagerAuth: storageManager.getAuthDebugInfo()
      });

      // Guest users cannot make prompts public or save prompts
      if (!user) {
        toast.error('Please sign in to save and share prompts');
        return;
      }

      // Check if user can make AI calls (they need to be authenticated)
      const rateLimitCheck = await rateLimitingService.canMakeAICall(user);
      if (!rateLimitCheck.allowed) {
        toast.error('Please wait before making changes. AI limit reached.');
        return;
      }

      const updatedPrompt: Prompt = {
        id: currentPrompt?.id || crypto.randomUUID(),
        user_id: user.id,
        title: title || '',
        content: content || '',
        model: model || AVAILABLE_MODELS[1].id,
        mode: (mode || THINKING_MODES[5].id) as 'meta-prompt' | 'thinking' | 'normal',
        color: currentPrompt?.color || '#3b82f6',
        is_public: !currentPrompt?.is_public, // Toggle public status
        is_featured: currentPrompt?.is_featured || false,
        description: currentPrompt?.description || null,
        original_prompt_id: currentPrompt?.original_prompt_id || null,
      };

      console.log('Updated prompt for sharing:', updatedPrompt);

      await storageManager.savePrompt(updatedPrompt);
      
      // Save tags for the prompt
      if (selectedTags.length > 0) {
        await TagService.savePromptTags(updatedPrompt.id, selectedTags, user.id);
      }
      
      try {
        onPromptChange(updatedPrompt);
      } catch (error) {
        console.error('Failed to update prompt:', error);
        toast.error('Failed to update prompt');
      }
      toast.success(updatedPrompt.is_public ? 'Prompt is now public' : 'Prompt is now private');
    } catch (error) {
      console.error('Failed to update prompt visibility:', error);
      console.error('Error details:', {
        errorType: typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        title,
        content,
        userId: user?.id,
        hasUser: !!user,
        storageManagerAuth: storageManager.getAuthDebugInfo()
      });
      toast.error('Failed to update prompt visibility');
    }
  };

  const handleDelete = async (promptId: string) => {
    try {
      const user = await supabase.auth.getUser().then(({ data }) => data.user);

      // Guest users cannot delete prompts
      if (!user) {
        toast.error('Please sign in to delete prompts');
        return;
      }

      // Check if user can make AI calls (deleting requires quota)
      const rateLimitCheck = await rateLimitingService.canMakeAICall(user);
      if (!rateLimitCheck.allowed) {
        toast.error('Please wait before deleting. AI limit reached.');
        return;
      }

      if (onDeletePrompt) {
        onDeletePrompt(promptId);
      } else {
        await storageManager.deletePrompt(promptId);
        try {
          onPromptChange({
            id: crypto.randomUUID(),
            user_id: currentPrompt?.user_id || '',
            title: 'Untitled Prompt',
            content: '',
            model: AVAILABLE_MODELS[1].id,
            mode: THINKING_MODES[5].id as 'meta-prompt' | 'thinking' | 'normal',
            color: '#3b82f6',
            is_public: false,
            is_featured: false,
          });
        } catch (error) {
          console.error('Failed to update prompt:', error);
          toast.error('Failed to update prompt');
        }
      }
      toast.success('Prompt deleted successfully');

      // Increment usage counter after successful delete
      await rateLimitingService.incrementUsage(user);
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

      // Check rate limits before making AI call
      const user = await supabase.auth.getUser().then(({ data }) => data.user);
      const rateLimitCheck = await rateLimitingService.canMakeAICall(user);

      if (!rateLimitCheck.allowed) {
        const limitType = user ? 'daily' : 'guest';
        toast.error(
          `AI usage limit exceeded! ${limitType === 'daily' ? 'Daily' : 'Guest'} limit reached. ${rateLimitCheck.error || ''}`
        );
        return;
      }

      // Show remaining usage warning when approaching limit
      if (rateLimitCheck.usage.remaining <= 3) {
        const limitType = user ? 'daily' : 'guest';
        toast.warning(
          `${rateLimitCheck.usage.remaining} AI calls remaining. ${user ? '' : 'Sign in for unlimited access!'}`
        );
      }

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
            max_tokens: 8192
          }
        }
      });

      // Enhanced error handling
      if (error) {
        console.error('Edge function error:', error);
        
        // Try to extract more meaningful error message
        let errorMessage = 'Failed to process prompt';
        
        if (error.message) {
          errorMessage = error.message;
        }
        
        if (error.context) {
          console.error('Error context:', error.context);
        }
        
        throw new Error(errorMessage);
      }
      
      if (!data) {
        throw new Error('No response from AI service');
      }

      // Check for API error in response
      if (data.error) {
        console.error('API error response:', data);
        throw new Error(data.error);
      }
      
      const processedContent = data?.choices?.[0]?.message?.content || data?.response || '';
      if (!processedContent) {
        console.error('No content in response:', data);
        throw new Error('No response content from AI');
      }
      
      // Prefer extracted refined content when available
      let nextContent = processedContent;
      const refinedMatch = processedContent.match(/##\s*Hasil\s*Refined\s*([\s\S]*?)(?:\n##|$)/i);
      if (refinedMatch) {
        nextContent = refinedMatch[1].trim();
      }
      
      // Store original content and show AI result
      if (viewState === 'original') {
        setOriginalContent(content);
      }
      setAiResultContent(nextContent);
      setContent(nextContent);
      setViewState('ai-result');
      
      
      toast.success(`Content ${actionId}d successfully`);

      // Increment usage counter after successful AI response
      await rateLimitingService.incrementUsage(user);

    } catch (error) {
      console.error(`Error processing ${actionId}:`, error);
      
      // More detailed error message
      let errorMsg = `Failed to ${actionId} content`;
      if (error instanceof Error) {
        errorMsg = error.message;
        
        // Show specific error types
        if (errorMsg.includes('rate limit') || errorMsg.includes('429')) {
          errorMsg = 'AI service rate limit exceeded. Please try again in a moment.';
        } else if (errorMsg.includes('API key') || errorMsg.includes('401')) {
          errorMsg = 'API authentication failed. Please contact support.';
        } else if (errorMsg.includes('timeout')) {
          errorMsg = 'Request timeout. Please try again.';
        }
      }
      
      toast.error(errorMsg);
    } finally {
      setIsActionLoading(false);
      setLoadingAction('');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      {/* Header Bar */}
      <div className="border-b border-border px-6 py-4 bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {user && (
              <Button
                onClick={onToggleFocus}
                variant="ghost"
                size="sm"
                className={`font-mono ${
                  isFocusMode 
                    ? 'bg-accent text-accent-foreground hover:bg-accent/90' 
                    : 'hover:bg-accent/20 hover:text-accent'
                }`}
                title={isFocusMode ? 'Exit Focus Mode' : 'Focus Mode - Hide Sidebar for Clean Editing'}
              >
                {isFocusMode ? (
                  <EyeOff className="w-4 h-4 mr-2" />
                ) : (
                  <Leaf className="w-4 h-4 mr-2" />
                )}
                Focus
              </Button>
            )}
            <Button
              onClick={handleNew}
              variant="ghost"
              size="sm"
              className="hover:bg-accent/20 hover:text-accent font-mono"
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
              disabled={!title || !content}
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button
              onClick={handleShare}
              variant="ghost"
              size="sm"
              className="hover:bg-accent/20 hover:text-accent font-mono"
              disabled={!title || !content}
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
      <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-4">
        {/* Title and Tags Section - Clean Layout */}
        <div className="flex items-start gap-8">
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
              className="text-xl font-bold bg-transparent border-none px-3 py-2 focus-visible:ring-0 placeholder:text-muted-foreground/50"
              maxLength={77}
            />
          </div>

          {/* Tags Section */}
          <div className="flex-1">
            <TagInput selectedTagNames={selectedTags} onChange={setSelectedTags} />
          </div>
        </div>


        {/* Main Prompt Content */}
        <div className="flex flex-col flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <ActionButtons
              onAction={handleAction}
              disabled={!content.trim() || viewState === 'ai-result' || !userCanUseAI}
              isLoading={isActionLoading}
              loadingAction={loadingAction}
            />

            {/* Navigation buttons */}
            {viewState === 'ai-result' && (
              <Button
                onClick={handleBack}
                variant="outline"
                size="sm"
                className="text-xs h-8 px-3 hover:bg-secondary/20 transition-all font-mono"
                title="Back to original prompt"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}

            {viewState === 'original' && aiResultContent && (
              <Button
                onClick={handleForward}
                variant="outline"
                size="sm"
                className="text-xs h-8 px-3 hover:bg-secondary/20 transition-all font-mono"
                title="Forward to AI result"
              >
                <ArrowRight className="w-4 h-4 mr-1" />
                Forward
              </Button>
            )}

            {/* AI Result indicator */}
            {viewState === 'ai-result' && (
              <div className="flex items-center gap-1 text-primary ml-auto">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs font-mono">AI Generated</span>
              </div>
            )}

            {/* Original prompt indicator */}
            {viewState === 'original' && originalContent && (
              <div className="flex items-center gap-1 text-muted-foreground ml-auto">
                <FileText className="w-4 h-4" />
                <span className="text-xs font-mono">Original</span>
              </div>
            )}

            {/* Character limit warning */}
            {content.length > 45000 && (
              <div className="flex items-center gap-1 text-red-400 ml-auto">
                <span className="text-xs font-mono">⚠️ Character Limit Near</span>
              </div>
            )}

            {/* Rate limit warning */}
            {!userCanUseAI && (
              <div className="flex items-center gap-1 text-red-400 ml-auto">
                <span className="text-xs font-mono">⚠️ AI Limit Exceeded</span>
              </div>
            )}
          </div>

          <Textarea
            value={content}
            onChange={(e) => {
              const newContent = e.target.value;
              setContent(newContent);

              // Update the corresponding state based on current view
              if (viewState === 'original') {
                setOriginalContent(newContent);
              } else if (viewState === 'ai-result') {
                setAiResultContent(newContent);
              }
            }}
            placeholder="Start writing..."
            className="flex-1 min-h-0 bg-card border-border font-mono text-sm resize-none leading-relaxed prompt-editor-textarea"
            maxLength={50000}
          />
        </div>

      </div>

      {/* Footer Status - Enhanced Info */}
      <div className="border-t border-border px-4 py-3 bg-card mt-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Word count */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
              <FileText className="w-3 h-3" />
              <span>{content.split(/\s+/).filter(word => word.length > 0).length} words</span>
            </div>

            {/* Character count with limit indicator */}
            <div className="flex items-center gap-1 text-xs font-mono">
              <span>#</span>
              <span className={content.length > 45000 ? "text-red-400" : content.length > 40000 ? "text-yellow-400" : "text-muted-foreground"}>
                {content.length.toLocaleString()}/50,000
              </span>
            </div>

            {/* Current date */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
              <span>📅</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>

            {/* AI Result indicator */}
            {viewState === 'ai-result' && (
              <div className="flex items-center gap-1 text-primary font-mono">
                <CheckCircle className="w-3 h-3" />
                <span className="text-xs">AI Generated</span>
              </div>
            )}

          </div>

          <div className="flex items-center gap-3">
            {currentPrompt && (
              <>
                <div className={`flex items-center gap-2 text-xs font-mono ${currentPrompt.is_public ? 'text-primary' : 'text-muted-foreground'}`}>
                  {currentPrompt.is_public ? (
                    <Globe className="w-3 h-3 text-primary" />
                  ) : (
                    <Lock className="w-3 h-3 text-muted-foreground" />
                  )}
                  <span>{currentPrompt.is_public ? 'Public' : 'Private'}</span>
                </div>
                {selectedTags.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>🏷️</span>
                    <span>{selectedTags.length}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptEditor;
