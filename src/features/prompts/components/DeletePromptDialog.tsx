import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useIsMobile } from '@/shared/hooks/use-mobile';

interface DeletePromptDialogProps {
  promptTitle: string;
  onConfirm: () => void;
  children?: React.ReactNode;
  trigger?: React.ReactNode;
  isCollapsed?: boolean;
}

const DeletePromptDialog = ({ promptTitle, onConfirm, children, trigger }: DeletePromptDialogProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger || children}
      </AlertDialogTrigger>
      <AlertDialogContent className={isMobile ? 'max-w-[calc(100vw-2rem)] mx-4' : ''}>
        <AlertDialogHeader>
          <AlertDialogTitle className={isMobile ? 'text-lg' : ''}>{t('library:deletePrompt')}</AlertDialogTitle>
          <AlertDialogDescription className={isMobile ? 'text-sm' : ''}>
            {t('library:deleteConfirm', { title: promptTitle })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className={isMobile ? 'gap-2' : ''}>
          <AlertDialogCancel className={isMobile ? 'min-h-[44px] touch-manipulation' : ''}>{t('common:buttons.cancel')}</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm} 
            className={`bg-destructive text-destructive-foreground hover:bg-destructive/90 ${isMobile ? 'min-h-[44px] touch-manipulation' : ''}`}
          >
            {t('common:buttons.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeletePromptDialog;
