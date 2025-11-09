import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Copy, Trash2, Download, Link as LinkIcon, Lock, Globe, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from '@/shared/utils/toast';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import type { PromptWithTags } from '@/shared/types/prompts';

interface PromptCardProps {
  prompt: PromptWithTags;
  variant: 'my-library' | 'public-library' | 'tag';
  currentPromptId?: string;
  onClick?: (prompt: PromptWithTags) => void;
  onEdit?: (prompt: PromptWithTags) => void;
  onUse?: (prompt: PromptWithTags) => void;
  onCopy?: (prompt: PromptWithTags) => void;
  onDelete?: (prompt: PromptWithTags) => void;
  onCopyUrl?: (promptId: string) => void;
  showCreator?: boolean;
  creatorData?: { avatar: string; username: string };
}

const PromptCard = ({
  prompt,
  variant,
  currentPromptId,
  onClick,
  onEdit,
  onCopy,
  onDelete,
  showCreator = false,
  creatorData,
}: PromptCardProps) => {
  const { t } = useTranslation();

  const handleCardClick = () => {
    // Always open modal when card is clicked
    if (onClick) {
      onClick(prompt);
    }
  };

  const handleCopyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCopy) {
      onCopy(prompt);
    } else {
      // Default copy behavior
      navigator.clipboard.writeText(prompt.content);
      toast.success('prompt.contentCopied');
    }
  };

  const isActive = currentPromptId === prompt.id;

  // Show creator if creatorData is provided or if we should show it
  const shouldShowCreator = (showCreator || creatorData) && creatorData;

  return (
    <div
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={t('library:openDetails', { title: prompt.title || t('prompt:untitled') })}
      className={`group relative bg-card border rounded-lg p-4 cursor-pointer touch-manipulation focus-ring flex flex-col ${
        isActive
          ? 'border-primary bg-accent/20 shadow-md ring-2 ring-primary/20'
          : 'border-border hover:bg-accent/10'
      }`}
    >
      {/* Header with creator info and action icons */}
      <div className="flex items-center justify-between mb-2">
        {/* Creator info - shown for all variants when available */}
        {shouldShowCreator ? (
          <div className="flex items-center gap-2">
            <span className="text-base">{creatorData.avatar}</span>
            <span className="text-xs font-semibold text-primary font-mono">
              @{creatorData.username}
            </span>
          </div>
        ) : (
          <div></div>
        )}
        
        {/* Action icons - right side: Status, Copy, Edit, Delete */}
        <TooltipProvider>
          <div className="flex items-center gap-1">
            {/* Status icon - private/public */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className="cursor-default"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {prompt.is_public ? (
                    <Globe className="w-4 h-4 text-primary" />
                  ) : (
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-mono">{prompt.is_public ? t('common:labels.public') : t('common:labels.private')}</p>
              </TooltipContent>
            </Tooltip>

            {/* Copy button - always visible */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={handleCopyClick}
                  aria-label={t('library:copyContentToClipboard')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-mono">{t('library:copyContentToClipboard')}</p>
              </TooltipContent>
            </Tooltip>

            {/* Edit button - only for my-library */}
            {variant === 'my-library' && onEdit && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onEdit) onEdit(prompt);
                    }}
                    aria-label={t('common:buttons.edit')}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-mono">{t('common:buttons.edit')}</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Delete button - only for my-library */}
            {variant === 'my-library' && onDelete && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onDelete) onDelete(prompt);
                    }}
                    aria-label={t('library:deletePrompt')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-mono">{t('library:deletePrompt')}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipProvider>
      </div>

      {/* Title */}
      <h3 className="font-bold text-base mb-2 line-clamp-2 font-mono group-hover:text-primary transition-colors">
        {variant === 'public-library' ? (
          <Link
            to={`/p/${prompt.id}`}
            onClick={(e) => e.stopPropagation()}
            aria-label={t('library:viewDetails', { title: prompt.title || t('prompt:untitled') })}
            className="hover:underline focus:underline underline-offset-4"
          >
            {prompt.title || t('prompt:untitled')}
          </Link>
        ) : (
          prompt.title || t('prompt:untitled')
        )}
      </h3>

      {/* Tags - Show all tags */}
      {prompt.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {prompt.tags.map(tag => (
            variant === 'tag' ? (
              <Link
                key={tag.id}
                to={`/tags/${encodeURIComponent(tag.name)}`}
                onClick={(e) => e.stopPropagation()}
              >
                <Badge
                  variant="secondary"
                  className="text-xs bg-prompedia-green-500/20 text-prompedia-green-400 border border-prompedia-green-500/30 font-mono"
                  style={{
                    backgroundColor: `${tag.color}20`,
                    color: tag.color,
                    borderColor: `${tag.color}30`
                  }}
                >
                  {tag.name}
                </Badge>
              </Link>
            ) : (
              <Badge
                key={tag.id}
                variant="secondary"
                className="text-xs bg-prompedia-green-500/20 text-prompedia-green-400 border border-prompedia-green-500/30 font-mono"
                style={{
                  backgroundColor: `${tag.color}20`,
                  color: tag.color,
                  borderColor: `${tag.color}30`
                }}
              >
                {tag.name}
              </Badge>
            )
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(PromptCard);

