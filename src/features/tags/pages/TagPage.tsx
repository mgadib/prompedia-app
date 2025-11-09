import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, useOutletContext, Link } from 'react-router-dom';
import { Hash, ArrowLeft, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import SEO from '@/shared/components/SEO';
import { TagService } from '@/features/tags/services/tag-service';
import { ENV } from '@/lib/constants';
import AuthModal from '@/features/auth/components/AuthModal';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import type { User } from '@supabase/supabase-js';
import PromptDetailModal from '@/features/library/components/PromptDetailModal';
import PromptCard from '@/features/library/components/PromptCard';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/analytics';
import type { PromptWithTags } from '@/shared/types/prompts';
import { Prompt } from '@/lib/storage';

// Cache untuk menyimpan data tag berdasarkan tagName dan userId
interface TagCacheEntry {
  prompts: PromptWithTags[];
  timestamp: number;
  userId: string | null;
}

const TAG_CACHE = new Map<string, TagCacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 menit

interface OutletContext {
  user: User | null;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
}

const TagPage: React.FC = () => {
  const { t } = useTranslation();
  const params = useParams<{ name: string }>();
  const navigate = useNavigate();
  const tagName = decodeURIComponent(params.name || '').trim();
  const isMobile = useIsMobile();
  
  // Get context from Layout
  const { user, mobileSidebarOpen, setMobileSidebarOpen } = useOutletContext<OutletContext>();

  const [prompts, setPrompts] = useState<PromptWithTags[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptWithTags | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const previousTagNameRef = useRef<string>('');

  const pageTitle = useMemo(() => {
    return tagName ? `Tag: ${tagName} — ${ENV.SITE_TITLE}` : `Tag — ${ENV.SITE_TITLE}`;
  }, [tagName]);

  const loadData = useCallback(async (showCachedFirst = true) => {
    // User sudah di-handle oleh Layout
    const currentUserId = user?.id || null;
    
    // Cek cache terlebih dahulu untuk UX yang lebih smooth
    const cacheKey = `${tagName}:${currentUserId || 'guest'}`;
    const cached = TAG_CACHE.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < CACHE_DURATION && showCachedFirst) {
      // Show cached data immediately untuk UX yang lebih smooth
      setPrompts(cached.prompts);
      setIsLoading(false);
      setIsRefreshing(true); // Refresh di background
    } else {
      setIsLoading(true);
    }
    
    setError(null);

    try {
      if (user) {
        setUserId(user.id);
      } else {
        setUserId(null);
      }
      
      // Validate tagName
      const tagValidation = tagName ? null : t('errors:tag.notFound');

      if (tagValidation || !tagName) {
        setError(tagValidation || t('errors:tag.notFound'));
        setPrompts([]);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      // Load data baru - sudah di-optimize di TagService
      const promptList = await TagService.getPromptsByTagName(tagName, currentUserId);
      
      // Update cache dengan userId yang benar
      const updatedCacheKey = `${tagName}:${currentUserId || 'guest'}`;
      TAG_CACHE.set(updatedCacheKey, {
        prompts: promptList,
        timestamp: now,
        userId: currentUserId
      });
      
      setPrompts(promptList);
      previousTagNameRef.current = tagName;
    } catch (err) {
      const msg = (err as Error)?.message || t('errors:tag.loadFailed');
      setError(msg);
      // Jangan clear prompts jika ada error, keep cached data
      if (!cached) {
        setPrompts([]);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [tagName, user, t]);

  useEffect(() => {
    // Reset previous tag name jika tag berubah
    if (tagName !== previousTagNameRef.current) {
      previousTagNameRef.current = '';
      // Reset prompts saat tag berubah
      setPrompts([]);
    }
    loadData(true); // Show cached first
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagName]); // Hanya depend pada tagName

  const handleLogin = () => {
    setShowAuthModal(true);
  };

  const handleCardClick = (prompt: PromptWithTags) => {
    setSelectedPrompt(prompt);
    setIsModalOpen(true);
    trackEvent('open_prompt_modal', { prompt_id: prompt.id }, userId);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPrompt(null);
  };

  const handleCopy = (prompt: PromptWithTags) => {
    navigator.clipboard.writeText(prompt.content);
    toast.success(t('success:prompt.contentCopied'));
    trackEvent('copy_prompt_content', { prompt_id: prompt.id }, userId);
  };

  const handleCopyUrl = (promptId: string) => {
    const base = ENV.SITE_URL || window.location.origin;
    const url = `${base}/p/${promptId}`;
    navigator.clipboard.writeText(url);
    toast.success(t('success:prompt.urlCopied'));
    trackEvent('copy_prompt_url', { prompt_id: promptId }, userId);
  };

  const handleUse = (prompt: PromptWithTags) => {
    navigate(`/?use=${encodeURIComponent(prompt.id)}`);
    toast.success(t('success:prompt.loadedForEditing'));
    trackEvent('use_prompt', { prompt_id: prompt.id }, userId);
  };

  const handleUsePromptFromModal = (prompt: Prompt) => {
    navigate(`/?use=${encodeURIComponent(prompt.id)}`);
    toast.success(t('success:prompt.loadedForEditing'));
    trackEvent('use_prompt', { prompt_id: prompt.id }, userId);
  };

  const handleCopyPromptFromModal = (prompt: Prompt) => {
    navigator.clipboard.writeText(prompt.content);
    toast.success(t('success:prompt.contentCopied'));
    trackEvent('copy_prompt_content', { prompt_id: prompt.id }, userId);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden transition-opacity duration-300 will-change-[opacity]">
        <SEO
          title={pageTitle}
          description={t('library:tagPageDescription', { tag: tagName })}
          url={`${ENV.SITE_URL || window.location.origin}/tags/${encodeURIComponent(tagName)}`}
          canonical={`${ENV.SITE_URL || window.location.origin}/tags/${encodeURIComponent(tagName)}`}
          type="website"
          tags={[tagName, 'prompt engineering', 'AI prompts', 'prompt library']}
          schemaType="CollectionPage"
          collectionItemCount={prompts.length}
          alternateLanguages={[
            { lang: 'en', url: `${ENV.SITE_URL || window.location.origin}/tags/${encodeURIComponent(tagName)}` },
            { lang: 'id', url: `${ENV.SITE_URL || window.location.origin}/tags/${encodeURIComponent(tagName)}` },
            { lang: 'x-default', url: `${ENV.SITE_URL || window.location.origin}/tags/${encodeURIComponent(tagName)}` },
          ]}
          breadcrumbs={[
            { name: t('common:home'), url: ENV.SITE_URL || window.location.origin },
            { name: t('common:public'), url: `${ENV.SITE_URL || window.location.origin}/` },
            { name: t('library:tagBreadcrumb', { tag: tagName }), url: `${ENV.SITE_URL || window.location.origin}/tags/${encodeURIComponent(tagName)}` },
          ]}
        />

        {/* Mobile top bar */}
        {isMobile && (
          <div className="md:hidden border-b border-border bg-card flex-shrink-0 px-4 py-3 flex items-center gap-3 z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileSidebarOpen(true)}
              className="h-9 w-9 touch-manipulation"
              aria-label={t('common:labels.openMenu')}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Hash className="w-5 h-5 text-prompedia-green-400" />
              <h1 className="text-sm font-semibold font-mono truncate">{tagName || t('common:labels.tag')}</h1>
            </div>
          </div>
        )}

        {/* Desktop top bar */}
        {!isMobile && (
          <div className="border-b border-border bg-card flex-shrink-0 px-4 py-3 flex items-center gap-3 z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-9 w-9 touch-manipulation"
              aria-label={t('common:labels.back')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Hash className="w-5 h-5 text-prompedia-green-400" />
              <h1 className="text-sm sm:text-base font-semibold font-mono truncate">{tagName || t('common:labels.tag')}</h1>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {isLoading && prompts.length === 0 ? (
            // Skeleton loading untuk first load
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 p-3 sm:p-4 md:p-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card border rounded-lg p-4 sm:p-6">
                  <div className="flex items-start justify-between mb-4">
                    <Skeleton className="w-3 h-3 rounded-full" />
                    <Skeleton className="w-16 h-4" />
                  </div>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-5/6 mb-4" />
                  <div className="flex gap-1 mb-4">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <div className="pt-4 border-t border-border/50">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
              <Hash className="w-12 h-12 mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2 font-mono">{t('library:problemOccurred')}</h3>
              <p className="text-sm text-center mb-4">{error}</p>
              <div className="flex items-center gap-2">
                <Button variant="default" onClick={() => loadData()} className="touch-manipulation">{t('common:buttons.tryAgain')}</Button>
                <Link to="/" className="text-sm underline">{t('library:backToHome')}</Link>
              </div>
            </div>
          ) : prompts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
              <Hash className="w-16 h-16 mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2 font-mono">{t('library:noPrompts')}</h3>
              <p className="text-sm text-center">{t('library:noPromptsWithTag')}</p>
            </div>
          ) : (
            <div className="relative">
              {/* Subtle indicator saat refresh di background */}
              {isRefreshing && (
                <div className="absolute top-4 right-4 z-10 bg-background/80 backdrop-blur-sm rounded-full p-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              )}
              <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 p-3 sm:p-4 md:p-6 transition-opacity duration-300 ${isRefreshing ? 'opacity-75' : 'opacity-100'}`}>
                {prompts.map((prompt) => (
                  <PromptCard
                    key={prompt.id}
                    prompt={prompt}
                    variant="tag"
                    onClick={handleCardClick}
                    onUse={handleUse}
                    onCopy={handleCopy}
                    onCopyUrl={handleCopyUrl}
                  />
                ))}
              </div>
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

        {/* Auth Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => setShowAuthModal(false)}
        />
    </div>
  );
};

export default TagPage;

