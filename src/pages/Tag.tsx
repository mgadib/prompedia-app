import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Hash, FileText, Globe, Lock, ArrowLeft, Menu, Copy, Download, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SEO from '@/components/SEO';
import { TagService } from '@/lib/tag-service';
import { Prompt, Tag } from '@/lib/storage';
import { supabase } from '@/integrations/supabase/client';
import { ENV } from '@/lib/constants';
import Sidebar from '@/components/Sidebar';
import AuthModal from '@/components/AuthModal';
import { useIsMobile } from '@/hooks/use-mobile';
import type { User } from '@supabase/supabase-js';
import PromptDetailModal from '@/components/PromptDetailModal';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/analytics';

interface PromptWithTags extends Prompt {
  tags: Tag[];
}

const TagPage: React.FC = () => {
  const { t } = useTranslation();
  const params = useParams<{ name: string }>();
  const navigate = useNavigate();
  const tagName = decodeURIComponent(params.name || '').trim();
  const isMobile = useIsMobile();

  const [prompts, setPrompts] = useState<PromptWithTags[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptWithTags | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const pageTitle = useMemo(() => {
    return tagName ? `Tag: ${tagName} — ${ENV.SITE_TITLE}` : `Tag — ${ENV.SITE_TITLE}`;
  }, [tagName]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setUser(user);
      } else {
        setUserId(null);
        setUser(null);
      }

      if (!tagName) {
        setError(t('errors:tag.notFound'));
        setPrompts([]);
        return;
      }

      const promptList = await TagService.getPromptsByTagName(tagName, user?.id);
      setPrompts(promptList);
    } catch (err) {
      const msg = (err as Error)?.message || t('errors:tag.loadFailed');
      setError(msg);
      setPrompts([]);
    } finally {
      setIsLoading(false);
    }
  }, [tagName]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleViewChange = (view: 'my-library' | 'public-library') => {
    // Mengarahkan ke halaman utama; AppPage akan mengelola tampilan pustaka
    navigate('/', { replace: false });
  };

  const handleNewPrompt = () => {
    // Mengarahkan ke halaman utama untuk playground
    navigate('/', { replace: false });
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserId(null);
    } catch (e) {
      // Silent; error ditangani di tempat lain
    }
  };

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

  const handleCopy = (e: React.MouseEvent, prompt: PromptWithTags) => {
    e.stopPropagation();
    navigator.clipboard.writeText(prompt.content);
    toast.success(t('success:prompt.contentCopied'));
    trackEvent('copy_prompt_content', { prompt_id: prompt.id }, userId);
  };

  const handleCopyUrl = (e: React.MouseEvent, promptId: string) => {
    e.stopPropagation();
    const base = ENV.SITE_URL || window.location.origin;
    const url = `${base}/p/${promptId}`;
    navigator.clipboard.writeText(url);
    toast.success(t('success:prompt.urlCopied'));
    trackEvent('copy_prompt_url', { prompt_id: promptId }, userId);
  };

  const handleUse = (e: React.MouseEvent, prompt: PromptWithTags) => {
    e.stopPropagation();
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
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar Desktop */}
      {!isMobile && (
        <Sidebar
          activeView={user ? 'my-library' : 'public-library'}
          onViewChange={handleViewChange}
          onNewPrompt={handleNewPrompt}
          onLogout={handleLogout}
          onLogin={handleLogin}
          user={user}
          isPlaygroundActive={false}
          isFocusMode={false}
        />
      )}

      {/* Sidebar Mobile */}
      {isMobile && (
        <Sidebar
          activeView={user ? 'my-library' : 'public-library'}
          onViewChange={(view) => { handleViewChange(view); setMobileSidebarOpen(false); }}
          onNewPrompt={() => { handleNewPrompt(); setMobileSidebarOpen(false); }}
          onLogout={handleLogout}
          onLogin={() => { handleLogin(); setMobileSidebarOpen(false); }}
          user={user}
          isPlaygroundActive={false}
          isFocusMode={false}
          mobileSidebarOpen={mobileSidebarOpen}
          setMobileSidebarOpen={setMobileSidebarOpen}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <SEO title={pageTitle} description={t('library:tagPageDescription', { tag: tagName })} tags={[tagName]} />

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
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm font-mono">{t('common:status.loadingTagPrompts')}</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
              <Hash className="w-12 h-12 mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2 font-mono">{t('library:problemOccurred')}</h3>
              <p className="text-sm text-center mb-4">{error}</p>
              <div className="flex items-center gap-2">
                <Button variant="default" onClick={loadData} className="touch-manipulation">{t('common:buttons.tryAgain')}</Button>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 p-3 sm:p-4 md:p-6">
              {prompts.map((prompt) => (
                <div
                  key={prompt.id}
                  onClick={() => handleCardClick(prompt)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCardClick(prompt);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={t('library:openDetails', { title: prompt.title || t('prompt:untitled') })}
                  className={`group relative bg-card border rounded-lg p-4 sm:p-6 transition-all duration-200 hover:shadow-lg hover:border-primary/50 touch-manipulation hover:bg-accent/10 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: prompt.color || '#10b981' }}
                      />
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex items-center gap-2">
                      {prompt.is_public ? (
                        <div className="flex items-center gap-1 text-primary">
                          <Globe className="w-4 h-4" />
                          <span className="text-xs font-mono">{t('common:labels.public')}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Lock className="w-4 h-4" />
                          <span className="text-xs font-mono">{t('common:labels.private')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="font-bold text-lg mb-2 line-clamp-2 font-mono group-hover:text-primary transition-colors">
                    {prompt.title || t('prompt:untitled')}
                  </h3>

                  {prompt.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3 font-mono leading-relaxed">
                      {prompt.description}
                    </p>
                  )}

                  {prompt.tags && prompt.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {prompt.tags.slice(0, 3).map(tag => (
                        <Link key={tag.id} to={`/tags/${encodeURIComponent(tag.name)}`}>
                          <Badge
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
                        </Link>
                      ))}
                      {prompt.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs font-mono">
                          +{prompt.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <div className="text-xs text-muted-foreground font-mono">
                      <div>{t('prompt:model')}: {prompt.model || t('library:unknownModel')}</div>
                      <div>{prompt.is_featured ? t('common:labels.featured') : t('common:labels.standard')}</div>
                    </div>

                    {/* Tombol aksi seperti di PublicLibrary */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleCopyUrl(e, prompt.id)}
                        className="h-8 w-8 p-0 hover:bg-primary/20"
                        title={t('library:copyUrl')}
                        aria-label={t('library:copyUrl')}
                      >
                        <LinkIcon className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleCopy(e, prompt)}
                        className="h-8 w-8 p-0 hover:bg-primary/20"
                        title={t('library:copyContentToClipboard')}
                        aria-label={t('library:copyContentToClipboard')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleUse(e, prompt)}
                        className="h-8 w-8 p-0 hover:bg-primary/20"
                        title={t('library:useThisPrompt')}
                        aria-label={t('library:useThisPrompt')}
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                      <Link
                        to={`/p/${prompt.id}`}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={t('library:viewDetails', { title: prompt.title || t('prompt:untitled') })}
                        className="text-xs font-mono px-2 py-1 rounded hover:bg-primary/20"
                      >
                        {t('common:buttons.view')}
                      </Link>
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
    </div>
  );
};

export default TagPage;