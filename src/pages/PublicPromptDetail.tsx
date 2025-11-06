import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Prompt, Tag } from '@/lib/storage';
import { SupabaseService } from '@/lib/supabase-service';
import { TagService } from '@/lib/tag-service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, ArrowLeft, Globe, Download } from 'lucide-react';
import { toast } from 'sonner';

const PublicPromptDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPrompt = async () => {
      if (!id) {
        setError('Invalid prompt ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Load prompt from Supabase
        const publicPrompt = await SupabaseService.getPrompt(id);
        
        if (!publicPrompt) {
          setError('Prompt not found');
          setLoading(false);
          return;
        }

        // Check if prompt is public
        if (!publicPrompt.is_public) {
          setError('This prompt is not public');
          setLoading(false);
          return;
        }

        setPrompt(publicPrompt);

        // Load tags
        try {
          const promptTags = await TagService.getPromptTags(id);
          setTags(promptTags);
        } catch (tagError) {
          console.warn('Failed to load tags:', tagError);
          setTags([]);
        }

        setLoading(false);
      } catch (err) {
        console.error('Failed to load prompt:', err);
        setError('Failed to load prompt');
        setLoading(false);
      }
    };

    loadPrompt();
  }, [id]);

  const handleCopyContent = () => {
    if (prompt) {
      navigator.clipboard.writeText(prompt.content);
      toast.success('Prompt content copied to clipboard');
    }
  };

  const handleCopyUrl = () => {
    const url = `https://prompedia.app/p/${id}`;
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard');
  };

  const handleUsePrompt = () => {
    // Navigate to home page with prompt ID in URL
    navigate(`/?prompt=${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground font-mono">Loading prompt...</p>
        </div>
      </div>
    );
  }

  if (error || !prompt) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-foreground mb-4 font-mono">
            {error || 'Prompt not found'}
          </h1>
          <p className="text-muted-foreground mb-6 font-mono">
            The prompt you're looking for doesn't exist or is no longer available.
          </p>
          <Button onClick={() => navigate('/')} className="font-mono">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="font-mono"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyUrl}
              className="font-mono"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy URL
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleUsePrompt}
              className="font-mono"
            >
              <Download className="w-4 h-4 mr-2" />
              Use Prompt
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-4xl mx-auto px-4 py-8">
        {/* Title Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-primary font-mono">Public Prompt</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground font-mono mb-4">
            {prompt.title}
          </h1>
          {prompt.description && (
            <p className="text-lg text-muted-foreground font-mono leading-relaxed">
              {prompt.description}
            </p>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {tags.map(tag => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="text-sm font-mono"
                style={{
                  backgroundColor: `${tag.color}20`,
                  color: tag.color,
                  borderColor: `${tag.color}30`,
                  border: '1px solid'
                }}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Metadata */}
        <div className="flex flex-wrap gap-4 mb-6 text-sm text-muted-foreground font-mono">
          {prompt.model_id && <span>Model: {prompt.model_id}</span>}
          {prompt.mode_id && <span>Mode: {prompt.mode_id}</span>}
          {prompt.is_featured && (
            <Badge variant="outline" className="font-mono">Featured</Badge>
          )}
        </div>

        {/* Prompt Content */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground font-mono">Prompt Content</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyContent}
              className="font-mono"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
          </div>
          <div className="bg-muted/20 p-4 rounded-lg">
            <pre className="text-sm font-mono whitespace-pre-wrap text-foreground leading-relaxed">
              {prompt.content}
            </pre>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="default"
            size="lg"
            onClick={handleUsePrompt}
            className="flex-1 font-mono"
          >
            <Download className="w-5 h-5 mr-2" />
            Use This Prompt
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handleCopyContent}
            className="flex-1 font-mono"
          >
            <Copy className="w-5 h-5 mr-2" />
            Copy Content
          </Button>
        </div>
      </main>
    </div>
  );
};

export default PublicPromptDetail;
