import { Prompt } from '@/lib/storage';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Lock, Globe, Copy, X, Calendar, User, Tag } from 'lucide-react';
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
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold font-mono mb-2">
                {prompt.title || 'Untitled Prompt'}
              </DialogTitle>
              
              {/* Metadata */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span className="font-mono">
                    Updated: {new Date(prompt.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  {prompt.isPublic ? (
                    <>
                      <Globe className="w-4 h-4 text-primary" />
                      <span className="font-mono">Public</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span className="font-mono">Private</span>
                    </>
                  )}
                </div>

                {prompt.model && (
                  <div className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    <span className="font-mono">{prompt.model}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 ml-4">
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
                  className="font-mono"
                >
                  Use Prompt
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {/* Description */}
            {prompt.description && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider font-mono">
                  Description
                </h3>
                <p className="text-sm text-foreground font-mono leading-relaxed bg-muted/30 p-4 rounded-lg">
                  {prompt.description}
                </p>
              </div>
            )}

            {/* Tags */}
            {prompt.tags.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider font-mono flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {prompt.tags.map(tag => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-xs bg-prompedia-green-500/20 text-prompedia-green-400 border border-prompedia-green-500/30 font-mono"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Prompt Content */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider font-mono">
                Prompt Content
              </h3>
              <div className="bg-muted/30 p-4 rounded-lg border">
                <pre className="text-sm font-mono whitespace-pre-wrap text-foreground leading-relaxed">
                  {prompt.content || 'No content available'}
                </pre>
              </div>
            </div>

            {/* Additional Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">
                  Created
                </span>
                <p className="text-sm font-mono">
                  {new Date(prompt.createdAt).toLocaleString()}
                </p>
              </div>
              
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">
                  Last Modified
                </span>
                <p className="text-sm font-mono">
                  {new Date(prompt.updatedAt).toLocaleString()}
                </p>
              </div>

              {prompt.mode && (
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">
                    Mode
                  </span>
                  <p className="text-sm font-mono">{prompt.mode}</p>
                </div>
              )}

              {prompt.color && (
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">
                    Color
                  </span>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full border border-border"
                      style={{ backgroundColor: prompt.color }}
                    />
                    <span className="text-sm font-mono">{prompt.color}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default PromptDetailModal;