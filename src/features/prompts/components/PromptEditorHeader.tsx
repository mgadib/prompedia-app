import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, FileText, Copy, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import type { User } from '@supabase/supabase-js';
import ModelSelector from './ModelSelector';
import ModeSelector from './ModeSelector';

interface PromptEditorHeaderProps {
  title: string;
  content: string;
  user: User | null;
  model: string;
  mode: string;
  onSave: () => void;
  onNew: () => void;
  onCopy: () => void;
  onShare: () => void;
  onModelChange: (model: string) => void;
  onModeChange: (mode: string) => void;
}

export const PromptEditorHeader = React.memo(({
  title,
  content,
  user,
  model,
  mode,
  onSave,
  onNew,
  onCopy,
  onShare,
  onModelChange,
  onModeChange,
}: PromptEditorHeaderProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const canShare = !!title && !!content && !!user;
  const [activeButton, setActiveButton] = useState<'save' | 'new' | 'copy' | null>(null);

  const handleSaveClick = () => {
    setActiveButton('save');
    onSave();
    setTimeout(() => setActiveButton(null), 500);
  };

  const handleNewClick = () => {
    setActiveButton('new');
    onNew();
    setTimeout(() => setActiveButton(null), 500);
  };

  const handleCopyClick = () => {
    setActiveButton('copy');
    onCopy();
    setTimeout(() => setActiveButton(null), 500);
  };

  const getButtonClassName = (buttonType: 'save' | 'new' | 'copy') => {
    const isActive = activeButton === buttonType;
    const baseClasses = `font-mono touch-manipulation ${isMobile ? 'min-h-[44px] px-4' : 'px-4'}`;
    
    if (isActive) {
      return `${baseClasses} bg-primary text-primary-foreground hover:bg-primary/90`;
    }
    return `${baseClasses} border border-border bg-background hover:bg-accent hover:text-accent-foreground`;
  };

  return (
    <div className={`border-b border-border bg-card flex-shrink-0 ${isMobile ? 'px-2 py-2' : 'px-6 py-4'}`}>
      <div className={`flex ${isMobile ? 'flex-col' : 'items-center justify-between'} ${isMobile ? 'gap-2' : 'gap-3'}`}>
        {/* Left side: Action Buttons */}
        <div className={`flex ${isMobile ? 'flex-col' : 'items-center'} ${isMobile ? 'gap-2' : 'gap-3'}`}>
          {/* Primary Save Button */}
          <Button
            onClick={handleSaveClick}
            variant={activeButton === 'save' ? 'default' : 'outline'}
            size={isMobile ? "default" : "sm"}
            className={getButtonClassName('save')}
            disabled={!title || !content}
            title={t('common:buttons.save')}
          >
            <Save className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} ${isMobile ? 'mr-2' : 'mr-2'}`} />
            {t('common:buttons.save')}
          </Button>

          {/* New Button */}
          <Button
            onClick={handleNewClick}
            variant={activeButton === 'new' ? 'default' : 'outline'}
            size={isMobile ? "default" : "sm"}
            className={getButtonClassName('new')}
            title={t('common:buttons.new')}
            aria-label={t('common:buttons.new')}
          >
            <FileText className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} ${isMobile ? 'mr-2' : 'mr-2'}`} />
            {t('common:buttons.new')}
          </Button>

          {/* Copy Button */}
          <Button
            onClick={handleCopyClick}
            variant={activeButton === 'copy' ? 'default' : 'outline'}
            size={isMobile ? "default" : "sm"}
            className={getButtonClassName('copy')}
            title={t('common:buttons.copy')}
            aria-label={t('common:buttons.copy')}
          >
            <Copy className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} ${isMobile ? 'mr-2' : 'mr-2'}`} />
            {t('common:buttons.copy')}
          </Button>

          {/* Share Button */}
          {canShare && (
            <Button
              onClick={onShare}
              variant="outline"
              size={isMobile ? "default" : "sm"}
              className={`hover:bg-accent/20 hover:text-accent font-mono touch-manipulation ${isMobile ? 'min-h-[44px] px-4' : 'px-4'}`}
              title={t('common:buttons.share')}
              aria-label={t('common:buttons.share')}
            >
              <Share2 className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} ${isMobile ? 'mr-2' : 'mr-2'}`} />
              {t('common:buttons.share')}
            </Button>
          )}
        </div>

        {/* Right side: Model and Mode Selectors */}
        <div className={`flex ${isMobile ? 'flex-col w-full' : 'items-center'} ${isMobile ? 'gap-2' : 'gap-2'}`}>
          <ModeSelector value={mode} onChange={onModeChange} />
          <ModelSelector value={model} onChange={onModelChange} />
        </div>
      </div>
    </div>
  );
});

PromptEditorHeader.displayName = 'PromptEditorHeader';

