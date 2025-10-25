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
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

interface LogoutDialogProps {
  userName?: string;
  onConfirm: () => void;
  isCollapsed?: boolean;
}

const LogoutDialog = ({ userName = 'User', onConfirm, isCollapsed = false }: LogoutDialogProps) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          className={`flex items-center ${isCollapsed ? 'w-9 h-9 justify-center px-0' : 'w-full justify-start gap-3 px-3 py-3'} rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/20 hover:text-sidebar-accent-foreground font-mono group`}
          title={isCollapsed ? 'Logout' : ''}
        >
          <LogOut className={`w-4 h-4 ${isCollapsed ? 'group-hover:scale-110 transition-transform' : ''}`} />
          {!isCollapsed && 'Logout'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-mono">Confirm Logout</AlertDialogTitle>
          <AlertDialogDescription className="font-mono">
            Are you sure you want to log out, {userName}?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="font-mono">Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="font-mono">Logout</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default LogoutDialog;
