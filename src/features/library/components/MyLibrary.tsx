import { useState, useCallback, useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import PromptDetailModal from './PromptDetailModal';
import PromptCard from './PromptCard';
import { SkeletonCard } from '@/components/ui/skeleton';
import { usePromptTags } from '@/features/library/hooks/usePromptTags';
import type { PromptWithTags } from '@/shared/types/prompts';
import type { Prompt } from '@/lib/storage';

interface MyLibraryProps {
  prompts: PromptWithTags[];
  onSelectPrompt: (prompt: PromptWithTags) => void;
  onEditPrompt: (prompt: PromptWithTags) => void;
  onDeletePrompt: (promptId: string) => void;
  onCopyPrompt?: (prompt: PromptWithTags) => void;
  currentPromptId?: string;
}

const MyLibrary = ({
  prompts,
  onSelectPrompt,
  onEditPrompt,
  onDeletePrompt,
  onCopyPrompt,
  currentPromptId
}: MyLibraryProps) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [selectedPrompt, setSelectedPrompt] = useState<PromptWithTags | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Extract base Prompt objects (prompts come with empty tags from parent)
  const basePrompts: Prompt[] = useMemo(
    () => prompts.map(({ tags, ...prompt }) => prompt),
    [prompts]
  );

  // Use custom hook for efficient batch tag loading with optimistic rendering
  const {
    promptsWithTags,
    allTags,
    isLoading: isLoadingTags
  } = usePromptTags(basePrompts, {
    optimistic: true,
    enableFallback: true
  });

  // Memfilter prompt berdasarkan pencarian dan tag
  // Memoized untuk prevent unnecessary re-computations
  const filteredPrompts = useMemo(() => {
    return promptsWithTags.filter(prompt => {
      const matchesSearch = prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (prompt.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      const matchesTag = !selectedTag || prompt.tags.some(tag => tag.name === selectedTag);
      return matchesSearch && matchesTag;
    });
  }, [promptsWithTags, searchTerm, selectedTag]);

  // Delete with undo toast
  const handleDeleteClick = useCallback(async (e: React.MouseEvent, prompt: PromptWithTags) => {
    e.stopPropagation();
    try {
      await onDeletePrompt(prompt.id);
      
      // Show toast with undo action
      toast.success(t('success:prompt.deleted'), {
        action: {
          label: t('common:buttons.undo'),
          onClick: async () => {
            // Note: This would require a restore function in storageManager
            // For now, we'll just show a message
            toast.info(t('common:messages.undoNotAvailable'));
          },
        },
        duration: 5000,
      });
    } catch (error) {
      console.error('Failed to delete prompt:', error);
      toast.error(t('errors:prompt.deleteFailed'));
    }
  }, [t, onDeletePrompt]);

  const handleEdit = useCallback((prompt: PromptWithTags) => {
    onEditPrompt(prompt);
  }, [onEditPrompt]);

  const handleCopy = useCallback((prompt: PromptWithTags) => {
    if (onCopyPrompt) {
      onCopyPrompt(prompt);
    }
  }, [onCopyPrompt]);

  const handleDelete = useCallback((prompt: PromptWithTags) => {
    // Create a synthetic event for handleDeleteClick
    const syntheticEvent = {
      stopPropagation: () => {}
    } as React.MouseEvent;
    handleDeleteClick(syntheticEvent, prompt);
  }, [handleDeleteClick]);

  const handleCardClick = useCallback((prompt: PromptWithTags) => {
    // Direct edit instead of opening modal
    onEditPrompt(prompt);
  }, [onEditPrompt]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedPrompt(null);
  }, []);

  const handleUsePrompt = useCallback((prompt: PromptWithTags) => {
    onSelectPrompt(prompt);
    toast.success(t('success:prompt.loaded'));
  }, [onSelectPrompt, t]);

  // Menampilkan skeleton loading sementara tag sedang dimuat
  if (isLoadingTags) {
    return (
      <div className="flex flex-col h-full">
        {/* Search and Filter Header Skeleton */}
        <div className="border-b border-border bg-card/50 sm:p-4 md:p-6 p-3">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
            <div className="relative flex-1 w-full">
              <div className="h-10 bg-muted rounded-md animate-pulse" />
            </div>
            <div className="relative w-full sm:w-auto sm:min-w-[200px]">
              <div className="h-10 bg-muted rounded-md animate-pulse" />
            </div>
            <div className="h-6 w-32 bg-muted rounded animate-pulse" />
          </div>
        </div>

        {/* Skeleton Cards Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 p-3 sm:p-4 md:p-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (prompts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <FileText className="w-16 h-16 opacity-50" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-primary/30 rounded-full" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold font-mono">{t('library:noPrompts')}</h3>
            <p className="text-sm">{t('library:createFirstPrompt')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search and Filter Header */}
      <div className="border-b border-border bg-card/50 sm:p-4 md:p-6 p-3">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <label htmlFor="my-search" className="sr-only">{t('common:labels.search')}</label>
            <Input
              id="my-search"
              aria-label={t('common:labels.search')}
              placeholder={t('library:searchPrompts')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 font-mono min-h-[44px] text-base sm:text-sm"
            />
          </div>
          
          {/* Tag Filter */}
          <div className="relative w-full sm:w-auto sm:min-w-[200px]">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <label htmlFor="my-tag-filter" className="sr-only">{t('library:filterByTag')}</label>
            <select
              id="my-tag-filter"
              aria-label={t('library:filterByTag')}
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="w-full pl-10 pr-4 min-h-[44px] text-base sm:text-sm bg-background border border-input rounded-md font-mono focus:outline-none focus:ring-2 focus:ring-ring touch-manipulation"
            >
              <option value="">{t('common:labels.allTags')}</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>

          {/* Prompt count and filter info - responsive */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm font-mono">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-foreground font-semibold">
                {filteredPrompts.length.toLocaleString()}
              </span>
              <span className="text-muted-foreground">
                of {prompts.length.toLocaleString()}
              </span>
            </div>
            
            {/* Filter indicators */}
            {(searchTerm || selectedTag) && (
              <div className="flex items-center gap-2 text-xs">
                {searchTerm && (
                  <Badge variant="secondary" className="text-xs">
                    <Search className="w-3 h-3 mr-1" />
                    "{searchTerm}"
                  </Badge>
                )}
                {selectedTag && (
                  <Badge variant="outline" className="text-xs">
                    <Filter className="w-3 h-3 mr-1" />
                    {selectedTag}
                  </Badge>
                )}
              </div>
            )}
            
            {/* Clear filters button */}
            {(searchTerm || selectedTag) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedTag('');
                }}
                className="text-xs sm:text-xs min-h-[44px] sm:h-7 px-3 sm:px-2 hover:bg-secondary/50 touch-manipulation"
              >
                {t('common:buttons.clear')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Prompts Grid */}
      <div className="flex-1 overflow-y-auto">
        {filteredPrompts.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-sm font-mono">{t('library:noMatches')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 p-3 sm:p-4 md:p-6">
            {filteredPrompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                variant="my-library"
                currentPromptId={currentPromptId}
                onClick={handleCardClick}
                onEdit={handleEdit}
                onCopy={onCopyPrompt ? handleCopy : undefined}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Prompt Detail Modal */}
      <PromptDetailModal
        prompt={selectedPrompt}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onUse={handleUsePrompt}
      />

    </div>
  );
};

export default memo(MyLibrary);