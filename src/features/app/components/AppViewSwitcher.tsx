import React from 'react';
import type { PromptWithTags } from '@/shared/types/prompts';
import type { Prompt } from '@/lib/storage';
import type { User } from '@supabase/supabase-js';

// Lazy load components
const PromptEditor = React.lazy(() => import('@/features/prompts/components/PromptEditor'));
const MyLibrary = React.lazy(() => import('@/features/library/components/MyLibrary'));
const PublicLibrary = React.lazy(() => import('@/features/library/components/PublicLibrary'));

interface AppViewSwitcherProps {
  showEditor: boolean;
  activeView: 'my-library' | 'public-library';
  currentPrompt: Prompt | null;
  myPromptsWithTags: PromptWithTags[];
  publicPromptsWithTags: PromptWithTags[];
  isTransitioning: boolean;
  user: User | null;
  onSelectPrompt: (prompt: PromptWithTags) => void;
  onEditPrompt: (prompt: PromptWithTags) => void;
  onDeletePrompt: (promptId: string) => void;
  onCopyPrompt: (prompt: PromptWithTags) => void;
  onUsePrompt: (prompt: PromptWithTags) => void;
  onPromptChange: (prompt: Prompt) => void;
  onDeletePromptFromEditor?: (promptId: string) => void;
  onNewPrompt: () => void;
  isFocusMode: boolean;
  onToggleFocus: () => void;
}

/**
 * Component for switching between editor and library views
 * Extracted from AppPage for better separation of concerns
 */
const AppViewSwitcher: React.FC<AppViewSwitcherProps> = ({
  showEditor,
  activeView,
  currentPrompt,
  myPromptsWithTags,
  publicPromptsWithTags,
  isTransitioning,
  user,
  onSelectPrompt,
  onEditPrompt,
  onDeletePrompt,
  onCopyPrompt,
  onUsePrompt,
  onPromptChange,
  onDeletePromptFromEditor,
  onNewPrompt,
  isFocusMode,
  onToggleFocus,
}) => {
  return (
    <React.Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      {showEditor ? (
        <div className={`flex-1 flex flex-col min-w-0 overflow-hidden ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
          <PromptEditor
            key="prompt-editor"
            currentPrompt={currentPrompt}
            onPromptChange={onPromptChange}
            onDeletePrompt={onDeletePromptFromEditor}
            onNewPrompt={onNewPrompt}
            isFocusMode={isFocusMode}
            onToggleFocus={onToggleFocus}
            user={user}
          />
        </div>
      ) : (
        <div className={`flex-1 flex flex-col min-w-0 overflow-hidden ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
          {activeView === 'my-library' ? (
            <MyLibrary
              key="my-library"
              prompts={myPromptsWithTags}
              onSelectPrompt={onSelectPrompt}
              onEditPrompt={onEditPrompt}
              onDeletePrompt={onDeletePrompt}
              onCopyPrompt={onCopyPrompt}
              currentPromptId={currentPrompt?.id}
            />
          ) : (
            <PublicLibrary
              key="public-library"
              prompts={publicPromptsWithTags}
              onSelectPrompt={onSelectPrompt}
              onUsePrompt={onUsePrompt}
              currentPromptId={currentPrompt?.id}
            />
          )}
        </div>
      )}
    </React.Suspense>
  );
};

export default React.memo(AppViewSwitcher);

