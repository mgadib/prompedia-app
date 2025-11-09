import React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from '@/shared/utils/toast';
import { Prompt } from '@/lib/storage';
import { storageManager } from '@/lib/storage-manager';
import { AVAILABLE_MODELS } from '@/features/prompts/utils/models';
import { THINKING_MODES } from '@/features/prompts/utils/modes';
import { supabase } from '@/integrations/supabase/client';
import { rateLimitingService } from '@/shared/utils/rate-limiting';
import { TagService } from '@/features/tags/services/tag-service';
import { PromptEditorHeader } from './PromptEditorHeader';
import { PromptEditorContent } from './PromptEditorContent';
import { PromptEditorFooter } from './PromptEditorFooter';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { usePromptEditor } from '../hooks/usePromptEditor';
import { useAIActions } from '../hooks/useAIActions';
import { usePromptTags } from '../hooks/usePromptTags';
import type { User } from '@supabase/supabase-js';

interface PromptEditorProps {
  currentPrompt: Prompt | null;
  onPromptChange: (prompt: Prompt) => void;
  onDeletePrompt?: (promptId: string) => void;
  onNewPrompt?: () => void;
  isFocusMode?: boolean;
  onToggleFocus?: () => void;
  user?: User | null;
}

const PromptEditor = ({ currentPrompt, onPromptChange, onDeletePrompt, onNewPrompt, isFocusMode: _isFocusMode = false, onToggleFocus: _onToggleFocus, user }: PromptEditorProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  // Use extracted hooks
  const editorState = usePromptEditor(currentPrompt);
  const { 
    title, 
    content, 
    originalContent, 
    aiResultContent, 
    viewState, 
    model, 
    mode, 
    setTitle, 
    setContent, 
    setModel, 
    setMode,
    setOriginalContent,
    setAiResultContent,
    setViewState,
    handleContentChange, 
    handleBack, 
    handleForward 
  } = editorState;

  const { selectedTags, setSelectedTags } = usePromptTags(currentPrompt?.id);

  const aiActions = useAIActions({
    content,
    mode,
    model,
    viewState,
    setContent,
    setOriginalContent,
    setAiResultContent,
    setViewState,
  });
  const { isActionLoading, loadingAction, userCanUseAI, handleAction } = aiActions;



  const handleNew = async () => {
    if (onNewPrompt) {
      // Menggunakan handler prompt baru dari parent
      onNewPrompt();
    } else {
      // Fallback ke implementasi lokal
      try {
        const user = await supabase.auth.getUser().then(({ data }) => data.user);
        
      if (!user) {
        toast.error('actions.signInToCreate');
        return;
      }

        const newPrompt: Prompt = {
          id: crypto.randomUUID(),
          user_id: user.id,
          title: t('prompt:untitled'),
          content: '',
          model: AVAILABLE_MODELS[1]?.id ?? AVAILABLE_MODELS[0]?.id ?? '',
          mode: (THINKING_MODES[5]?.id ?? THINKING_MODES[0]?.id ?? 'normal') as 'meta-prompt' | 'thinking' | 'normal',
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
          toast.error('prompt.updateFailed');
        }
        toast.success('prompt.created');
      } catch (error) {
        console.error('Failed to create new prompt:', error);
        toast.error('prompt.createFailed');
      }
    }
  };

  const handleSave = async () => {
    if (!title || !content) {
      toast.error('actions.enterTitleAndContent');
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
        toast.error('actions.signInToSave');
        return;
      }

      // Mengecek apakah user bisa melakukan panggilan AI (mereka perlu quota untuk menyimpan)
      const rateLimitCheck = await rateLimitingService.canMakeAICall(user);
      if (!rateLimitCheck.allowed) {
        toast.error('usage.waitBeforeSaving');
        return;
      }

      // Membuat atau memperbarui prompt
      const promptToSave: Prompt = {
        id: currentPrompt?.id || crypto.randomUUID(),
        user_id: user.id,
        title: title || '',
        content: content || '',
        
        // Menggunakan kolom FK baru
        model_id: model || (AVAILABLE_MODELS[1]?.id ?? AVAILABLE_MODELS[0]?.id ?? ''),
        mode_id: mode || (THINKING_MODES[5]?.id ?? THINKING_MODES[0]?.id ?? 'normal'),
        
        // Menjaga field lama untuk backward compat (dual-write)
        model: model || (AVAILABLE_MODELS[1]?.id ?? AVAILABLE_MODELS[0]?.id ?? ''),
        mode: (mode || THINKING_MODES[5]?.id || THINKING_MODES[0]?.id || 'normal') as 'meta-prompt' | 'thinking' | 'normal',
        
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
        toast.error('prompt.updateFailed');
      }
      toast.success('prompt.saved');

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
      toast.error(error instanceof Error ? error.message : 'prompt.saveFailed');
    }
  };

  const handleCopy = async () => {
    if (!content) {
      toast.error('actions.noContent');
      return;
    }

    try {
      await navigator.clipboard.writeText(content);
      toast.success('prompt.contentCopied');
    } catch (error) {
      console.error('Failed to copy content:', error);
      toast.error('prompt.copyFailed');
    }
  };

  const handleShare = async () => {
    if (!title || !content) {
      toast.error('actions.enterTitleAndContent');
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
        toast.error('actions.signInToShare');
        return;
      }

      // Mengecek apakah user bisa melakukan panggilan AI (mereka perlu terautentikasi)
      const rateLimitCheck = await rateLimitingService.canMakeAICall(user);
      if (!rateLimitCheck.allowed) {
        toast.error('usage.waitBeforeChanges');
        return;
      }

      const updatedPrompt: Prompt = {
        id: currentPrompt?.id || crypto.randomUUID(),
        user_id: user.id,
        title: title || '',
        content: content || '',
        model: model || (AVAILABLE_MODELS[1]?.id ?? AVAILABLE_MODELS[0]?.id ?? ''),
        mode: (mode || THINKING_MODES[5]?.id || THINKING_MODES[0]?.id || 'normal') as 'meta-prompt' | 'thinking' | 'normal',
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
        toast.error('prompt.updateFailed');
      }
      toast.success(updatedPrompt.is_public ? 'prompt.nowPublic' : 'prompt.nowPrivate');
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
      toast.error('prompt.visibilityUpdateFailed');
    }
  };

  const __handleDelete = async (promptId: string) => {
    try {
      const user = await supabase.auth.getUser().then(({ data }) => data.user);

      // User guest tidak bisa menghapus prompt
      if (!user) {
        toast.error('actions.signInToDelete');
        return;
      }

      // Mengecek apakah user bisa melakukan panggilan AI (menghapus memerlukan quota)
      const rateLimitCheck = await rateLimitingService.canMakeAICall(user);
      if (!rateLimitCheck.allowed) {
        toast.error('usage.waitBeforeDeleting');
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
            model: AVAILABLE_MODELS[1]?.id ?? AVAILABLE_MODELS[0]?.id ?? '',
            mode: (THINKING_MODES[5]?.id ?? THINKING_MODES[0]?.id ?? 'normal') as 'meta-prompt' | 'thinking' | 'normal',
            color: '#3b82f6',
            is_public: false,
            is_featured: false,
          });
        } catch (error) {
          console.error('Failed to update prompt:', error);
          toast.error('prompt.updateFailed');
        }
      }
      toast.success('prompt.deleted');

      // Menambah counter penggunaan setelah delete berhasil
      await rateLimitingService.incrementUsage(user);
    } catch (error) {
      console.error('Failed to delete prompt:', error);
      toast.error('prompt.deleteFailed');
    }
  };


  return (
    <div className={`flex-1 flex flex-col bg-background overflow-hidden ${isMobile ? 'h-[calc(100vh-3.5rem)]' : 'h-full'}`}>
      <PromptEditorHeader
        title={title}
        content={content}
        user={user || null}
        model={model}
        mode={mode}
        onSave={handleSave}
        onNew={handleNew}
        onCopy={handleCopy}
        onShare={handleShare}
        onModelChange={setModel}
        onModeChange={setMode}
      />

      <PromptEditorContent
        title={title}
        content={content}
        selectedTags={selectedTags}
        viewState={viewState}
        originalContent={originalContent}
        aiResultContent={aiResultContent}
        userCanUseAI={userCanUseAI}
        isActionLoading={isActionLoading}
        loadingAction={loadingAction}
        onTitleChange={setTitle}
        onContentChange={handleContentChange}
        onTagsChange={setSelectedTags}
        onAction={handleAction}
        onBack={handleBack}
        onForward={handleForward}
      />

      <PromptEditorFooter
        content={content}
        currentPrompt={currentPrompt}
      />
    </div>
  );
};

export default React.memo(PromptEditor);
