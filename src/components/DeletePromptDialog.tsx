import React from 'react';
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
import { useIsMobile } from '@/hooks/use-mobile';

interface DeletePromptDialogProps {
  promptTitle: string;
  onConfirm: () => void;
  children?: React.ReactNode;
}

const DeletePromptDialog = ({ promptTitle, onConfirm, children }: DeletePromptDialogProps) => {
  const isMobile = useIsMobile();
  
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent className={isMobile ? 'max-w-[calc(100vw-2rem)] mx-4' : ''}>
        <AlertDialogHeader>
          <AlertDialogTitle className={isMobile ? 'text-lg' : ''}>Delete Prompt</AlertDialogTitle>
          <AlertDialogDescription className={isMobile ? 'text-sm' : ''}>
            Are you sure you want to delete "{promptTitle}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className={isMobile ? 'gap-2' : ''}>
          <AlertDialogCancel className={isMobile ? 'min-h-[44px] touch-manipulation' : ''}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm} 
            className={`bg-destructive text-destructive-foreground hover:bg-destructive/90 ${isMobile ? 'min-h-[44px] touch-manipulation' : ''}`}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeletePromptDialog;
