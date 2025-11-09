import { useTranslation } from 'react-i18next';
import { FileText, Copy, Share2, Trash2, Leaf, EyeOff, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import DeletePromptDialog from './DeletePromptDialog';

interface EditorActionsMenuProps {
  onNew: () => void;
  onCopy: () => void;
  onShare: () => void;
  onDelete: () => void;
  onToggleFocus: () => void;
  isFocusMode: boolean;
  canDelete: boolean;
  canShare: boolean;
  promptTitle?: string;
  isMobile?: boolean;
}

const EditorActionsMenu = ({
  onNew,
  onCopy,
  onShare,
  onDelete,
  onToggleFocus,
  isFocusMode,
  canDelete,
  canShare,
  promptTitle,
  isMobile: isMobileProp,
}: EditorActionsMenuProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const mobile = isMobileProp ?? isMobile;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={mobile ? "icon" : "sm"}
          className={`hover:bg-accent/20 hover:text-accent font-mono touch-manipulation ${mobile ? 'h-9 w-9' : ''}`}
          title={mobile ? t('common:buttons.moreActions') : ''}
          aria-label={t('common:buttons.moreActions')}
        >
          <MoreVertical className={`${mobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
          {!mobile && <span className="ml-2">{t('common:buttons.moreActions')}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 font-mono">
        <DropdownMenuItem onClick={onNew} className="cursor-pointer">
          <FileText className="mr-2 h-4 w-4" />
          <span>{t('common:buttons.new')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onCopy} className="cursor-pointer">
          <Copy className="mr-2 h-4 w-4" />
          <span>{t('common:buttons.copy')}</span>
        </DropdownMenuItem>
        {canShare && (
          <DropdownMenuItem onClick={onShare} className="cursor-pointer">
            <Share2 className="mr-2 h-4 w-4" />
            <span>{t('common:buttons.share')}</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onToggleFocus} className="cursor-pointer">
          {isFocusMode ? (
            <>
              <EyeOff className="mr-2 h-4 w-4" />
              <span>{t('prompt:exitFocusMode')}</span>
            </>
          ) : (
            <>
              <Leaf className="mr-2 h-4 w-4" />
              <span>{t('common:buttons.focus')}</span>
            </>
          )}
        </DropdownMenuItem>
        {canDelete && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <DeletePromptDialog
                promptTitle={promptTitle || t('prompt:untitled')}
                onConfirm={onDelete}
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 font-mono"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>{t('common:buttons.delete')}</span>
                  </Button>
                }
              />
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default EditorActionsMenu;

