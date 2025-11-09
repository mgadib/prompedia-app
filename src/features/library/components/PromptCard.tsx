import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Lock, Globe, MoreVertical, Copy, Trash2, Download, Link as LinkIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  onUse,
  onCopy,
  onDelete,
  onCopyUrl,
  showCreator = false,
  creatorData,
}: PromptCardProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const handleCardClick = () => {
    if (onClick) {
      onClick(prompt);
    } else if (variant === 'my-library' && onEdit) {
      onEdit(prompt);
    } else if (variant === 'public-library' || variant === 'tag') {
      // Default behavior untuk public: buka modal atau navigate
      if (onClick) {
        onClick(prompt);
      }
    }
  };

  const handleAction = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    switch (action) {
      case 'edit':
        if (onEdit) onEdit(prompt);
        break;
      case 'use':
        if (onUse) onUse(prompt);
        break;
      case 'copy':
        if (onCopy) onCopy(prompt);
        break;
      case 'delete':
        if (onDelete) onDelete(prompt);
        break;
      case 'copyUrl':
        if (onCopyUrl) onCopyUrl(prompt.id);
        break;
    }
  };

  const isActive = currentPromptId === prompt.id;

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
      className={`group relative bg-card border rounded-lg p-4 sm:p-6 cursor-pointer touch-manipulation focus-ring ${
        isActive
          ? 'border-primary bg-accent/20 shadow-md ring-2 ring-primary/20'
          : 'border-border hover:bg-accent/10'
      }`}
    >
      {/* Header with color indicator and actions menu */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: prompt.color || '#10b981' }}
          />
        </div>
        {/* Actions menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 font-mono">
            {/* MyLibrary actions */}
            {variant === 'my-library' && (
              <>
                {onCopy && (
                  <DropdownMenuItem
                    onClick={(e) => handleAction(e, 'copy')}
                    className="cursor-pointer"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    <span>{t('library:copyPrompt')}</span>
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => handleAction(e, 'delete')}
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>{t('library:deletePrompt')}</span>
                    </DropdownMenuItem>
                  </>
                )}
              </>
            )}

            {/* PublicLibrary and Tag actions */}
            {(variant === 'public-library' || variant === 'tag') && (
              <>
                {onUse && (
                  <DropdownMenuItem
                    onClick={(e) => handleAction(e, 'use')}
                    className="cursor-pointer"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    <span>{t('library:useThisPrompt')}</span>
                  </DropdownMenuItem>
                )}
                {onCopy && (
                  <DropdownMenuItem
                    onClick={(e) => handleAction(e, 'copy')}
                    className="cursor-pointer"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    <span>{t('library:copyContentToClipboard')}</span>
                  </DropdownMenuItem>
                )}
                {onCopyUrl && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => handleAction(e, 'copyUrl')}
                      className="cursor-pointer"
                    >
                      <LinkIcon className="mr-2 h-4 w-4" />
                      <span>{t('library:copyUrl')}</span>
                    </DropdownMenuItem>
                  </>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Creator info (only for public-library) */}
      {showCreator && creatorData && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">{creatorData.avatar}</span>
          <span className="text-xs font-semibold text-primary font-mono">
            @{creatorData.username}
          </span>
        </div>
      )}

      {/* Title */}
      <h3 className="font-bold text-lg mb-2 line-clamp-2 font-mono group-hover:text-primary transition-colors">
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

      {/* Description */}
      {prompt.description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-3 font-mono leading-relaxed">
          {prompt.description}
        </p>
      )}

      {/* Tags - Max 2 visible, rest in tooltip */}
      {prompt.tags.length > 0 && (
        <TooltipProvider>
          <div className="flex flex-wrap gap-1 mb-3">
            {prompt.tags.slice(0, 2).map(tag => (
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
            {prompt.tags.length > 2 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="text-xs font-mono cursor-help">
                    +{prompt.tags.length - 2}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="flex flex-wrap gap-1">
                    {prompt.tags.slice(2).map(tag => (
                      <Badge key={tag.id} variant="secondary" className="text-xs">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipProvider>
      )}

      {/* Footer with status */}
      <div className="flex items-center justify-end pt-3 border-t border-border/30">
        {prompt.is_public ? (
          <Globe className="w-3 h-3 text-primary" title={t('common:labels.public')} />
        ) : (
          <Lock className="w-3 h-3 text-muted-foreground" title={t('common:labels.private')} />
        )}
      </div>
    </div>
  );
};

export default React.memo(PromptCard);

