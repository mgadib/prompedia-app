import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Play, User, LogOut, Lock, Users, Hash, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { User as SupabaseUser } from '@supabase/supabase-js';
import LogoutDialog from '@/features/auth/components/LogoutDialog';
import LanguageSwitcher from './LanguageSwitcher';
import { TagService } from '@/features/tags/services/tag-service';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { Sheet, SheetContent } from '@/components/ui/sheet';

interface SidebarProps {
  activeView: 'my-library' | 'public-library';
  onViewChange: (view: 'my-library' | 'public-library') => void;
  onNewPrompt?: () => void;
  onLogout: () => void;
  onLogin: () => void;
  user: SupabaseUser | null;
  isPlaygroundActive?: boolean;
  isFocusMode?: boolean;
  mobileSidebarOpen?: boolean;
  setMobileSidebarOpen?: (open: boolean) => void;
}

const Sidebar = ({
  activeView,
  onViewChange,
  onNewPrompt,
  onLogout,
  onLogin,
  user,
  isPlaygroundActive,
  isFocusMode = false,
  mobileSidebarOpen,
  setMobileSidebarOpen
}: SidebarProps) => {
  // Preload required namespaces: library, auth, and common
  const { t, i18n } = useTranslation(['library', 'auth', 'common']);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [allTags, setAllTags] = useState<string[]>([]);
  const isMobile = useIsMobile();
  const location = useLocation();
  
  // Ensure namespaces are loaded and reload when language changes
  useEffect(() => {
    const loadNamespaces = async () => {
      const currentLang = i18n.language || 'en';
      const namespaces = ['library', 'auth'];
      
      for (const ns of namespaces) {
        if (!i18n.hasResourceBundle(currentLang, ns)) {
          await i18n.loadNamespaces(ns);
        }
      }
    };
    
    loadNamespaces();
  }, [i18n, i18n.language]); // Add i18n.language to dependency to trigger reload on language change
  
  // Mengecek apakah kita berada di halaman tag
  const isOnTagPage = location.pathname.startsWith('/tags/');
  const activeTag = isOnTagPage ? decodeURIComponent(location.pathname.split('/tags/')[1]) : null;

  useEffect(() => {
    const loadUserMostUsedTags = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Mendapatkan tag yang paling sering digunakan user (tepat 7)
          const userTags = await TagService.getUserMostUsedTags(user.id, 7);
          const tagNames = userTags.map(tag => tag.name);
          setAllTags(tagNames);
        } else {
          setAllTags([]);
        }
      } catch (error) {
        console.error('Failed to load user most used tags:', error);
        setAllTags([]);
      }
    };

    loadUserMostUsedTags();
  }, [user]);

  const sidebarContent = (
    <div className={`h-full bg-sidebar-background flex flex-col ${
      !isMobile && (isFocusMode 
        ? 'w-0 overflow-hidden opacity-0' 
        : isCollapsed ? 'w-16' : 'w-64')
    } ${!isMobile && 'border-r border-sidebar-border'} relative`}>

      {/* Bagian Logo */}
      <div className={`border-b border-sidebar-border ${isMobile ? 'p-4' : 'p-6'}`}>
        {(!isCollapsed || isMobile) ? (
          <>
            <h1 className="prompedia-logo">{t('common:app.name')}</h1>
            <p className="text-xs text-muted-foreground mt-1 font-mono">{t('common:app.tagline')}</p>
          </>
        ) : (
          <div className="flex justify-center">
            <div className="w-10 h-10 bg-gradient-to-br from-prompedia-green-500 to-prompedia-green-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg">P</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigasi Utama */}
      <nav className={`flex-1 space-y-0.5 overflow-y-auto ${isMobile ? 'p-3' : 'p-4'}`}>
        <div className="mb-2 space-y-0.5">
          {/* Tombol Playground */}
          {onNewPrompt && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onNewPrompt();
              }}
              className={`w-full flex items-center ${isMobile || isCollapsed ? 'justify-center' : 'gap-3'} ${isMobile ? 'px-4 py-3 min-h-[44px]' : 'px-3 py-2'} rounded-lg text-sm transition-smooth font-mono group touch-manipulation ${
                isPlaygroundActive && !isOnTagPage
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-md font-semibold'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/20 hover:text-sidebar-accent-foreground hover:shadow-sm'
              }`}
              title={isMobile || isCollapsed ? t('library:playground') : ''}
              aria-label={t('library:playground')}
            >
              <Play className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} ${isPlaygroundActive && !isOnTagPage ? 'fill-current' : ''}`} />
              {!isMobile && !isCollapsed && t('library:playground')}
            </button>
          )}
          
          {/* Private Library - Only for authenticated users */}
          {user && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onViewChange('my-library');
              }}
              className={`w-full flex items-center ${isMobile || isCollapsed ? 'justify-center' : 'gap-3'} ${isMobile ? 'px-4 py-3 min-h-[44px]' : 'px-3 py-2'} rounded-lg text-sm transition-smooth font-mono group touch-manipulation ${
                activeView === 'my-library' && !isPlaygroundActive && !isOnTagPage
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-md font-semibold'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/20 hover:text-sidebar-accent-foreground hover:shadow-sm'
              }`}
              title={isMobile || isCollapsed ? t('library:privateLibrary') : ''}
              aria-label={t('library:privateLibrary')}
            >
              <Lock className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} ${activeView === 'my-library' && !isPlaygroundActive && !isOnTagPage ? 'fill-current' : ''}`} />
              {!isMobile && !isCollapsed && t('library:privateLibrary')}
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onViewChange('public-library');
            }}
            className={`w-full flex items-center ${isMobile || isCollapsed ? 'justify-center' : 'gap-3'} ${isMobile ? 'px-4 py-3 min-h-[44px]' : 'px-3 py-2'} rounded-lg text-sm transition-smooth font-mono group touch-manipulation ${
              activeView === 'public-library' && !isPlaygroundActive && !isOnTagPage
                ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-md font-semibold'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/20 hover:text-sidebar-accent-foreground hover:shadow-sm'
            }`}
            title={isMobile || isCollapsed ? t('library:publicLibrary') : ''}
            aria-label={t('library:publicLibrary')}
          >
            <Users className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} ${activeView === 'public-library' && !isPlaygroundActive && !isOnTagPage ? 'fill-current' : ''}`} />
            {!isMobile && !isCollapsed && t('library:publicLibrary')}
          </button>
        </div>

        {/* Tags Section - Show on mobile, hide when collapsed on desktop */}
        {(!isCollapsed || isMobile) && allTags.length > 0 && (
          <div className="mt-3 space-y-0.5">
            {allTags.map(tag => {
              const isActiveTag = activeTag === tag;
              return (
                <Link
                  key={tag}
                  to={`/tags/${encodeURIComponent(tag)}`}
                  className={`w-full flex items-center ${isMobile || isCollapsed ? 'justify-center' : 'gap-3'} ${isMobile ? 'px-4 py-3 min-h-[44px]' : 'px-3 py-2'} rounded-lg text-sm transition-smooth font-mono group touch-manipulation ${
                    isActiveTag
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-md font-semibold'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/20 hover:text-sidebar-accent-foreground hover:shadow-sm'
                  }`}
                  title={isMobile || isCollapsed ? tag : ''}
                  aria-label={tag}
                >
                  <Hash className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} text-prompedia-green-400`} />
                  {!isMobile && !isCollapsed && <span className="truncate">{tag}</span>}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* Bagian Profil User */}
      <div className={`border-t border-sidebar-border space-y-2 ${isMobile ? 'p-3' : 'p-4'}`}>
        {user ? (
          // User yang sudah login
          (!isCollapsed || isMobile) ? (
            <>
              <div className="flex items-center gap-3 px-3 py-3 text-sm text-sidebar-foreground bg-sidebar-accent/10 rounded-lg">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sidebar-accent to-sidebar-accent/80 flex items-center justify-center shadow-sm">
                  <User className="w-4 h-4 text-sidebar-accent-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate font-mono">
                    {user.user_metadata?.username || user.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {user.email}
                  </p>
                </div>
              </div>


              <LanguageSwitcher isCollapsed={false} />
              <LogoutDialog
                userName={user.user_metadata?.username || user.email?.split('@')[0]}
                onConfirm={onLogout}
                isCollapsed={false}
              />
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-9 h-9 rounded-full bg-gradient-to-br from-sidebar-accent to-sidebar-accent/80 flex items-center justify-center shadow-sm"
                title={user.email || t('common:user')}
              >
                <User className="w-4 h-4 text-sidebar-accent-foreground" />
              </div>


              <LanguageSwitcher isCollapsed={true} />
              <LogoutDialog
                onConfirm={onLogout}
                isCollapsed={true}
              />
            </div>
          )
        ) : (
          // User guest
          !isCollapsed ? (
            <>
              <LanguageSwitcher isCollapsed={false} />
              <button
                onClick={onLogin}
                className={`w-full flex items-center justify-center gap-2 ${isMobile ? 'px-4 py-4 min-h-[44px]' : 'px-3 py-3'} rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md transition-smooth font-mono group touch-manipulation`}
                aria-label={t('auth:signIn')}
              >
                <User className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
                {t('auth:signIn')}
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <LanguageSwitcher isCollapsed={true} />
              <button
                onClick={onLogin}
                className={`${isMobile ? 'w-11 h-11' : 'w-9 h-9'} flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md transition-smooth group touch-manipulation`}
                title={t('auth:signIn')}
                aria-label={t('auth:signIn')}
              >
                <User className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );

  // Mobile: Render sebagai Sheet
  if (isMobile) {
    return (
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent 
          side="left" 
          className="w-80 p-0 bg-sidebar-background/100 border-sidebar-border backdrop-blur-none"
        >
          {sidebarContent}
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Render sebagai sidebar tetap
  return sidebarContent;
};

export default React.memo(Sidebar);
