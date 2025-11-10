import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Prompt, Tag } from '@/lib/storage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Lock, Globe, Edit, Trash2, Search, Filter, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { SupabaseService } from '@/lib/supabase-service';
import { TagService } from '@/lib/tag-service';
import PromptDetailModal from './PromptDetailModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PromptWithTags extends Prompt {
  tags: Tag[];
}

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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState<PromptWithTags | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [promptsWithTags, setPromptsWithTags] = useState<PromptWithTags[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);

  const loadTagsForPrompts = useCallback(async () => {
    if (prompts.length === 0) {
      setPromptsWithTags([]);
      setAllTags([]);
      setIsLoadingTags(false);
      return;
    }

    setIsLoadingTags(true);
    try {
      // Load tags in parallel instead of serial for better performance
      const tagPromises = prompts.map(async (prompt) => {
        try {
          const tags = await TagService.getPromptTags(prompt.id);
          return { ...prompt, tags };
        } catch (tagError) {
          console.warn(`Failed to load tags for prompt ${prompt.id}:`, tagError);
          return { ...prompt, tags: [] };
        }
      });

      const promptsWithTagsData = await Promise.all(tagPromises);
      
      // Collect unique tags
      const tagSet = new Set<string>();
      promptsWithTagsData.forEach(prompt => {
        prompt.tags.forEach(tag => tagSet.add(tag.name));
      });

      setPromptsWithTags(promptsWithTagsData);
      setAllTags(Array.from(tagSet));
    } catch (error) {
      console.error('Failed to load tags:', error);
      setPromptsWithTags(prompts.map(p => ({ ...p, tags: [] })));
      setAllTags([]);
    } finally {
      setIsLoadingTags(false);
    }
  }, [prompts]);

  // Memuat tag dari database untuk semua prompt
  useEffect(() => {
    loadTagsForPrompts();
  }, [loadTagsForPrompts]);

  // Memfilter prompt berdasarkan pencarian dan tag
  const filteredPrompts = promptsWithTags.filter(prompt => {
    const matchesSearch = prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (prompt.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesTag = !selectedTag || prompt.tags.some(tag => tag.name === selectedTag);
    return matchesSearch && matchesTag;
  });

  // Handler flow UX delete baru
  const handleDeleteClick = (prompt: PromptWithTags) => {
    setPromptToDelete(prompt);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!promptToDelete) return;
    
    try {
      await onDeletePrompt(promptToDelete.id);
      toast.success(t('success:prompt.deleted'));
    } catch (error) {
      console.error('Failed to delete prompt:', error);
      toast.error(t('errors:prompt.deleteFailed'));
    } finally {
      setIsDeleteDialogOpen(false);
      setPromptToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setPromptToDelete(null);
  };

  const handleEdit = (e: React.MouseEvent, prompt: PromptWithTags) => {
    e.stopPropagation();
    onEditPrompt(prompt);
  };

  const handleCopy = (e: React.MouseEvent, prompt: PromptWithTags) => {
    e.stopPropagation();
    if (onCopyPrompt) {
      onCopyPrompt(prompt);
    }
  };

  const handleCardClick = (prompt: PromptWithTags) => {
    setSelectedPrompt(prompt);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPrompt(null);
  };

  const handleUsePrompt = (prompt: PromptWithTags) => {
    onSelectPrompt(prompt);
    toast.success(t('success:prompt.loaded'));
  };

  // Show skeleton while loading instead of spinner
  if (isLoadingTags) {
    return (
      <div className="flex flex-col h-full">
        <div className="border-b border-border bg-card/50 sm:p-4 md:p-6 p-3">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1 w-full">
              <div className="h-10 bg-muted animate-pulse rounded-md" />
            </div>
            <div className="relative w-full sm:w-auto sm:min-w-[200px]">
              <div className="h-10 bg-muted animate-pulse rounded-md" />
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 p-3 sm:p-4 md:p-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card border rounded-lg p-4 sm:p-6 space-y-4">
                <div className="flex justify-between">
                  <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-6 w-3/4 bg-muted animate-pulse rounded" />
                <div className="space-y-2">
                  <div className="h-4 w-full bg-muted animate-pulse rounded" />
                  <div className="h-4 w-5/6 bg-muted animate-pulse rounded" />
                </div>
                <div className="flex gap-2">
                  <div className="h-6 w-16 bg-muted animate-pulse rounded" />
                  <div className="h-6 w-20 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (prompts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
        <FileText className="w-16 h-16 mb-4 opacity-50" />
        <h3 className="text-lg font-semibold mb-2 font-mono">{t('library:noPrompts')}</h3>
        <p className="text-sm text-center">{t('library:createFirstPrompt')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full view-transition">
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
              <div
                key={prompt.id}
                onClick={() => handleCardClick(prompt)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardClick(prompt);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={t('library:openDetails', { title: prompt.title || t('prompt:untitled') })}
                className={`group relative bg-card border rounded-lg p-4 sm:p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/50 active:scale-[0.98] touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  currentPromptId === prompt.id
                    ? 'border-primary bg-accent/20 shadow-md'
                    : 'border-border hover:bg-accent/10'
                }`}
              >
                {/* Header with status indicator */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: prompt.color || '#10b981' }}
                    />
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-center gap-2">
                    {prompt.is_public ? (
                      <div className="flex items-center gap-1 text-primary">
                        <Globe className="w-4 h-4" />
                        <span className="text-xs font-mono">{t('common:labels.public')}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Lock className="w-4 h-4" />
                        <span className="text-xs font-mono">{t('common:labels.private')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-bold text-lg mb-2 line-clamp-2 font-mono group-hover:text-primary transition-colors">
                  {prompt.title || t('prompt:untitled')}
                </h3>

                {/* Description */}
                {prompt.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3 font-mono leading-relaxed">
                    {prompt.description}
                  </p>
                )}

                {/* Tags */}
                {prompt.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {prompt.tags.slice(0, 3).map(tag => (
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
                    ))}
                    {prompt.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs font-mono">
                        +{prompt.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Footer with metadata */}
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <div className="text-xs text-muted-foreground font-mono">
                    <div>{prompt.model || t('library:unknownModel')}</div>
                    <div>{prompt.is_featured ? t('common:labels.featured') : t('common:labels.standard')}</div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                    {onCopyPrompt && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleCopy(e, prompt)}
                        className="h-8 w-8 p-0 hover:bg-blue-500/20 hover:text-blue-500"
                        title={t('library:copyPrompt')}
                        aria-label={t('library:copyPrompt')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => handleEdit(e, prompt)}
                      className="h-8 w-8 p-0 hover:bg-primary/20"
                        title={t('library:editPrompt')}
                        aria-label={t('library:editPrompt')}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(prompt);
                      }}
                      className="h-8 w-8 p-0 hover:bg-destructive/20 hover:text-destructive"
                        title={t('library:deletePrompt')}
                        aria-label={t('library:deletePrompt')}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('library:deletePrompt')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('library:deleteConfirm', { title: promptToDelete?.title || t('prompt:untitled') })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>
              {t('common:buttons.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common:buttons.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyLibrary;