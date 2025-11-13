import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Prompt, Tag } from '@/lib/storage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, Globe, Edit, Trash2, Copy, Download, Link as LinkIcon } from 'lucide-react';

interface PromptWithTags extends Prompt {
  tags: Tag[];
}

interface PromptCardProps {
  prompt: PromptWithTags;
  variant: 'my-library' | 'public-library' | 'tag-view';
  currentPromptId?: string;
  onCardClick?: (prompt: PromptWithTags) => void;
  onEdit?: (prompt: PromptWithTags) => void;
  onDelete?: (prompt: PromptWithTags) => void;
  onCopy?: (prompt: PromptWithTags) => void;
  onCopyUrl?: (promptId: string) => void;
  onUse?: (prompt: PromptWithTags) => void;
}

// Data mock untuk demonstrasi - di aplikasi nyata ini akan datang dari API
const getMockUserData = (userId: string) => {
  const users = {
    'user1': { username: 'alex_dev', avatar: '👨‍💻' },
    'user2': { username: 'sarah_writer', avatar: '✍️' },
    'user3': { username: 'mike_designer', avatar: '🎨' },
    'user4': { username: 'emma_analyst', avatar: '📊' },
  };
  return users[userId as keyof typeof users] || { username: 'anonymous', avatar: '👤' };
};

const PromptCard = ({
  prompt,
  variant,
  currentPromptId,
  onCardClick,
  onEdit,
  onDelete,
  onCopy,
  onCopyUrl,
  onUse,
}: PromptCardProps) => {
  const { t } = useTranslation();

  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick(prompt);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(prompt);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(prompt);
    }
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCopy) {
      onCopy(prompt);
    }
  };

  const handleCopyUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCopyUrl) {
      onCopyUrl(prompt.id);
    }
  };

  const handleUse = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUse) {
      onUse(prompt);
    }
  };

  const userData = variant === 'public-library' || variant === 'tag-view' 
    ? getMockUserData(prompt.user_id || '') 
    : null;

  const isSelected = currentPromptId === prompt.id;

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
      className={`group relative bg-card border rounded-lg p-3 sm:p-4 cursor-pointer hover:shadow-lg hover:border-primary/50 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
        isSelected
          ? 'border-primary bg-accent/20 shadow-md'
          : 'border-border hover:bg-accent/10'
      }`}
    >
      {/* Header with status indicator and action buttons */}
      <div className="flex items-center justify-between mb-2">
        {/* Badge public/private dan creator info di kiri */}
        <div className="flex items-center gap-2">
          {prompt.is_public ? (
            <div className="flex items-center gap-1 text-primary">
              <Globe className="w-3.5 h-3.5" />
              <span className="text-xs font-mono">{t('common:labels.public')}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Lock className="w-3.5 h-3.5" />
              <span className="text-xs font-mono">{t('common:labels.private')}</span>
            </div>
          )}
          
          {/* Creator info (only for public-library and tag-view) */}
          {(variant === 'public-library' || variant === 'tag-view') && userData && (
            <>
              <span className="text-muted-foreground">|</span>
              <div className="flex items-center gap-1">
                <span className="text-sm">{userData.avatar}</span>
                <span className="text-xs font-semibold text-primary font-mono">
                  @{userData.username}
                </span>
              </div>
            </>
          )}
        </div>
        
        {/* Action buttons di kanan */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
          {variant === 'my-library' && (
            <>
              {onCopy && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopy}
                  className="h-7 w-7 p-0 hover:bg-blue-500/20 hover:text-blue-500"
                  title={t('library:copyPrompt')}
                  aria-label={t('library:copyPrompt')}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              )}
              {onEdit && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleEdit}
                  className="h-7 w-7 p-0 hover:bg-primary/20"
                  title={t('library:editPrompt')}
                  aria-label={t('library:editPrompt')}
                >
                  <Edit className="w-3 h-3" />
                </Button>
              )}
              {onDelete && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDelete}
                  className="h-7 w-7 p-0 hover:bg-destructive/20 hover:text-destructive"
                  title={t('library:deletePrompt')}
                  aria-label={t('library:deletePrompt')}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </>
          )}

          {(variant === 'public-library' || variant === 'tag-view') && (
            <>
              {onCopyUrl && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyUrl}
                  className="h-7 w-7 p-0 hover:bg-primary/20"
                  title={t('library:copyUrl')}
                  aria-label={t('library:copyUrl')}
                >
                  <LinkIcon className="w-3 h-3" />
                </Button>
              )}
              {onCopy && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopy}
                  className="h-7 w-7 p-0 hover:bg-primary/20"
                  title={t('library:copyContentToClipboard')}
                  aria-label={t('library:copyContentToClipboard')}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              )}
              {onUse && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleUse}
                  className="h-7 w-7 p-0 hover:bg-primary/20"
                  title={t('library:useThisPrompt')}
                  aria-label={t('library:useThisPrompt')}
                >
                  <Download className="w-3 h-3" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="font-bold text-lg mb-1.5 line-clamp-2 font-mono group-hover:text-primary">
        {variant === 'public-library' || variant === 'tag-view' ? (
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

      {/* Tags */}
      {prompt.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {prompt.tags.slice(0, 3).map(tag => (
            <a
              key={tag.id}
              href={`/tags/${encodeURIComponent(tag.name)}`}
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="inline-block"
            >
              <Badge
                variant="secondary"
                className="text-xs bg-prompedia-green-500/20 text-prompedia-green-400 border border-prompedia-green-500/30 font-mono hover:bg-prompedia-green-500/30 cursor-pointer"
                style={{
                  backgroundColor: `${tag.color}20`,
                  color: tag.color,
                  borderColor: `${tag.color}30`
                }}
              >
                {tag.name}
              </Badge>
            </a>
          ))}
          {prompt.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs font-mono">
              +{prompt.tags.length - 3}
            </Badge>
          )}
        </div>
      )}

    </div>
  );
};

export default PromptCard;

