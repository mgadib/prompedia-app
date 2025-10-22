import { Prompt } from '@/lib/storage';
import { Badge } from '@/components/ui/badge';
import { FileText, Lock, Globe } from 'lucide-react';
import { Tag } from '@/integrations/supabase/types';

interface PromptWithTags extends Prompt {
  tags: Tag[];
}

interface PromptLibraryProps {
  prompts: PromptWithTags[];
  onSelectPrompt: (prompt: PromptWithTags) => void;
  currentPromptId?: string;
}

const PromptLibrary = ({ prompts, onSelectPrompt, currentPromptId }: PromptLibraryProps) => {
  if (prompts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-sm">No prompts yet. Create your first one!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6 prompt-library-grid">
      {prompts.map((prompt) => (
        <button
          key={prompt.id}
          onClick={() => onSelectPrompt(prompt)}
          className={`text-left p-4 rounded-sm border transition-all hover:border-primary/50 ${
            currentPromptId === prompt.id
              ? 'border-primary bg-accent/20'
              : 'border-border bg-card'
          }`}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: prompt.color }}
              />
              <FileText className="w-4 h-4 text-muted-foreground" />
            </div>
            {prompt.isPublic ? (
              <Globe className="w-4 h-4 text-primary" />
            ) : (
              <Lock className="w-4 h-4 text-muted-foreground" />
            )}
          </div>

          <h3 className="font-semibold mb-1 truncate font-mono responsive-text">{prompt.title}</h3>

          {prompt.description && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2 font-mono">
              {prompt.description}
            </p>
          )}

          <div className="flex flex-wrap gap-1 mb-2">
            {prompt.tags.slice(0, 3).map(tag => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="text-xs bg-prompedia-green-500/20 text-prompedia-green-400 border border-prompedia-green-500/30 font-mono"
                style={{ backgroundColor: `${tag.color}20`, color: tag.color, borderColor: `${tag.color}30` }}
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

          <div className="text-xs text-muted-foreground font-mono">
            {prompt.model} • {prompt.isFeatured ? 'Featured' : 'Standard'}
          </div>
        </button>
      ))}
    </div>
  );
};

export default PromptLibrary;
