import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, ArrowLeft, ArrowRight, CheckCircle, Lock, Globe, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { storage, Prompt } from '@/lib/storage';
import { storageManager } from '@/lib/storage-manager';
import { AVAILABLE_MODELS } from '@/features/prompts/utils/models';
import { THINKING_MODES, getModeById } from '@/features/prompts/utils/modes';
import { sanitizePrompt } from '@/features/prompts/utils/prompt-utils';
import { generateModeAwareActionInstructions } from '@/features/prompts/utils/actions';
import { supabase } from '@/integrations/supabase/client';
import { rateLimitingService } from '@/shared/utils/rate-limiting';
import { TagService } from '@/features/tags/services/tag-service';
import ModelSelector from './ModelSelector';
import ModeSelector from './ModeSelector';
import TagInput from '@/features/tags/components/TagInput';
import AIActionsDropdown from './AIActionsDropdown';
import EditorActionsMenu from './EditorActionsMenu';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import type { User } from '@supabase/supabase-js';

type ViewState = 'original' | 'ai-result';

interface PromptEditorProps {
  currentPrompt: Prompt | null;
  onPromptChange: (prompt: Prompt) => void;
  onDeletePrompt?: (promptId: string) => void;
  onNewPrompt?: () => void;
  isFocusMode?: boolean;
  onToggleFocus?: () => void;
  user?: User | null;
}

