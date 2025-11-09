import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { Prompt, Tag } from '@/lib/storage';
import { promptService } from '@/features/prompts/services/prompt-service';
import { TagService } from '@/features/tags/services/tag-service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, ArrowLeft, Globe } from 'lucide-react';
import { toast } from '@/shared/utils/toast';
import SEO from '@/shared/components/SEO';
import { trackEvent } from '@/lib/analytics';
import { ENV } from '@/lib/constants';

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
        const publicPrompt = await promptService.getPrompt(id);
        
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
  }, [id, t]);

  useEffect(() => {
    if (!loading && prompt) {
      trackEvent('view_prompt_detail', { prompt_id: id });
    }
  }, [loading, prompt, id]);

  const handleCopyUrl = () => {
    const baseUrl = ENV.SITE_URL || window.location.origin;
    const url = `${baseUrl}/p/${id}`;
    navigator.clipboard.writeText(url);
    toast.success('prompt.urlCopied');
    trackEvent('copy_prompt_url', { prompt_id: id });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
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

  const baseUrl = ENV.SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://prompedia.app');
  const promptUrl = `${baseUrl}/p/${id}`;
  const promptTitle = prompt.title || t('prompt:untitled');
  const promptDescription = prompt.description || t('prompt:seoDescription') || t('prompt:defaultDescription', { title: promptTitle });

  return (
    <div className="min-h-screen bg-background">
      {/* SEO Meta & JSON-LD */}
      <SEO
        title={`${promptTitle} - Prompedia AI`}
        description={promptDescription}
        url={promptUrl}
        type="article"
        tags={tags.map(t => t.name)}
        canonical={promptUrl}
        schemaType="Article"
        author={prompt.user_id ? {
          identifier: prompt.user_id,
          url: `${baseUrl}/user/${prompt.user_id}`,
        } : undefined}
        publishedTime={new Date().toISOString()}
        alternateLanguages={[
          { lang: 'en', url: promptUrl },
          { lang: 'id', url: promptUrl },
          { lang: 'x-default', url: promptUrl },
        ]}
        breadcrumbs={[
          { name: t('common:home'), url: baseUrl },
          { name: t('common:public'), url: baseUrl },
          { name: promptTitle, url: promptUrl },
        ]}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: promptTitle,
          description: promptDescription,
          url: promptUrl,
          keywords: tags.map(t => t.name).join(', '),
          inLanguage: 'en',
          datePublished: new Date().toISOString(),
          dateModified: new Date().toISOString(),
          author: prompt.user_id ? {
            '@type': 'Person',
            identifier: prompt.user_id,
            url: `${baseUrl}/user/${prompt.user_id}`,
          } : undefined,
          publisher: {
            '@type': 'Organization',
            name: 'Prompedia AI',
            logo: {
              '@type': 'ImageObject',
              url: `${baseUrl}/logo.png`,
            },
          },
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': promptUrl,
          },
        }}
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyUrl}
            className="font-mono"
          >
            <Copy className="w-4 h-4 mr-2" />
            {t('library:copyUrl')}
          </Button>
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
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-foreground font-mono mb-4">{t('prompt:promptContent')}</h2>
          <div className="bg-muted/20 p-4 rounded-lg">
            <pre className="text-sm font-mono whitespace-pre-wrap text-foreground leading-relaxed">
              {prompt.content}
            </pre>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PublicPromptDetail;

