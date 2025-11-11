import { Prompt } from '@/lib/storage';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, X, Lock, Globe, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';

interface PromptDetailModalProps {
  prompt: Prompt | null;
  isOpen: boolean;
  onClose: () => void;
  onCopy?: (prompt: Prompt) => void;
  onUse?: (prompt: Prompt) => void;
}

const PromptDetailModal = ({ 
  prompt, 
  isOpen, 
  onClose, 
  onCopy, 
  onUse
}: PromptDetailModalProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  
  if (!prompt) return null;

  const handleCopy = () => {
    if (onCopy) {
      onCopy(prompt);
    } else {
      // Perilaku copy default - menyalin konten prompt ke clipboard
      navigator.clipboard.writeText(prompt.content);
      toast.success(t('success:prompt.contentCopied'));
    }
  };

  const handleCopyUrl = () => {
    const url = `https://prompedia.app/p/${prompt.id}`;
    navigator.clipboard.writeText(url);
    toast.success(t('success:prompt.urlCopied'));
  };

  const handleUse = () => {
    if (onUse) {
      onUse(prompt);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isMobile ? 'max-w-[calc(100vw-1rem)] mx-2' : 'max-w-3xl'} max-h-[90vh] p-0 bg-background border-border [&>button]:hidden flex flex-col`}>
        {/* Header */}
        <div className={`flex ${isMobile ? 'flex-col' : 'items-start justify-between'} ${isMobile ? 'gap-3' : ''} ${isMobile ? 'p-4' : 'p-6'} border-b border-border/50 flex-shrink-0`}>
          <div className={`flex-1 ${isMobile ? '' : 'pr-4'}`}>
            <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-foreground font-mono ${isMobile ? 'mb-2' : 'mb-3'}`}>
              {prompt.title || t('prompt:untitled')}
            </h2>
          </div>

          {/* Action buttons */}
          <div className={`flex items-center ${isMobile ? 'w-full gap-2' : 'gap-2'}`}>
            {prompt.is_public && (
              <Button
                size={isMobile ? "default" : "sm"}
                variant="outline"
                onClick={handleCopyUrl}
                className={`font-mono touch-manipulation ${isMobile ? 'flex-1 min-h-[44px]' : ''}`}
                title={t('library:copyUrl')}
              >
                <LinkIcon className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} ${isMobile ? '' : 'mr-2'}`} />
                {isMobile ? '' : t('common:buttons.url')}
              </Button>
            )}
            
            <Button
              size={isMobile ? "default" : "sm"}
              variant="outline"
              onClick={handleCopy}
              className={`font-mono touch-manipulation ${isMobile ? 'flex-1 min-h-[44px]' : ''}`}
            >
              <Copy className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} ${isMobile ? '' : 'mr-2'}`} />
              {isMobile ? '' : t('common:buttons.copy')}
            </Button>
            
            {onUse && (
              <Button
                size={isMobile ? "default" : "sm"}
                onClick={handleUse}
                className={`font-mono bg-primary hover:bg-primary/90 touch-manipulation ${isMobile ? 'flex-1 min-h-[44px]' : ''}`}
              >
                {isMobile ? t('common:buttons.use') : t('prompt:usePrompt')}
              </Button>
            )}
            
            <Button
              size={isMobile ? "default" : "sm"}
              variant="ghost"
              onClick={onClose}
              className={`${isMobile ? 'h-11 w-11' : 'h-8 w-8'} p-0 touch-manipulation`}
            >
              <X className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-border/80">
          <div className={`${isMobile ? 'px-4 pt-3 pb-4' : 'px-6 pt-4 pb-6'} space-y-4`}>
            {/* Prompt Content */}
            <div>
              <div className="bg-muted/20 p-4 rounded-lg">
                <pre className="text-sm font-mono whitespace-pre-wrap text-foreground leading-relaxed">
                  {prompt.content || t('common:status.noContentAvailable')}
                </pre>
              </div>
            </div>

            {/* Footer with all metadata */}
            <div className="pt-3 border-t border-border/50">
              <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center justify-between'} text-xs text-muted-foreground font-mono`}>
                <div className={`flex ${isMobile ? 'flex-wrap gap-2' : 'items-center gap-4'}`}>
                  <span>{t('common:status.status')}: {prompt.is_featured ? t('common:labels.featured') : t('common:labels.standard')}</span>
                  {prompt.mode && <span>{t('common:status.mode')}: {prompt.mode}</span>}
                  {prompt.model && <span>{t('common:status.model')}: {prompt.model}</span>}
                </div>
                <div className="flex items-center gap-2">
                  {prompt.is_public ? (
                    <div className="flex items-center gap-1 text-primary">
                      <Globe className="w-3 h-3" />
                      <span className="font-semibold">{t('common:labels.public')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Lock className="w-3 h-3" />
                      <span className="font-semibold">{t('common:labels.private')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PromptDetailModal;