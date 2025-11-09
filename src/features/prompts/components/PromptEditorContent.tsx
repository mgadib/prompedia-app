import React from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import TagInput from '@/features/tags/components/TagInput';
import { PromptEditorToolbar } from './PromptEditorToolbar';
import { useIsMobile } from '@/shared/hooks/use-mobile';

type ViewState = 'original' | 'ai-result';

interface PromptEditorContentProps {
  title: string;
  content: string;
  selectedTags: string[];
  viewState: ViewState;
  originalContent: string;
  aiResultContent: string;
  userCanUseAI: boolean;
  isActionLoading: boolean;
  loadingAction: string;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string, viewState: ViewState) => void;
  onTagsChange: (tags: string[]) => void;
  onAction: (actionId: string) => void;
  onBack: () => void;
  onForward: () => void;
}

export const PromptEditorContent = React.memo(({
  title,
  content,
  selectedTags,
  viewState,
  originalContent,
  aiResultContent,
  userCanUseAI,
  isActionLoading,
  loadingAction,
  onTitleChange,
  onContentChange,
  onTagsChange,
  onAction,
  onBack,
  onForward,
}: PromptEditorContentProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  return (
    <div className={`flex-1 flex flex-col overflow-hidden min-h-0 ${isMobile ? 'p-2 space-y-2' : 'p-4 space-y-4'}`}>
      {/* Title and Tags Section */}
      <div className={`flex flex-shrink-0 ${isMobile ? 'flex-col gap-2' : 'items-center gap-8'}`}>
        {/* Title Section */}
        <div className="flex-1 w-full">
          <Input
            value={title}
            onChange={(e) => {
              const newValue = e.target.value;
              if (newValue.length <= 77) {
                onTitleChange(newValue);
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
          <TagInput selectedTagNames={selectedTags} onChange={onTagsChange} />
        </div>
      </div>

      {/* Main Prompt Content */}
      <div className={`flex flex-col flex-1 min-h-0 ${isMobile ? 'space-y-2' : 'space-y-3'}`}>
        <PromptEditorToolbar
          content={content}
          viewState={viewState}
          originalContent={originalContent}
          aiResultContent={aiResultContent}
          userCanUseAI={userCanUseAI}
          isActionLoading={isActionLoading}
          loadingAction={loadingAction}
          onAction={onAction}
          onBack={onBack}
          onForward={onForward}
        />

        <Textarea
          value={content}
          onChange={(e) => {
            const newContent = e.target.value;
            onContentChange(newContent, viewState);
          }}
          placeholder={t('common:placeholders.startWriting')}
          className={`flex-1 min-h-0 bg-card border-border font-mono resize-none leading-relaxed prompt-editor-textarea transition-smooth focus:ring-2 focus:ring-ring focus:ring-offset-2 ${isMobile ? 'text-base' : 'text-sm'}`}
          maxLength={50000}
          aria-label={t('common:placeholders.startWriting')}
        />
      </div>
    </div>
  );
});

PromptEditorContent.displayName = 'PromptEditorContent';

