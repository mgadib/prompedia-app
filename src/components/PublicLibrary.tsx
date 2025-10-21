import { useState } from 'react';
import { Prompt } from '@/lib/storage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Globe, User, Copy, Download, Search, Filter, Heart, Eye } from 'lucide-react';
import { toast } from 'sonner';
import PromptDetailModal from './PromptDetailModal';

interface PublicLibraryProps {
  prompts: Prompt[];
  onSelectPrompt: (prompt: Prompt) => void;
  onCopyPrompt: (prompt: Prompt) => void;
  onUsePrompt: (prompt: Prompt) => void;
  currentPromptId?: string;
}

// Mock data for demonstration - in real app this would come from API
const getMockUserData = (userId: string) => {
  const users = {
    'user1': { username: 'alex_dev', avatar: '👨‍💻' },
    'user2': { username: 'sarah_writer', avatar: '✍️' },
    'user3': { username: 'mike_designer', avatar: '🎨' },
    'user4': { username: 'emma_analyst', avatar: '📊' },
  };
  return users[userId as keyof typeof users] || { username: 'anonymous', avatar: '👤' };
};

const getMockUsageCount = (promptId: string) => {
  // Mock usage counts - in real app this would come from analytics
  return Math.floor(Math.random() * 1000) + 10;
};

const getMockLikes = (promptId: string) => {
  // Mock likes - in real app this would come from user interactions
  return Math.floor(Math.random() * 100) + 5;
};

const PublicLibrary = ({ 
  prompts, 
  onSelectPrompt, 
  onCopyPrompt, 
  onUsePrompt, 
  currentPromptId 
}: PublicLibraryProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'likes'>('recent');
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter only public prompts
  const publicPrompts = prompts.filter(prompt => prompt.isPublic);
  
  // Get all unique tags from public prompts
  const allTags = Array.from(new Set(publicPrompts.flatMap(p => p.tags)));

  // Filter prompts based on search and tag
  let filteredPrompts = publicPrompts.filter(prompt => {
    const matchesSearch = prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (prompt.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesTag = !selectedTag || prompt.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  // Sort prompts
  filteredPrompts = filteredPrompts.sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return getMockUsageCount(b.id) - getMockUsageCount(a.id);
      case 'likes':
        return getMockLikes(b.id) - getMockLikes(a.id);
      case 'recent':
      default:
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  });

  const handleCopy = (e: React.MouseEvent, prompt: Prompt) => {
    e.stopPropagation();
    onCopyPrompt(prompt);
    toast.success('Prompt copied to your library');
  };

  const handleUse = (e: React.MouseEvent, prompt: Prompt) => {
    e.stopPropagation();
    onUsePrompt(prompt);
    toast.success('Prompt loaded for editing');
  };

  const handleCardClick = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPrompt(null);
  };

  const handleUsePromptFromModal = (prompt: Prompt) => {
    onUsePrompt(prompt);
    toast.success('Prompt loaded for editing');
  };

  const handleCopyPromptFromModal = (prompt: Prompt) => {
    onCopyPrompt(prompt);
    toast.success('Prompt copied to your library');
  };

  if (publicPrompts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
        <Globe className="w-16 h-16 mb-4 opacity-50" />
        <h3 className="text-lg font-semibold mb-2 font-mono">No public prompts yet</h3>
        <p className="text-sm text-center">Be the first to share a prompt with the community!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search and Filter Header */}
      <div className="p-6 border-b border-border bg-card/50">
        <div className="flex flex-col gap-4">
          {/* Search and Sort Row */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search public prompts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 font-mono"
              />
            </div>
            
            {/* Sort Dropdown */}
            <div className="relative min-w-[150px]">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'recent' | 'popular' | 'likes')}
                className="w-full px-4 py-2 bg-background border border-input rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="recent">Most Recent</option>
                <option value="popular">Most Used</option>
                <option value="likes">Most Liked</option>
              </select>
            </div>
          </div>

          {/* Tag Filter Row */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 bg-background border border-input rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All categories</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Results count */}
        <div className="mt-4 text-xs text-muted-foreground font-mono">
          {filteredPrompts.length} of {publicPrompts.length} public prompts
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
            {filteredPrompts.map((prompt) => {
              const userData = getMockUserData(prompt.userId);
              const usageCount = getMockUsageCount(prompt.id);
              const likesCount = getMockLikes(prompt.id);
              
              return (
                <div
                  key={prompt.id}
                  onClick={() => handleCardClick(prompt)}
                  className={`group relative bg-card border rounded-lg p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/50 ${
                    currentPromptId === prompt.id
                      ? 'border-primary bg-accent/20 shadow-md'
                      : 'border-border hover:bg-accent/10'
                  }`}
                >
                  {/* Header with creator info */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{userData.avatar}</span>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-primary font-mono">
                          @{userData.username}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Globe className="w-3 h-3" />
                          <span className="font-mono">Public</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Stats */}
                    <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span className="font-mono">{usageCount}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        <span className="font-mono">{likesCount}</span>
                      </div>
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
                      <div>Model: {prompt.model || 'DeepSeek Chat V3'}</div>
                      <div>Updated: {new Date(prompt.updatedAt).toLocaleDateString()}</div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleCopy(e, prompt)}
                        className="h-8 w-8 p-0 hover:bg-primary/20"
                        title="Copy to private library"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleUse(e, prompt)}
                        className="h-8 w-8 p-0 hover:bg-primary/20"
                        title="Use this prompt"
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
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

export default PublicLibrary;