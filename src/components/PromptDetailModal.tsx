import { Prompt } from '@/lib/storage';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, X, Lock, Globe } from 'lucide-react';
import { toast } from 'sonner';

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
  if (!prompt) return null;

  const handleCopy = () => {
    if (onCopy) {
      onCopy(prompt);
    } else {
      // Default copy behavior - copy prompt content to clipboard
      navigator.clipboard.writeText(prompt.content);
      toast.success('Prompt content copied to clipboard');
    }
  };

  const handleUse = () => {
    if (onUse) {
      onUse(prompt);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 bg-background border-border [&>button]:hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border/50 flex-shrink-0">
          <div className="flex-1 pr-4">
            <h2 className="text-2xl font-bold text-foreground font-mono mb-3">
              {prompt.title || 'Untitled Prompt'}
            </h2>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className="font-mono"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
            
            {onUse && (
              <Button
                size="sm"
                onClick={handleUse}
                className="font-mono bg-primary hover:bg-primary/90"
              >
                Use Prompt
              </Button>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-border/80">
          <div className="px-6 pt-4 pb-6 space-y-4">
            {/* Prompt Content */}
            <div>
              <div className="bg-muted/20 p-4 rounded-lg">
                <pre className="text-sm font-mono whitespace-pre-wrap text-foreground leading-relaxed">
                  {prompt.content || 'No content available'}
                </pre>
              </div>
            </div>

            {/* Footer with all metadata */}
            <div className="pt-3 border-t border-border/50">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                <div className="flex items-center gap-4">
                  <span>STATUS: {prompt.is_featured ? 'Featured' : 'Standard'}</span>
                  {prompt.mode && <span>MODE: {prompt.mode}</span>}
                  {prompt.model && <span>MODEL: {prompt.model}</span>}
                </div>
                <div className="flex items-center gap-2">
                  {prompt.is_public ? (
                    <div className="flex items-center gap-1 text-primary">
                      <Globe className="w-3 h-3" />
                      <span className="font-semibold">Public</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Lock className="w-3 h-3" />
                      <span className="font-semibold">Private</span>
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