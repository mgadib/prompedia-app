import React from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, Globe } from 'lucide-react';
import { Prompt } from '@/lib/storage';
import { useIsMobile } from '@/shared/hooks/use-mobile';

interface PromptEditorFooterProps {
  content: string;
  currentPrompt: Prompt | null;
}

export const PromptEditorFooter = React.memo(({
  content,
  currentPrompt,
}: PromptEditorFooterProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  return (
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
  );
});

PromptEditorFooter.displayName = 'PromptEditorFooter';

