import { useState, useEffect, useCallback } from 'react';
import { Prompt } from '@/lib/storage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Lock, Globe, Edit, Trash2, Search, Filter, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { SupabaseService } from '@/lib/supabase-service';
import { Tag } from '@/integrations/supabase/types';
import PromptDetailModal from './PromptDetailModal';
import DeletePromptDialog from './DeletePromptDialog';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [selectedPrompt, setSelectedPrompt] = useState<PromptWithTags | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      const promptsWithTagsData: PromptWithTags[] = [];
      const tagSet = new Set<string>();

      for (const prompt of prompts) {
        try {
          const tags = await SupabaseService.getPromptTags(prompt.id);
          promptsWithTagsData.push({ ...prompt, tags });

          // Collect all unique tag names
          tags.forEach(tag => tagSet.add(tag.name));
        } catch (tagError) {
          console.warn(`Failed to load tags for prompt ${prompt.id}:`, tagError);
          // Continue with empty tags for this prompt
          promptsWithTagsData.push({ ...prompt, tags: [] });
        }
      }

      setPromptsWithTags(promptsWithTagsData);
      setAllTags(Array.from(tagSet));
    } catch (error) {
      console.error('Failed to load tags:', error);
      // Fallback: use prompts without tags
      setPromptsWithTags(prompts.map(p => ({ ...p, tags: [] })));
      setAllTags([]);
    } finally {
      setIsLoadingTags(false);
    }
  }, [prompts]);

  // Load tags from database for all prompts
  useEffect(() => {
    loadTagsForPrompts();
  }, [loadTagsForPrompts]);

  // Filter prompts based on search and tag
  const filteredPrompts = promptsWithTags.filter(prompt => {
    const matchesSearch = prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (prompt.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesTag = !selectedTag || prompt.tags.some(tag => tag.name === selectedTag);
    return matchesSearch && matchesTag;
  });

  const handleDelete = (promptId: string) => {
    onDeletePrompt(promptId);
    toast.success('Prompt deleted successfully');
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
    toast.success('Prompt loaded in editor');
  };

  // Show loading state while tags are being loaded
  if (isLoadingTags) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-mono">Loading your library...</p>
      </div>
    );
  }

  if (prompts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
        <FileText className="w-16 h-16 mb-4 opacity-50" />
        <h3 className="text-lg font-semibold mb-2 font-mono">No prompts yet</h3>
        <p className="text-sm text-center">Create your first prompt to get started with your personal library!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search and Filter Header */}
      <div className="p-6 border-b border-border bg-card/50">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search prompts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 font-mono"
            />
          </div>
          
          {/* Tag Filter */}
          <div className="relative min-w-[200px]">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Results count */}
        <div className="mt-4 text-xs text-muted-foreground font-mono">
          {filteredPrompts.length} of {prompts.length} prompts
        </div>
      </div>

      {/* Prompts Grid */}
      <div className="flex-1 overflow-y-auto">
        {filteredPrompts.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-sm font-mono">No prompts match your search criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredPrompts.map((prompt) => (
              <div
                key={prompt.id}
                onClick={() => handleCardClick(prompt)}
                className={`group relative bg-card border rounded-lg p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/50 ${
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
                    {prompt.isPublic ? (
                      <Globe className="w-4 h-4 text-primary" />
                    ) : (
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-bold text-lg mb-2 line-clamp-2 font-mono group-hover:text-primary transition-colors">
                  {prompt.title || 'Untitled Prompt'}
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

                {/* Footer with actions */}
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <div className="text-xs text-muted-foreground font-mono">
                    <div>{prompt.model || 'Unknown model'}</div>
                    <div>{prompt.isFeatured ? 'Featured' : 'Standard'}</div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onCopyPrompt && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleCopy(e, prompt)}
                        className="h-8 w-8 p-0 hover:bg-blue-500/20 hover:text-blue-500"
                        title="Copy prompt"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => handleEdit(e, prompt)}
                      className="h-8 w-8 p-0 hover:bg-primary/20"
                      title="Edit prompt"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <DeletePromptDialog
                      promptTitle={prompt.title || 'Untitled Prompt'}
                      onConfirm={() => handleDelete(prompt.id)}
                    />
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
    </div>
  );
};

export default MyLibrary;