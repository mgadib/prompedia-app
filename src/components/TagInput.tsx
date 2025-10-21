import { useState, useEffect } from 'react';
import { X, Hash, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { storage } from '@/lib/storage';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

const TagInput = ({ tags, onChange }: TagInputProps) => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Get popular tags from all prompts for suggestions
  useEffect(() => {
    const allPrompts = storage.getPrompts();
    const tagCounts: { [key: string]: number } = {};
    
    allPrompts.forEach(prompt => {
      prompt.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const popularTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag]) => tag)
      .filter(tag => !tags.includes(tag));

    setSuggestions(popularTags);
  }, [tags]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Check if comma was typed
    if (value.includes(',')) {
      const parts = value.split(',');
      const newTag = parts[0].trim();
      
      if (newTag && !tags.includes(newTag) && tags.length < 3) {
        onChange([...tags, newTag]);
      }
      
      // Set remaining text after comma as new input
      const remainingText = parts.slice(1).join(',').trim();
      setInput(remainingText);
      setShowSuggestions(remainingText.length > 0);
    } else {
      setInput(value);
      setShowSuggestions(value.length > 0);
    }
  };

  const addTag = (tagToAdd: string) => {
    if (!tags.includes(tagToAdd) && tagToAdd.length > 0 && tags.length < 3) {
      onChange([...tags, tagToAdd]);
    }
    setInput('');
    setShowSuggestions(false);
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  const filteredSuggestions = suggestions.filter(tag =>
    tag.toLowerCase().includes(input.toLowerCase()) && !tags.includes(tag)
  );

  return (
    <div className="space-y-1">
      <div className="relative">
        {/* Main input area with tags inline - matching title design */}
        <div className="relative flex items-center gap-2 min-h-[40px] bg-transparent border-none px-0 focus-within:ring-0">
          <Hash className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          
          {/* Current Tags - displayed inline with input, single line only */}
          <div className="flex items-center gap-2 flex-nowrap overflow-hidden">
            {tags.map(tag => (
              <Badge
                key={tag}
                variant="secondary"
                className="bg-prompedia-green-500/20 text-prompedia-green-400 border border-prompedia-green-500/30 text-xs font-mono hover:bg-prompedia-green-500/30 transition-colors flex-shrink-0 whitespace-nowrap"
              >
                <Hash className="w-3 h-3 mr-1" />
                <span className="truncate max-w-[100px]">{tag}</span>
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-2 hover:text-prompedia-green-300 transition-colors flex-shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          
          {/* Input field - matching title styling */}
          <Input
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(input.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={tags.length >= 3 ? "Max 3 tags" : "Add tags..."}
            className="bg-transparent border-none text-sm font-mono focus-visible:ring-0 flex-1 min-w-[150px] px-0"
            disabled={tags.length >= 3}
          />
        </div>

        {/* Tag Suggestions */}
        {showSuggestions && filteredSuggestions.length > 0 && tags.length < 3 && (
          <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-card border border-border rounded-md shadow-lg max-h-32 overflow-y-auto">
            {filteredSuggestions.slice(0, 5).map(tag => (
              <button
                key={tag}
                onClick={() => addTag(tag)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent/20 hover:text-accent font-mono flex items-center gap-2"
              >
                <Hash className="w-3 h-3" />
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Popular Tags Quick Add - only when less than 3 tags */}
      {tags.length < 3 && suggestions.length > 0 && (
        <div className="mt-2">
          <div className="flex flex-wrap gap-1">
            {suggestions.slice(0, Math.min(6, 3 - tags.length)).map(tag => (
              <Button
                key={tag}
                variant="ghost"
                size="sm"
                onClick={() => addTag(tag)}
                className="h-6 px-2 text-xs bg-accent/10 hover:bg-accent/20 hover:text-accent font-mono"
              >
                <Plus className="w-3 h-3 mr-1" />
                {tag}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TagInput;
