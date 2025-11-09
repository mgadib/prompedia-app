import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Globe, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import PromptDetailModal from './PromptDetailModal';
import PromptCard from './PromptCard';
import { SkeletonCard } from '@/components/ui/skeleton';
import { trackEvent } from '@/lib/analytics';
import { ENV } from '@/lib/constants';
import { usePromptTags } from '@/features/library/hooks/usePromptTags';
import { usePromptFilter } from '@/features/prompts/hooks/usePromptFilter';
import { useDebounce } from '@/shared/hooks/useDebounce';
import type { PromptWithTags } from '@/shared/types/prompts';
import type { Prompt } from '@/lib/storage';

interface PublicLibraryProps {
  prompts: PromptWithTags[];
  onSelectPrompt: (prompt: PromptWithTags) => void;
  onUsePrompt: (prompt: PromptWithTags) => void;
  currentPromptId?: string;
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

const PublicLibrary = ({ 
  prompts, 
  onSelectPrompt, 
  onUsePrompt, 
  currentPromptId 
}: PublicLibraryProps) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [selectedPrompt, setSelectedPrompt] = useState<PromptWithTags | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Debounce search term to reduce filtering computations
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

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

  // Track library view on mount
  useEffect(() => {
    trackEvent('view_public_library');
  }, []);

  // Use shared filtering hook with debounced search term
  const { filteredPrompts } = usePromptFilter({
    prompts: promptsWithTags,
    searchTerm: debouncedSearchTerm,
    selectedTag,
  });

  const handleCopy = useCallback((prompt: PromptWithTags) => {
    navigator.clipboard.writeText(prompt.content);
    toast.success(t('success:prompt.contentCopied'));
    trackEvent('copy_prompt_content', { prompt_id: prompt.id });
  }, [t]);

  const handleCopyUrl = useCallback((promptId: string) => {
    const base = ENV.SITE_URL || window.location.origin;
    const url = `${base}/p/${promptId}`;
    navigator.clipboard.writeText(url);
    toast.success(t('success:prompt.urlCopied'));
    trackEvent('copy_prompt_url', { prompt_id: promptId });
  }, [t]);

  const handleUse = useCallback((prompt: PromptWithTags) => {
    onUsePrompt(prompt);
    toast.success(t('success:prompt.loadedForEditing'));
    trackEvent('use_prompt', { prompt_id: prompt.id });
  }, [onUsePrompt, t]);

  const handleCardClick = useCallback((prompt: PromptWithTags) => {
    setSelectedPrompt(prompt);
    setIsModalOpen(true);
    trackEvent('open_prompt_modal', { prompt_id: prompt.id });
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedPrompt(null);
  }, []);

  const handleUsePromptFromModal = useCallback((prompt: Prompt) => {
    onUsePrompt({ ...prompt, tags: selectedPrompt?.tags || [] });
    toast.success(t('success:prompt.loadedForEditing'));
    trackEvent('use_prompt', { prompt_id: prompt.id });
  }, [onUsePrompt, selectedPrompt, t]);

  const handleCopyPromptFromModal = useCallback((prompt: Prompt) => {
    navigator.clipboard.writeText(prompt.content);
    toast.success(t('success:prompt.contentCopied'));
    trackEvent('copy_prompt_content', { prompt_id: prompt.id });
  }, [t]);

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

  if (promptsWithTags.length === 0 && prompts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Globe className="w-16 h-16 opacity-50" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-primary/30 rounded-full" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold font-mono">{t('library:noPublicPrompts')}</h3>
            <p className="text-sm">{t('library:beFirstToShare')}</p>
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
            <label htmlFor="public-search" className="sr-only">{t('common:labels.search')}</label>
            <Input
              id="public-search"
              aria-label={t('common:labels.search')}
              placeholder={t('library:searchPublicPrompts')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 font-mono min-h-[44px] text-base sm:text-sm"
            />
          </div>
          
          {/* Tag Filter */}
          <div className="relative w-full sm:w-auto sm:min-w-[200px]">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <label htmlFor="public-tag-filter" className="sr-only">{t('library:filterByTag')}</label>
            <select
              id="public-tag-filter"
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
              <Globe className="w-4 h-4 text-primary" />
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
            {filteredPrompts.map((prompt) => {
              const userData = getMockUserData(prompt.user_id || '');
              
              return (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  variant="public-library"
                  currentPromptId={currentPromptId}
                  onClick={handleCardClick}
                  onUse={handleUse}
                  onCopy={handleCopy}
                  onCopyUrl={handleCopyUrl}
                  showCreator={true}
                  creatorData={userData}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Prompt Detail Modal */}
      <PromptDetailModal
        prompt={selectedPrompt}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onUse={handleUsePromptFromModal}
        onCopy={handleCopyPromptFromModal}
      />
    </div>
  );
};

export default memo(PublicLibrary);