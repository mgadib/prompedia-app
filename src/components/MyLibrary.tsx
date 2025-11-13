import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/lib/i18n-formatting';
import { Prompt, Tag } from '@/lib/storage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Search, Filter } from 'lucide-react';
import { showSuccessToast, showErrorToast } from '@/lib/toast-helpers';
import { SupabaseService } from '@/lib/supabase-service';
import { TagService } from '@/lib/tag-service';
import PromptDetailModal from './PromptDetailModal';
import PromptCard from './PromptCard';
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
  const prevPromptsRef = useRef<PromptWithTags[]>([]);

  const loadTagsForPrompts = useCallback(async (skipLoadingState = false) => {
    if (prompts.length === 0) {
      setPromptsWithTags([]);
      setAllTags([]);
      setIsLoadingTags(false);
      return;
    }

    if (!skipLoadingState) {
      setIsLoadingTags(true);
    }
    try {
      // Batch load all tags in a single query instead of N queries
      const promptIds = prompts.map(p => p.id);
      const tagsMap = await TagService.getTagsForPrompts(promptIds);
      
      // Map tags to prompts using the batch-loaded data
      const promptsWithTagsData = prompts.map(prompt => ({
        ...prompt,
        tags: tagsMap.get(prompt.id) || []
      }));
      
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
      if (!skipLoadingState) {
        setIsLoadingTags(false);
      }
    }
  }, [prompts]);

  // Optimistic update: sync promptsWithTags dengan prompts prop
  // Jika prompt dihapus, langsung filter tanpa reload tags
  // Jika prompt ditambahkan, baru reload tags
  useEffect(() => {
    const prevPrompts = prevPromptsRef.current;
    const prevPromptIds = new Set(prevPrompts.map(p => p.id));
    const newPromptIds = new Set(prompts.map(p => p.id));
    
    // Skip jika prompts tidak berubah
    if (prevPrompts.length === prompts.length && 
        prevPrompts.every((p, i) => p.id === prompts[i]?.id)) {
      return;
    }
    
    // Jika initial load (prevPrompts kosong), reload tags
    if (prevPrompts.length === 0 && prompts.length > 0) {
      prevPromptsRef.current = prompts;
      loadTagsForPrompts();
      return;
    }
    
    // Jika ada prompt yang dihapus (prompts.length < prevPrompts.length)
    if (prompts.length < prevPrompts.length) {
      // Optimistic update: langsung filter tanpa loading state
      setPromptsWithTags(prev => {
        const filtered = prev.filter(p => newPromptIds.has(p.id));
        
        // Update allTags berdasarkan tags yang masih ada
        const tagSet = new Set<string>();
        filtered.forEach(prompt => {
          prompt.tags.forEach(tag => tagSet.add(tag.name));
        });
        setAllTags(Array.from(tagSet));
        
        return filtered;
      });
      prevPromptsRef.current = prompts;
      return;
    }
    
    // Jika ada prompt baru yang ditambahkan, reload tags
    const hasNewPrompts = prompts.some(p => !prevPromptIds.has(p.id));
    if (hasNewPrompts) {
      prevPromptsRef.current = prompts;
      loadTagsForPrompts();
      return;
    }
    
    // Jika hanya update (misalnya edit), sync tanpa reload tags
    setPromptsWithTags(prev => {
      const updated = prev.map(existing => {
        const updatedPrompt = prompts.find(p => p.id === existing.id);
        if (updatedPrompt) {
          return {
            ...updatedPrompt,
            tags: existing.tags // Keep existing tags
          };
        }
        return existing;
      });
      return updated;
    });
    
    // Update ref untuk next comparison
    prevPromptsRef.current = prompts;
  }, [prompts, loadTagsForPrompts]);

  // Memfilter prompt berdasarkan pencarian dan tag
  const filteredPrompts = promptsWithTags.filter(prompt => {
    const matchesSearch = prompt.title.toLowerCase().includes(searchTerm.toLowerCase());
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
      showSuccessToast('success:prompt.deleted');
    } catch (error) {
      console.error('Failed to delete prompt:', error);
      showErrorToast('errors:prompt.deleteFailed');
    } finally {
      setIsDeleteDialogOpen(false);
      setPromptToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setPromptToDelete(null);
  };

  const handleCardClick = (prompt: PromptWithTags) => {
    setSelectedPrompt(prompt);
    setIsModalOpen(true);
  };

  const handleEdit = (prompt: PromptWithTags) => {
    onEditPrompt(prompt);
  };

  const handleDelete = (prompt: PromptWithTags) => {
    handleDeleteClick(prompt);
  };

  const handleCopy = (prompt: PromptWithTags) => {
    navigator.clipboard.writeText(prompt.content);
    showSuccessToast('success:prompt.contentCopied');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPrompt(null);
  };

  const handleUsePrompt = (prompt: PromptWithTags) => {
    onSelectPrompt(prompt);
    showSuccessToast('success:prompt.loaded');
  };

  // Show skeleton while loading instead of spinner
  if (isLoadingTags) {
    return (
      <div className="flex flex-col h-full">
        <div className="border-b border-border bg-card/50 sm:p-4 md:p-6 p-3">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1 w-full">
              <div className="h-10 bg-muted rounded-md" />
            </div>
            <div className="relative w-full sm:w-auto sm:min-w-[200px]">
              <div className="h-10 bg-muted rounded-md" />
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 p-3 sm:p-4 md:p-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card border rounded-lg p-4 sm:p-6 space-y-4">
                <div className="flex justify-between">
                  <div className="h-4 w-20 bg-muted rounded" />
                  <div className="h-4 w-16 bg-muted rounded" />
                </div>
                <div className="h-6 w-3/4 bg-muted rounded" />
                <div className="space-y-2">
                  <div className="h-4 w-full bg-muted rounded" />
                  <div className="h-4 w-5/6 bg-muted rounded" />
                </div>
                <div className="flex gap-2">
                  <div className="h-6 w-16 bg-muted rounded" />
                  <div className="h-6 w-20 bg-muted rounded" />
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
                {formatNumber(filteredPrompts.length)}
              </span>
              <span className="text-muted-foreground">
                {t('library:promptCount', { count: filteredPrompts.length, total: prompts.length })}
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
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredPrompts.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-sm font-mono">{t('library:noMatches')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 p-3 sm:p-4 md:p-6">
            {filteredPrompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                variant="my-library"
                currentPromptId={currentPromptId}
                onCardClick={handleCardClick}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onCopy={handleCopy}
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