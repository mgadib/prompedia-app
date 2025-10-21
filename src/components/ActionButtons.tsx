import { Button } from '@/components/ui/button';
import { PROMPT_ACTIONS } from '@/lib/actions';

interface ActionButtonsProps {
  onAction: (actionId: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  loadingAction?: string;
}

const ActionButtons = ({ onAction, disabled = false, isLoading = false, loadingAction }: ActionButtonsProps) => {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {PROMPT_ACTIONS.map((action) => {
        const isCurrentlyLoading = isLoading && loadingAction === action.id;
        
        return (
          <Button
            key={action.id}
            onClick={() => onAction(action.id)}
            variant="outline"
            size="sm"
            className="text-xs h-8 px-3 hover:bg-primary/5 hover:border-primary/20 transition-all"
            disabled={disabled || isLoading}
            title={action.description}
          >
            <span className="mr-1.5">{action.icon}</span>
            <span className={isCurrentlyLoading ? 'animate-pulse' : ''}>
              {action.label}
            </span>
          </Button>
        );
      })}
    </div>
  );
};

export default ActionButtons;
