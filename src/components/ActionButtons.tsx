import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { getTranslatedActions } from '@/lib/i18n-actions-modes';
import { useIsMobile } from '@/hooks/use-mobile';

interface ActionButtonsProps {
  onAction: (actionId: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  loadingAction?: string;
}

const ActionButtons = ({ onAction, disabled = false, isLoading = false, loadingAction }: ActionButtonsProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const translatedActions = getTranslatedActions();
  
  return (
    <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-2'} flex-wrap`}>
      {translatedActions.map((action) => {
        const isCurrentlyLoading = isLoading && loadingAction === action.id;
        const actionKey = action.id === 'self-review' ? 'selfReview' : action.id;
        
        return (
          <Button
            key={action.id}
            onClick={() => onAction(action.id)}
            variant="outline"
            size={isMobile ? "default" : "sm"}
            className={`${isMobile ? 'text-sm min-h-[44px] px-4' : 'text-xs h-8 px-3'} hover:bg-primary/5 hover:border-primary/20 transition-all touch-manipulation font-mono`}
            disabled={disabled || isLoading}
            title={t(`actions:${actionKey}.description`, { defaultValue: action.description })}
          >
            <span className={isMobile ? 'mr-2 text-base' : 'mr-1.5'}>{action.icon}</span>
            <span className={isCurrentlyLoading ? 'animate-pulse' : ''}>
              {t(`actions:${actionKey}.label`, { defaultValue: action.label })}
            </span>
          </Button>
        );
      })}
    </div>
  );
};

export default ActionButtons;
