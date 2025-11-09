import React from 'react';
import { useTranslation } from 'react-i18next';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ModelSelector from './ModelSelector';
import ModeSelector from './ModeSelector';
import EditorActionsMenu from './EditorActionsMenu';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import type { User } from '@supabase/supabase-js';

interface PromptEditorHeaderProps {
  title: string;
  content: string;
  model: string;
  mode: string;
  currentPromptId?: string;
  isFocusMode: boolean;
  user: User | null;
  onSave: () => void;
  onNew: () => void;
  onCopy: () => void;
  onShare: () => void;
  onDelete: () => void;
  onToggleFocus: () => void;
  onModelChange: (model: string) => void;
  onModeChange: (mode: string) => void;
}

export const PromptEditorHeader = React.memo(({
  title,
  content,
  model,
  mode,
  currentPromptId,
  isFocusMode,
  user,
  onSave,
  onNew,
  onCopy,
  onShare,
  onDelete,
  onToggleFocus,
  onModelChange,
  onModeChange,
}: PromptEditorHeaderProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  return (
    <div className={`border-b border-border bg-card flex-shrink-0 ${isMobile ? 'px-2 py-2' : 'px-6 py-4'}`}>
      <div className={`flex ${isMobile ? 'flex-col' : 'items-center justify-between'} ${isMobile ? 'gap-2' : 'gap-3'}`}>
        <div className={`flex items-center ${isMobile ? 'flex-wrap' : ''} ${isMobile ? 'gap-2' : 'gap-2'}`}>
          {/* Primary Save Button */}
          <Button
            onClick={onSave}
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
            onNew={onNew}
            onCopy={onCopy}
            onShare={onShare}
            onDelete={onDelete}
            onToggleFocus={onToggleFocus}
            isFocusMode={isFocusMode}
            canDelete={!!currentPromptId && !!user}
            canShare={!!title && !!content && !!user}
            promptTitle={title}
            isMobile={isMobile}
          />

          {/* Mode and Model Selectors */}
          <div className={`flex items-center ${isMobile ? 'flex-wrap w-full gap-2' : 'gap-3'}`}>
            <div className={isMobile ? 'flex-1' : ''}>
              <ModeSelector value={mode} onChange={onModeChange} />
            </div>
            <div className={isMobile ? 'flex-1' : ''}>
              <ModelSelector value={model} onChange={onModelChange} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

PromptEditorHeader.displayName = 'PromptEditorHeader';

