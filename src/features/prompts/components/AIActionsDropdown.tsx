import { useTranslation } from 'react-i18next';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getTranslatedActions } from '@/lib/i18n-actions-modes';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { useTranslationReady } from '@/shared/hooks/useTranslationReady';

interface AIActionsDropdownProps {
  onAction: (actionId: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  loadingAction?: string;
}

const AIActionsDropdown = ({ onAction, disabled = false, isLoading = false, loadingAction }: AIActionsDropdownProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { isReady } = useTranslationReady({ namespaces: ['actions'] });
  const translatedActions = isReady ? getTranslatedActions() : [];
  
  // Group actions
  const improveActions = translatedActions.filter(a => a.id === 'refine' || a.id === 'expand');
  const transformActions = translatedActions.filter(a => a.id === 'reimagine' || a.id === 'reformat');
  const analyzeActions = translatedActions.filter(a => a.id === 'self-review');

  const actionKey = (actionId: string) => actionId === 'self-review' ? 'selfReview' : actionId;
  const isCurrentlyLoading = isLoading && !!loadingAction;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={isMobile ? "default" : "sm"}
          className={`${isMobile ? 'text-sm min-h-[44px] px-4' : 'text-xs h-8 px-3'} hover:bg-primary/5 hover:border-primary/20 touch-manipulation font-mono relative overflow-hidden ${
            isCurrentlyLoading ? 'opacity-75 cursor-wait' : ''
          }`}
          disabled={disabled || isLoading}
          title={t('common:buttons.aiActions')}
          aria-label={t('common:buttons.aiActions')}
        >
          {isCurrentlyLoading ? (
            <>
              <Loader2 className={`${isMobile ? 'mr-2 h-5 w-5' : 'mr-1.5 h-4 w-4'} animate-spin`} />
              <span className="sr-only">{t('common:status.processing')}</span>
            </>
          ) : (
            <Sparkles className={`${isMobile ? 'mr-2 h-5 w-5' : 'mr-1.5 h-4 w-4'}`} />
          )}
          <span className={isCurrentlyLoading ? 'opacity-0 absolute' : ''}>
            {t('common:buttons.aiActions')}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 font-mono">
        {/* Improve Group */}
        {improveActions.length > 0 && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {t('common:labels.improve')}
            </DropdownMenuLabel>
            {improveActions.map((action) => {
              const key = actionKey(action.id);
              const isActionLoading = isLoading && loadingAction === action.id;
              return (
                <DropdownMenuItem
                  key={action.id}
                  onClick={() => onAction(action.id)}
                  disabled={disabled || isLoading}
                  className="cursor-pointer"
                >
                  <span className={`mr-2 ${isMobile ? 'text-base' : ''}`}>{action.icon}</span>
                  <span>{t(`actions:${key}.label`)}</span>
                  {isActionLoading && (
                    <Loader2 className="ml-auto h-4 w-4 animate-spin" />
                  )}
                </DropdownMenuItem>
              );
            })}
          </>
        )}

        {/* Transform Group */}
        {transformActions.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {t('common:labels.transform')}
            </DropdownMenuLabel>
            {transformActions.map((action) => {
              const key = actionKey(action.id);
              const isActionLoading = isLoading && loadingAction === action.id;
              return (
                <DropdownMenuItem
                  key={action.id}
                  onClick={() => onAction(action.id)}
                  disabled={disabled || isLoading}
                  className="cursor-pointer"
                >
                  <span className={`mr-2 ${isMobile ? 'text-base' : ''}`}>{action.icon}</span>
                  <span>{t(`actions:${key}.label`)}</span>
                  {isActionLoading && (
                    <Loader2 className="ml-auto h-4 w-4 animate-spin" />
                  )}
                </DropdownMenuItem>
              );
            })}
          </>
        )}

        {/* Analyze Group */}
        {analyzeActions.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {t('common:labels.analyze')}
            </DropdownMenuLabel>
            {analyzeActions.map((action) => {
              const key = actionKey(action.id);
              const isActionLoading = isLoading && loadingAction === action.id;
              return (
                <DropdownMenuItem
                  key={action.id}
                  onClick={() => onAction(action.id)}
                  disabled={disabled || isLoading}
                  className="cursor-pointer"
                >
                  <span className={`mr-2 ${isMobile ? 'text-base' : ''}`}>{action.icon}</span>
                  <span>{t(`actions:${key}.label`)}</span>
                  {isActionLoading && (
                    <Loader2 className="ml-auto h-4 w-4 animate-spin" />
                  )}
                </DropdownMenuItem>
              );
            })}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AIActionsDropdown;