const PromptEditor = ({ currentPrompt, onPromptChange, onDeletePrompt, onNewPrompt, isFocusMode = false, onToggleFocus, user }: PromptEditorProps) => {
  const { t } = useTranslation();
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
  const isMobile = useIsMobile();


  useEffect(() => {
    if (currentPrompt) {
      // Menyucikan currentPrompt agar sesuai dengan schema baru
      const sanitizedPrompt = sanitizePrompt(currentPrompt);
      
      // Handle both old and new schema formats
      const modelValue = sanitizedPrompt.model_id || sanitizedPrompt.model || AVAILABLE_MODELS[1].id;
      const modeValue = sanitizedPrompt.mode_id || sanitizedPrompt.mode || mode || 'normal';

      setTitle(sanitizedPrompt.title);
      setContent(sanitizedPrompt.content);
      setModel(modelValue);
      setMode(modeValue as 'meta-prompt' | 'thinking' | 'normal');
      
      // Memuat tag yang sudah ada untuk prompt
      loadPromptTags(sanitizedPrompt.id);

      // Reset state hasil AI saat memuat prompt baru
      setOriginalContent('');
      setAiResultContent('');
      setViewState('original');
    } else {
      // Reset form ketika tidak ada prompt yang dipilih
      setTitle('');
      setContent('');
      setModel(AVAILABLE_MODELS[1].id);
      setMode(THINKING_MODES[5].id);
      setSelectedTags([]);

      // Reset state hasil AI
      setOriginalContent('');
      setAiResultContent('');
      setViewState('original');
    }
  }, [currentPrompt, mode]);

  // Memuat tag untuk sebuah prompt
  const loadPromptTags = async (promptId: string) => {
    try {
      const tags = await TagService.getPromptTags(promptId);
      setSelectedTags(tags.map(tag => tag.name));
    } catch (error) {
      console.error('Failed to load prompt tags:', error);
      setSelectedTags([]);
    }
  };

  // Menangani kembali ke prompt original
  const handleBack = useCallback(() => {
    if (originalContent && viewState === 'ai-result') {
      setContent(originalContent);
      setViewState('original');
    }
  }, [originalContent, viewState]);

  // Menangani maju ke hasil AI
  const handleForward = useCallback(() => {
    if (aiResultContent && viewState === 'original') {
      setContent(aiResultContent);
      setViewState('ai-result');
    }
  }, [aiResultContent, viewState]);

  // Mengecek batas penggunaan secara berkala untuk update UI real-time
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

    // Mengecek setiap 30 detik untuk update real-time
    const interval = setInterval(checkRateLimits, 30000);

    return () => clearInterval(interval);
  }, []);



  const handleNew = async () => {
    if (onNewPrompt) {
      // Menggunakan handler prompt baru dari parent
      onNewPrompt();
    } else {
      // Fallback ke implementasi lokal
      try {
        const user = await supabase.auth.getUser().then(({ data }) => data.user);
        
      if (!user) {
        toast.error(t('errors:actions.signInToCreate'));
        return;
      }

        const newPrompt: Prompt = {
          id: crypto.randomUUID(),
          user_id: user.id,
          title: t('prompt:untitled'),
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
          toast.error(t('errors:prompt.updateFailed'));
        }
        toast.success(t('success:prompt.created'));
      } catch (error) {
        console.error('Failed to create new prompt:', error);
        toast.error(t('errors:prompt.createFailed'));
      }
    }
  };

  const handleSave = async () => {
    if (!title || !content) {
      toast.error(t('errors:actions.enterTitleAndContent'));
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

      // User guest tidak bisa menyimpan prompt (hanya localStorage auto-save untuk session saat ini)
      if (!user) {
        toast.error(t('errors:actions.signInToSave'));
        return;
      }

      // Mengecek apakah user bisa melakukan panggilan AI (mereka perlu quota untuk menyimpan)
      const rateLimitCheck = await rateLimitingService.canMakeAICall(user);
      if (!rateLimitCheck.allowed) {
        toast.error(t('errors:usage.waitBeforeSaving'));
        return;
      }

      // Membuat atau memperbarui prompt
      const promptToSave: Prompt = {
        id: currentPrompt?.id || crypto.randomUUID(),
        user_id: user.id,
        title: title || '',
        content: content || '',
        
        // Menggunakan kolom FK baru
        model_id: model || AVAILABLE_MODELS[1].id,
        mode_id: mode || THINKING_MODES[5].id,
        
        // Menjaga field lama untuk backward compat (dual-write)
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
      
      // Menyimpan tag untuk prompt
      if (selectedTags.length > 0) {
        await TagService.savePromptTags(promptToSave.id, selectedTags, user.id);
      }
      
      try {
        onPromptChange(promptToSave);
      } catch (error) {
        console.error('Failed to update prompt:', error);
        toast.error(t('errors:prompt.updateFailed'));
      }
      toast.success(t('success:prompt.saved'));

      // Menambah counter penggunaan setelah save berhasil
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
      toast.error(error instanceof Error ? error.message : t('errors:prompt.saveFailed'));
    }
  };

  const handleCopy = async () => {
    if (!content) {
      toast.error(t('errors:actions.noContent'));
      return;
    }

    try {
      await navigator.clipboard.writeText(content);
      toast.success(t('success:prompt.contentCopied'));
    } catch (error) {
      console.error('Failed to copy content:', error);
      toast.error(t('errors:prompt.copyFailed'));
    }
  };

  const handleShare = async () => {
    if (!title || !content) {
      toast.error(t('errors:actions.enterTitleAndContent'));
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

      // User guest tidak bisa membuat prompt public atau menyimpan prompt
      if (!user) {
        toast.error(t('errors:actions.signInToShare'));
        return;
      }

      // Mengecek apakah user bisa melakukan panggilan AI (mereka perlu terautentikasi)
      const rateLimitCheck = await rateLimitingService.canMakeAICall(user);
      if (!rateLimitCheck.allowed) {
        toast.error(t('errors:usage.waitBeforeChanges'));
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
      
      // Menyimpan tag untuk prompt
      if (selectedTags.length > 0) {
        await TagService.savePromptTags(updatedPrompt.id, selectedTags, user.id);
      }
      
      try {
        onPromptChange(updatedPrompt);
      } catch (error) {
        console.error('Failed to update prompt:', error);
        toast.error(t('errors:prompt.updateFailed'));
      }
      toast.success(updatedPrompt.is_public ? t('success:prompt.nowPublic') : t('success:prompt.nowPrivate'));
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
      toast.error(t('errors:prompt.visibilityUpdateFailed'));
    }
  };

  const handleDelete = async (promptId: string) => {
    try {
      const user = await supabase.auth.getUser().then(({ data }) => data.user);

      // User guest tidak bisa menghapus prompt
      if (!user) {
        toast.error(t('errors:actions.signInToDelete'));
        return;
      }

      // Mengecek apakah user bisa melakukan panggilan AI (menghapus memerlukan quota)
      const rateLimitCheck = await rateLimitingService.canMakeAICall(user);
      if (!rateLimitCheck.allowed) {
        toast.error(t('errors:usage.waitBeforeDeleting'));
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
            title: t('prompt:untitled'),
            content: '',
            model: AVAILABLE_MODELS[1].id,
            mode: THINKING_MODES[5].id as 'meta-prompt' | 'thinking' | 'normal',
            color: '#3b82f6',
            is_public: false,
            is_featured: false,
          });
        } catch (error) {
          console.error('Failed to update prompt:', error);
          toast.error(t('errors:prompt.updateFailed'));
        }
      }
      toast.success(t('success:prompt.deleted'));

      // Menambah counter penggunaan setelah delete berhasil
      await rateLimitingService.incrementUsage(user);
    } catch (error) {
      console.error('Failed to delete prompt:', error);
      toast.error(t('errors:prompt.deleteFailed'));
    }
  };


  const handleAction = async (actionId: string) => {
    if (!content.trim()) {
      toast.error(t('errors:actions.enterContent'));
      return;
    }

    try {
      setIsActionLoading(true);
      setLoadingAction(actionId);

      // Mengecek batas penggunaan sebelum melakukan panggilan AI
      const user = await supabase.auth.getUser().then(({ data }) => data.user);
      const rateLimitCheck = await rateLimitingService.canMakeAICall(user);

      if (!rateLimitCheck.allowed) {
        const limitType = user ? t('errors:usage.dailyLimit') : t('errors:usage.guestLimit');
        toast.error(
          t('errors:usage.limitReached', { 
            type: limitType, 
            error: rateLimitCheck.error || '' 
          })
        );
        return;
      }

      // Menampilkan peringatan penggunaan tersisa ketika mendekati batas
      if (rateLimitCheck.usage.remaining <= 3) {
        if (user) {
          toast.warning(t('common:warnings.remainingDailyCalls', { count: rateLimitCheck.usage.remaining }));
        } else {
          toast.warning(t('common:warnings.remainingCallsWithSignIn', { count: rateLimitCheck.usage.remaining }));
        }
      }

      // Menghasilkan instruksi spesifik action DENGAN MODE
      const actionInstructions = generateModeAwareActionInstructions(
        actionId,
        mode,  // Meneruskan mode yang dipilih saat ini
        content
      );

      // Memanggil edge function dengan parameter mode
      const { data, error } = await supabase.functions.invoke('ai-processor', {
        body: {
          model: model,
          prompt: actionInstructions,
          mode: mode,  // Menambahkan mode ke request
          options: {
            temperature: 0.7,
            max_tokens: 8192
          }
        }
      });

      // Penanganan error yang ditingkatkan
      if (error) {
        console.error('Edge function error:', error);
        
        // Mencoba mengekstrak pesan error yang lebih bermakna
        let errorMessage = t('errors:actions.failedToProcess');
        
        if (error.message) {
          errorMessage = error.message;
        }
        
        if (error.context) {
          console.error('Error context:', error.context);
        }
        
        throw new Error(errorMessage);
      }
      
      if (!data) {
        throw new Error(t('errors:actions.noResponse'));
      }

      // Mengecek error API dalam response
      if (data.error) {
        console.error('API error response:', data);
        throw new Error(data.error);
      }
      
      const processedContent = data?.choices?.[0]?.message?.content || data?.response || '';
      if (!processedContent) {
        console.error('No content in response:', data);
        throw new Error(t('errors:actions.noContentResponse'));
      }
      
      // Lebih memilih konten refined yang diekstrak ketika tersedia
      let nextContent = processedContent;
      const refinedMatch = processedContent.match(/##\s*Hasil\s*Refined\s*([\s\S]*?)(?:\n##|$)/i);
      if (refinedMatch) {
        nextContent = refinedMatch[1].trim();
      }
      
      // Menyimpan konten original dan menampilkan hasil AI
      if (viewState === 'original') {
        setOriginalContent(content);
      }
      setAiResultContent(nextContent);
      setContent(nextContent);
      setViewState('ai-result');
      
      
      toast.success(t('success:actions.actionSuccess', { action: actionId }));

      // Menambah counter penggunaan setelah response AI berhasil
      await rateLimitingService.incrementUsage(user);

    } catch (error) {
      console.error(`Error processing ${actionId}:`, error);
      
      // Pesan error yang lebih detail
      let errorMsg = t('errors:actions.actionFailed', { action: actionId });
      if (error instanceof Error) {
        errorMsg = error.message;
        
        // Menampilkan tipe error spesifik
        if (errorMsg.includes('rate limit') || errorMsg.includes('429')) {
          errorMsg = t('errors:actions.serviceLimitReached');
        } else if (errorMsg.includes('API key') || errorMsg.includes('401')) {
          errorMsg = t('errors:actions.apiAuthFailed');
        } else if (errorMsg.includes('timeout')) {
          errorMsg = t('errors:actions.requestTimeout');
        }
      }
      
      toast.error(errorMsg);
    } finally {
      setIsActionLoading(false);
      setLoadingAction('');
    }
  };

  return (
    <div className={`flex-1 flex flex-col bg-background overflow-hidden ${isMobile ? 'h-[calc(100vh-3.5rem)]' : 'h-full'}`}>
      {/* Header Bar */}
      <div className={`border-b border-border bg-card flex-shrink-0 ${isMobile ? 'px-2 py-2' : 'px-6 py-4'}`}>
        <div className={`flex ${isMobile ? 'flex-col' : 'items-center justify-between'} ${isMobile ? 'gap-2' : 'gap-3'}`}>
          <div className={`flex items-center ${isMobile ? 'flex-wrap' : ''} ${isMobile ? 'gap-2' : 'gap-2'}`}>
            {/* Primary Save Button */}
            <Button
              onClick={handleSave}
              variant="default"
              size={isMobile ? "default" : "sm"}
              className={`bg-primary text-primary-foreground hover:bg-primary/90 font-mono touch-manipulation ${isMobile ? 'min-h-[44px] px-4' : 'px-4'}`}
              disabled={!title || !content}
              title={t('common:buttons.save')}
            >
              <Save className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} ${isMobile ? 'mr-2' : 'mr-2'}`} />
              {t('common:buttons.save')}
            </Button>

            {/* More Actions Menu */}
            <EditorActionsMenu
              onNew={handleNew}
              onCopy={handleCopy}
              onShare={handleShare}
              onDelete={() => handleDelete(currentPrompt?.id || '')}
              onToggleFocus={onToggleFocus || (() => {})}
              isFocusMode={isFocusMode}
              canDelete={!!currentPrompt?.id && !!user}
              canShare={!!title && !!content && !!user}
              promptTitle={currentPrompt?.title}
              isMobile={isMobile}
            />

            {/* Mode and Model Selectors */}
            <div className={`flex items-center ${isMobile ? 'flex-wrap w-full gap-2' : 'gap-3'}`}>
              <div className={isMobile ? 'flex-1' : ''}>
                <ModeSelector value={mode} onChange={setMode} />
              </div>
              <div className={isMobile ? 'flex-1' : ''}>
                <ModelSelector value={model} onChange={setModel} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className={`flex-1 flex flex-col overflow-hidden min-h-0 ${isMobile ? 'p-2 space-y-2' : 'p-4 space-y-4'}`}>
        {/* Title and Tags Section - Clean Layout */}
        <div className={`flex flex-shrink-0 ${isMobile ? 'flex-col gap-2' : 'items-center gap-8'}`}>
          {/* Title Section */}
          <div className="flex-1 w-full">
            <Input
              value={title}
              onChange={(e) => {
                const newValue = e.target.value;
                if (newValue.length <= 77) {
                  setTitle(newValue);
                }
              }}
              placeholder={t('common:placeholders.enterTitle')}
              className={`${isMobile ? 'text-base' : 'text-xl'} font-bold bg-transparent border-none ${isMobile ? 'px-2 py-1.5' : 'px-3 py-2'} transition-smooth focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 placeholder:text-muted-foreground/50`}
              maxLength={77}
              aria-label={t('common:placeholders.enterTitle')}
            />
          </div>

          {/* Tags Section */}
          <div className={`flex-1 ${isMobile ? 'w-full' : ''}`}>
            <TagInput selectedTagNames={selectedTags} onChange={setSelectedTags} />
          </div>
        </div>


        {/* Main Prompt Content */}
        <div className={`flex flex-col flex-1 min-h-0 ${isMobile ? 'space-y-2' : 'space-y-3'}`}>
          <div className={`flex items-center ${isMobile ? 'flex-wrap' : ''} gap-2`}>
            <AIActionsDropdown
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
                size={isMobile ? "default" : "sm"}
                className={`${isMobile ? 'text-sm min-h-[44px]' : 'text-xs h-8'} px-3 hover:bg-secondary/20 transition-all font-mono touch-manipulation`}
                title={t('prompt:backToOriginalTitle')}
              >
                <ArrowLeft className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} ${isMobile ? '' : 'mr-1'}`} />
                {isMobile ? '' : t('common:buttons.back')}
              </Button>
            )}

            {viewState === 'original' && aiResultContent && (
              <Button
                onClick={handleForward}
                variant="outline"
                size={isMobile ? "default" : "sm"}
                className={`${isMobile ? 'text-sm min-h-[44px]' : 'text-xs h-8'} px-3 hover:bg-secondary/20 transition-all font-mono touch-manipulation`}
                title={t('prompt:forwardToResultTitle')}
              >
                <ArrowRight className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} ${isMobile ? '' : 'mr-1'}`} />
                {isMobile ? '' : t('common:buttons.forward')}
              </Button>
            )}

            {/* AI Result indicator */}
            {viewState === 'ai-result' && (
              <div className="flex items-center gap-1 text-primary ml-auto">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs font-mono">{t('common:status.aiGenerated')}</span>
              </div>
            )}

            {/* Original prompt indicator */}
            {viewState === 'original' && originalContent && (
              <div className="flex items-center gap-1 text-muted-foreground ml-auto">
                <FileText className="w-4 h-4" />
                <span className="text-xs font-mono">{t('common:status.original')}</span>
              </div>
            )}

            {/* Character limit warning */}
            {content.length > 45000 && (
              <div className="flex items-center gap-1 text-red-400 ml-auto">
                <span className="text-xs font-mono">⚠️ {t('common:status.characterLimitNear')}</span>
              </div>
            )}

            {/* Rate limit warning */}
            {!userCanUseAI && (
              <div className="flex items-center gap-1 text-red-400 ml-auto">
                <span className="text-xs font-mono">⚠️ {t('common:status.usageLimit')}</span>
              </div>
            )}
          </div>

          <Textarea
            value={content}
            onChange={(e) => {
              const newContent = e.target.value;
              setContent(newContent);

              // Memperbarui state yang sesuai berdasarkan view saat ini
              if (viewState === 'original') {
                setOriginalContent(newContent);
              } else if (viewState === 'ai-result') {
                setAiResultContent(newContent);
              }
            }}
            placeholder={t('common:placeholders.startWriting')}
            className={`flex-1 min-h-0 bg-card border-border font-mono resize-none leading-relaxed prompt-editor-textarea transition-smooth focus:ring-2 focus:ring-ring focus:ring-offset-2 ${isMobile ? 'text-base' : 'text-sm'}`}
            maxLength={50000}
            aria-label={t('common:placeholders.startWriting')}
          />
        </div>

      </div>

      {/* Footer Status - Simplified */}
      <div className={`border-t border-border bg-card flex-shrink-0 ${isMobile ? 'px-2 py-2' : 'px-4 py-2'}`}>
        <div className="flex items-center justify-between">
          {/* Character count with progress indicator */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs font-mono">
              <span className={content.length > 45000 ? "text-red-400" : content.length > 40000 ? "text-yellow-400" : "text-muted-foreground"}>
                {content.length.toLocaleString()}/50,000
              </span>
            </div>
            {/* Progress bar for character limit */}
            {content.length > 40000 && (
              <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    content.length > 45000 ? 'bg-red-400' : 'bg-yellow-400'
                  }`}
                  style={{ width: `${Math.min((content.length / 50000) * 100, 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Public/Private status */}
          {currentPrompt && (
            <div className="flex items-center gap-1">
              {currentPrompt.is_public ? (
                <Globe className="w-4 h-4 text-primary" title={t('common:labels.public')} />
              ) : (
                <Lock className="w-4 h-4 text-muted-foreground" title={t('common:labels.private')} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromptEditor;
