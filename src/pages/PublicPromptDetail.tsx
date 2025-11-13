import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { Prompt, Tag } from '@/lib/storage';
import { SupabaseService } from '@/lib/supabase-service';
import { TagService } from '@/lib/tag-service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, ArrowLeft, Globe, Download } from 'lucide-react';
import { showSuccessToast } from '@/lib/toast-helpers';
import SEO from '@/components/SEO';
import { trackEvent } from '@/lib/analytics';

const PublicPromptDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPrompt = async () => {
      if (!id) {
        setError(t('prompt:invalidId'));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Memuat prompt dari Supabase
        const publicPrompt = await SupabaseService.getPrompt(id);
        
        if (!publicPrompt) {
          setError(t('prompt:promptNotFound'));
          setLoading(false);
          return;
        }

        // Mengecek apakah prompt adalah public
        if (!publicPrompt.is_public) {
          setError(t('prompt:notPublic'));
          setLoading(false);
          return;
        }

        setPrompt(publicPrompt);

        // Memuat tag
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
        setError(t('errors:prompt.loadFailed'));
        setLoading(false);
      }
    };

    loadPrompt();
  }, [id]);

  useEffect(() => {
    if (!loading && prompt) {
      trackEvent('view_prompt_detail', { prompt_id: id });
    }
  }, [loading, prompt, id]);

  const handleCopyContent = () => {
    if (prompt) {
      navigator.clipboard.writeText(prompt.content);
      showSuccessToast('success:prompt.contentCopied');
      trackEvent('copy_prompt_content', { prompt_id: id });
    }
  };

  const handleCopyUrl = () => {
    const url = `https://prompedia.app/p/${id}`;
    navigator.clipboard.writeText(url);
    showSuccessToast('success:prompt.urlCopied');
    trackEvent('copy_prompt_url', { prompt_id: id });
  };

  const handleUsePrompt = () => {
    // Navigasi ke halaman utama dengan ID prompt di URL
    trackEvent('use_prompt', { prompt_id: id });
    navigate(`/?prompt=${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground font-mono">{t('common:status.loadingPrompt')}</p>
        </div>
      </div>
    );
  }

  if (error || !prompt) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-foreground mb-4 font-mono">
            {error || t('prompt:promptNotFound')}
          </h1>
          <p className="text-muted-foreground mb-6 font-mono">
            {t('prompt:promptNotFoundDescription')}
          </p>
          <Button onClick={() => navigate('/')} className="font-mono">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common:buttons.goToHome')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* SEO Meta & JSON-LD */}
      <SEO
        title={prompt.title || t('prompt:seoTitle')}
        description={prompt.description || t('prompt:seoDescription')}
        url={`https://prompedia.app/p/${id}`}
        type="article"
        tags={tags.map(t => t.name)}
        canonical={`https://prompedia.app/p/${id}`}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CreativeWork',
          name: prompt.title || t('prompt:untitled'),
          description: prompt.description || '',
          url: `https://prompedia.app/p/${id}`,
          keywords: tags.map(t => t.name).join(', '),
          inLanguage: 'en',
          author: prompt.user_id ? { '@type': 'Person', identifier: prompt.user_id } : undefined,
        }}
        breadcrumbs={[
          { name: t('common:home'), url: 'https://prompedia.app/' },
          { name: t('common:public'), url: 'https://prompedia.app/' },
          { name: prompt.title || t('prompt:title'), url: `https://prompedia.app/p/${id}` },
        ]}
      />
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
            {t('common:buttons.back')}
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyUrl}
              className="font-mono"
            >
              <Copy className="w-4 h-4 mr-2" />
              {t('library:copyUrl')}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleUsePrompt}
              className="font-mono"
            >
              <Download className="w-4 h-4 mr-2" />
              {t('prompt:usePrompt')}
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
            <span className="text-sm font-semibold text-primary font-mono">{t('prompt:publicPrompt')}</span>
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
          {prompt.model_id && <span>{t('prompt:model')}: {prompt.model_id}</span>}
          {prompt.mode_id && <span>{t('prompt:mode')}: {prompt.mode_id}</span>}
          {prompt.is_featured && (
            <Badge variant="outline" className="font-mono">{t('common:labels.featured')}</Badge>
          )}
        </div>

        {/* Prompt Content */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground font-mono">{t('prompt:promptContent')}</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyContent}
              className="font-mono"
            >
              <Copy className="w-4 h-4 mr-2" />
              {t('common:buttons.copy')}
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
            {t('prompt:useThisPrompt')}
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handleCopyContent}
            className="flex-1 font-mono"
          >
            <Copy className="w-5 h-5 mr-2" />
            {t('prompt:copyContent')}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default PublicPromptDetail;
