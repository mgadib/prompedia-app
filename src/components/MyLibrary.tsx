import { useState } from 'react';
import { Prompt } from '@/lib/storage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Lock, Globe, Edit, Trash2, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import PromptDetailModal from './PromptDetailModal';

interface MyLibraryProps {
  prompts: Prompt[];
  onSelectPrompt: (prompt: Prompt) => void;
  onEditPrompt: (prompt: Prompt) => void;
  onDeletePrompt: (promptId: string) => void;
  currentPromptId?: string;
}

const MyLibrary = ({ 
  prompts, 
  onSelectPrompt, 
  onEditPrompt, 
  onDeletePrompt, 
  currentPromptId 
}: MyLibraryProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get all unique tags from prompts
  const allTags = Array.from(new Set(prompts.flatMap(p => p.tags)));

  // Filter prompts based on search and tag
  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (prompt.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesTag = !selectedTag || prompt.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const handleDelete = (e: React.MouseEvent, promptId: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this prompt?')) {
      onDeletePrompt(promptId);
      toast.success('Prompt deleted successfully');
    }
  };

  const handleEdit = (e: React.MouseEvent, prompt: Prompt) => {
    e.stopPropagation();
    onEditPrompt(prompt);
  };

  const handleCardClick = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPrompt(null);
  };

  const handleUsePrompt = (prompt: Prompt) => {
    onSelectPrompt(prompt);
    toast.success('Prompt loaded in editor');
  };

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
                        key={tag}
                        variant="secondary"
                        className="text-xs bg-prompedia-green-500/20 text-prompedia-green-400 border border-prompedia-green-500/30 font-mono"
                      >
                        {tag}
                      </Badge>
                    ))}
                    {prompt.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs font-mono">
                        +{prompt.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Footer with date and actions */}
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <div className="text-xs text-muted-foreground font-mono">
                    <div>Created: {new Date(prompt.createdAt).toLocaleDateString()}</div>
                    <div>Updated: {new Date(prompt.updatedAt).toLocaleDateString()}</div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => handleEdit(e, prompt)}
                      className="h-8 w-8 p-0 hover:bg-primary/20"
                      title="Edit prompt"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => handleDelete(e, prompt.id)}
                      className="h-8 w-8 p-0 hover:bg-destructive/20 hover:text-destructive"
                      title="Delete prompt"
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
    </div>
  );
};

export default MyLibrary;