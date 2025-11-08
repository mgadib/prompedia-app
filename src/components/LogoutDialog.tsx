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
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface LogoutDialogProps {
  userName?: string;
  onConfirm: () => void;
  isCollapsed?: boolean;
}

const LogoutDialog = ({ userName, onConfirm, isCollapsed = false }: LogoutDialogProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const displayName = userName || t('common:user');
  
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          className={`flex items-center ${isCollapsed || isMobile ? 'w-9 h-9 justify-center px-0' : 'w-full justify-start gap-3 px-3 py-3'} ${isMobile ? 'min-h-[44px]' : ''} rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/20 hover:text-sidebar-accent-foreground font-mono group touch-manipulation`}
          title={isCollapsed || isMobile ? t('auth:signOut') : ''}
        >
          <LogOut className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
          {!isCollapsed && !isMobile && t('auth:signOut')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className={isMobile ? 'max-w-[calc(100vw-2rem)] mx-4' : ''}>
        <AlertDialogHeader>
          <AlertDialogTitle className={`font-mono ${isMobile ? 'text-lg' : ''}`}>{t('auth:confirmLogout')}</AlertDialogTitle>
          <AlertDialogDescription className={`font-mono ${isMobile ? 'text-sm' : ''}`}>
            {t('auth:confirmLogoutMessage', { userName: displayName })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className={isMobile ? 'gap-2' : ''}>
          <AlertDialogCancel className={`font-mono ${isMobile ? 'min-h-[44px] touch-manipulation' : ''}`}>{t('common:buttons.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className={`font-mono ${isMobile ? 'min-h-[44px] touch-manipulation' : ''}`}>{t('auth:signOut')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default LogoutDialog;
