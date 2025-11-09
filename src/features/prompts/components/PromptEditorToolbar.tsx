import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, CheckCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ActionButtons from './ActionButtons';
import { useIsMobile } from '@/shared/hooks/use-mobile';

type ViewState = 'original' | 'ai-result';

interface PromptEditorToolbarProps {
  content: string;
  viewState: ViewState;
  originalContent: string;
  aiResultContent: string;
  userCanUseAI: boolean;
  isActionLoading: boolean;
  loadingAction: string;
  onAction: (actionId: string) => void;
  onBack: () => void;
  onForward: () => void;
}

export const PromptEditorToolbar = React.memo(({
  content,
  viewState,
  originalContent,
  aiResultContent,
  userCanUseAI,
  isActionLoading,
  loadingAction,
  onAction,
  onBack,
  onForward,
}: PromptEditorToolbarProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  return (
    <div className={`flex items-center ${isMobile ? 'flex-wrap' : ''} gap-2`}>
      <ActionButtons
        onAction={onAction}
        disabled={!content.trim() || viewState === 'ai-result' || !userCanUseAI}
        isLoading={isActionLoading}
        loadingAction={loadingAction}
      />

      {/* Navigation buttons */}
      {viewState === 'ai-result' && (
        <Button
          onClick={onBack}
          variant="outline"
          size={isMobile ? "default" : "sm"}
          className={`${isMobile ? 'text-sm min-h-[44px] px-4' : 'text-xs h-8 px-4'} hover:bg-secondary/20 transition-all font-mono touch-manipulation`}
          title={t('prompt:backToOriginalTitle')}
        >
          <ArrowLeft className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} ${isMobile ? 'mr-2' : 'mr-2'}`} />
          {isMobile ? '' : t('common:buttons.back')}
        </Button>
      )}

      {viewState === 'original' && aiResultContent && (
        <Button
          onClick={onForward}
          variant="outline"
          size={isMobile ? "default" : "sm"}
          className={`${isMobile ? 'text-sm min-h-[44px] px-4' : 'text-xs h-8 px-4'} hover:bg-secondary/20 transition-all font-mono touch-manipulation`}
          title={t('prompt:forwardToResultTitle')}
        >
          <ArrowRight className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} ${isMobile ? 'mr-2' : 'mr-2'}`} />
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
  );
});

PromptEditorToolbar.displayName = 'PromptEditorToolbar';

