import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Hash, Plus, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { storage } from '@/lib/storage';
import { TagService } from '@/features/tags/services/tag-service';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/shared/hooks/use-mobile';

interface TagInputProps {
  selectedTagNames: string[];
  onChange: (tagNames: string[]) => void;
}

const TagInput = ({ selectedTagNames, onChange }: TagInputProps) => {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const isMobile = useIsMobile();

  // Mendapatkan tag user untuk saran
  useEffect(() => {
    const loadSuggestions = async () => {
      setIsLoadingSuggestions(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Mendapatkan tag user untuk saran
          const userTags = await TagService.getUserTags(user.id);
          const tagNames = userTags.map(tag => tag.name);
          
          // Memfilter tag yang sudah dipilih
          const availableTags = tagNames.filter(tag => !selectedTagNames.includes(tag));
          setSuggestions(availableTags.slice(0, 10));
        } else {
          // Untuk user guest, gunakan beberapa saran default
          setSuggestions(['ai', 'writing', 'creative', 'productivity', 'coding']);
        }
      } catch (error) {
        console.error('Failed to load tag suggestions:', error);
        setSuggestions(['ai', 'writing', 'creative', 'productivity', 'coding']);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    loadSuggestions();
  }, [selectedTagNames]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Mengecek apakah koma diketik
    if (value.includes(',')) {
      const parts = value.split(',');
      const newTag = parts[0].trim();

      if (newTag && !selectedTagNames.includes(newTag) && selectedTagNames.length < 3) {
        onChange([...selectedTagNames, newTag]);
      }

      // Mengatur teks yang tersisa setelah koma sebagai input baru
      const remainingText = parts.slice(1).join(',').trim();
      setInput(remainingText);
      setShowSuggestions(remainingText.length > 0);
    } else {
      setInput(value);
      setShowSuggestions(value.length > 0);
    }
  };

  const addTag = (tagToAdd: string) => {
    if (!selectedTagNames.includes(tagToAdd) && tagToAdd.length > 0 && selectedTagNames.length < 3) {
      onChange([...selectedTagNames, tagToAdd]);
    }
    setInput('');
    setShowSuggestions(false);
  };

  const removeTag = (tagToRemove: string) => {
    onChange(selectedTagNames.filter(tag => tag !== tagToRemove));
  };

  const filteredSuggestions = suggestions.filter(tag =>
    tag.toLowerCase().includes(input.toLowerCase()) && !selectedTagNames.includes(tag)
  );

  return (
    <div className="space-y-1">
      <div className="relative">
        {/* Area input utama dengan tag inline - sesuai desain title */}
        <div className={`relative flex ${isMobile ? 'flex-wrap' : 'items-center'} gap-2 ${isMobile ? 'min-h-[44px]' : 'min-h-[40px]'} bg-transparent border-none ${isMobile ? 'px-2 py-2' : 'px-3 py-2'} focus-within:ring-0`}>
          <Hash className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} text-muted-foreground flex-shrink-0 ${isMobile ? 'self-start mt-2' : ''}`} />
          
          {/* Current Tags - displayed inline with input, wrap on mobile */}
          <div className={`flex items-center gap-2 ${isMobile ? 'flex-wrap' : 'flex-nowrap overflow-hidden'}`}>
            {selectedTagNames.map(tag => (
              <Badge
                key={tag}
                variant="secondary"
                className={`bg-prompedia-green-500/20 text-prompedia-green-400 border border-prompedia-green-500/30 ${isMobile ? 'text-sm' : 'text-xs'} font-mono hover:bg-prompedia-green-500/30 transition-colors flex-shrink-0 whitespace-nowrap touch-manipulation ${isMobile ? 'py-1.5 px-2' : ''}`}
              >
                <Hash className={`${isMobile ? 'w-4 h-4' : 'w-3 h-3'} mr-1`} />
                <span className={`truncate ${isMobile ? 'max-w-[120px]' : 'max-w-[100px]'}`}>{tag}</span>
                <button
                  onClick={() => removeTag(tag)}
                  className={`ml-2 hover:text-prompedia-green-300 transition-colors flex-shrink-0 touch-manipulation ${isMobile ? 'min-h-[24px] min-w-[24px]' : ''}`}
                >
                  <X className={`${isMobile ? 'w-4 h-4' : 'w-3 h-3'}`} />
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
            placeholder={selectedTagNames.length >= 3 ? t('common:placeholders.maxTags') : t('common:placeholders.addTags')}
            className={`bg-transparent border-none ${isMobile ? 'text-base' : 'text-sm'} font-mono focus-visible:ring-0 flex-1 ${isMobile ? 'min-w-[120px]' : 'min-w-[150px]'} ${isMobile ? 'min-h-[44px]' : ''} px-2`}
            disabled={selectedTagNames.length >= 3}
          />

          {/* Popular Tags Quick Add - inline on same row, wrap on mobile */}
          {selectedTagNames.length < 3 && !isLoadingSuggestions && suggestions.length > 0 && !isMobile && (
            <div className="flex items-center gap-1 ml-2">
              {suggestions.slice(0, 3 - selectedTagNames.length).map(tag => (
                <Button
                  key={tag}
                  variant="ghost"
                  size="sm"
                  onClick={() => addTag(tag)}
                  className="h-6 px-2 text-xs bg-accent/10 hover:bg-accent/20 hover:text-accent font-mono flex-shrink-0 touch-manipulation transition-smooth"
                  aria-label={t('common:placeholders.addTag', { tag })}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {tag}
                </Button>
              ))}
            </div>
          )}
          {isLoadingSuggestions && !isMobile && (
            <div className="flex items-center gap-1 ml-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          )}
        </div>
        
        {/* Popular Tags Quick Add - separate row on mobile */}
        {selectedTagNames.length < 3 && !isLoadingSuggestions && suggestions.length > 0 && isMobile && (
          <div className="flex items-center gap-2 mt-2 px-2">
            {suggestions.slice(0, 3 - selectedTagNames.length).map(tag => (
              <Button
                key={tag}
                variant="ghost"
                size="default"
                onClick={() => addTag(tag)}
                className="h-9 px-3 text-sm bg-accent/10 hover:bg-accent/20 hover:text-accent font-mono flex-shrink-0 touch-manipulation transition-smooth"
                aria-label={t('common:placeholders.addTag', { tag })}
              >
                <Plus className="w-4 h-4 mr-1" />
                {tag}
              </Button>
            ))}
          </div>
        )}
        {isLoadingSuggestions && isMobile && (
          <div className="flex items-center gap-2 mt-2 px-2">
            <Skeleton className="h-9 w-20 rounded-md" />
            <Skeleton className="h-9 w-24 rounded-md" />
          </div>
        )}

        {/* Tag Suggestions */}
        {showSuggestions && !isLoadingSuggestions && filteredSuggestions.length > 0 && selectedTagNames.length < 3 && (
          <div className={`absolute top-full left-0 right-0 z-10 mt-1 bg-card border border-border rounded-md shadow-lg max-h-32 overflow-y-auto ${isMobile ? 'max-h-40' : ''}`}>
            {filteredSuggestions.slice(0, 5).map(tag => (
              <button
                key={tag}
                onClick={() => addTag(tag)}
                className={`w-full text-left ${isMobile ? 'px-4 py-3 text-base min-h-[44px]' : 'px-3 py-2 text-sm'} hover:bg-accent/20 hover:text-accent font-mono flex items-center gap-2 touch-manipulation transition-smooth`}
                aria-label={t('common:placeholders.addTag', { tag })}
              >
                <Hash className={`${isMobile ? 'w-4 h-4' : 'w-3 h-3'}`} />
                {tag}
              </button>
            ))}
          </div>
        )}
        {showSuggestions && isLoadingSuggestions && (
          <div className={`absolute top-full left-0 right-0 z-10 mt-1 bg-card border border-border rounded-md shadow-lg p-2 ${isMobile ? 'max-h-40' : 'max-h-32'}`}>
            <div className="flex items-center justify-center gap-2 py-2">
              <Loader2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-mono">{t('common:status.loading')}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TagInput;
