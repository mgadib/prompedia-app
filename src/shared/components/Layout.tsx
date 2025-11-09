import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { clearUser, clearCurrentPrompt } from '@/lib/storage';
import { toast } from '@/shared/utils/toast';
import { getSuccessMessage, getErrorMessage } from '@/lib/i18n-helpers';
import { supabase } from '@/integrations/supabase/client';
import Sidebar from './Sidebar';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { useAuthState } from '@/shared/hooks/useAuthState';

const Layout: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Use extracted auth hook
  const { user, isInitializing } = useAuthState();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [appActiveView, setAppActiveView] = useState<'my-library' | 'public-library' | null>(null);
  const [appIsPlaygroundActive, setAppIsPlaygroundActive] = useState<boolean | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Reset app state saat route berubah dari home ke tag page atau sebaliknya
  useEffect(() => {
    // Reset state saat navigate ke tag page (karena state hanya digunakan di home)
    if (location.pathname.startsWith('/tags/')) {
      setAppActiveView(null);
      setAppIsPlaygroundActive(null);
    }
    // State akan di-set lagi oleh AppPage saat kembali ke home
  }, [location.pathname]);

  // Determine active view and playground state based on location and app state
  const currentActiveView = useCallback(() => {
    // Jika ada appActiveView dari AppPage, gunakan itu
    if (appActiveView !== null && location.pathname === '/') {
      return appActiveView;
    }
    if (location.pathname.startsWith('/tags/')) {
      return user ? 'my-library' : 'public-library';
    }
    // Default untuk home page
    return 'public-library';
  }, [location.pathname, user, appActiveView]);

  const isPlaygroundActive = useCallback(() => {
    // Gunakan hanya appIsPlaygroundActive state, default ke false jika null
    // Hapus fallback ke pathname untuk konsistensi dengan state management
    if (appIsPlaygroundActive !== null) {
      return appIsPlaygroundActive;
    }
    // Default ke false jika null (library view)
    return false;
  }, [appIsPlaygroundActive]);

  const handleViewChange = useCallback((view: 'my-library' | 'public-library') => {
    if (view === 'my-library' && !user) {
      // Will be handled by AppPage
      return;
    }
    // Always update state untuk sync dengan AppPage, bahkan jika view sudah sama
    // Ini memastikan playground selalu ditutup saat switch ke library view
    setAppActiveView(view);
    setAppIsPlaygroundActive(false);
    // Navigate ke home jika belum di home
    if (location.pathname !== '/') {
      navigate('/');
    }
  }, [user, navigate, location.pathname]);

  const handleNewPrompt = useCallback(() => {
    // Set playground state ke true untuk membuka playground
    setAppIsPlaygroundActive(true);
    // Reset appActiveView karena playground bukan library view
    setAppActiveView(null);
    // Navigate ke home jika belum di home
    if (location.pathname !== '/') {
      navigate('/');
    }
  }, [navigate, location.pathname]);

  const handleLogout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        toast.error(getErrorMessage('auth.logoutFailed'));
        return;
      }
      
      // Clear user data from local storage
      clearUser();
      
      // Clear current prompt from storage
      clearCurrentPrompt();
      
      // Reset app state
      setAppActiveView(null);
      setAppIsPlaygroundActive(null);
      
      // Show success message
      toast.success(getSuccessMessage('auth.logoutSuccess'));
      
      // Navigate to home if not already there
      if (location.pathname !== '/') {
        navigate('/');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error(getErrorMessage('auth.logoutFailed'));
    }
  }, [navigate, location.pathname]);

  const handleLogin = useCallback(() => {
    // Navigate to home if not already there
    if (location.pathname !== '/') {
      navigate('/');
    }
    // Open auth modal
    setShowAuthModal(true);
    // Close mobile sidebar if open
    if (isMobile) {
      setMobileSidebarOpen(false);
    }
  }, [navigate, location.pathname, isMobile]);

  // Don't render until auth is initialized to prevent flicker
  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-primary/20 rounded-full" />
            <div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground font-mono">{t('common:loadingPrompedia')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar - Persistent, tidak unmount */}
      {!isMobile && (
        <div className="hidden md:block">
          <Sidebar
            activeView={currentActiveView()}
            onViewChange={handleViewChange}
            onNewPrompt={handleNewPrompt}
            onLogout={handleLogout}
            onLogin={handleLogin}
            user={user}
            isPlaygroundActive={isPlaygroundActive()}
            isFocusMode={false}
          />
        </div>
      )}

      {/* Mobile Sidebar - Persistent, tidak unmount */}
      {isMobile && (
        <Sidebar
          activeView={currentActiveView()}
          onViewChange={(view) => {
            handleViewChange(view);
            setMobileSidebarOpen(false);
          }}
          onNewPrompt={() => {
            handleNewPrompt();
            setMobileSidebarOpen(false);
          }}
          onLogout={handleLogout}
          onLogin={() => {
            handleLogin();
            setMobileSidebarOpen(false);
          }}
          user={user}
          isPlaygroundActive={isPlaygroundActive()}
          isFocusMode={false}
          mobileSidebarOpen={mobileSidebarOpen}
          setMobileSidebarOpen={setMobileSidebarOpen}
        />
      )}

      {/* Content Area - Berubah sesuai route tanpa unmount Sidebar */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Outlet context={{ 
          user, 
          setMobileSidebarOpen, 
          mobileSidebarOpen,
          setAppActiveView,
          setAppIsPlaygroundActive,
          activeView: currentActiveView(),
          appActiveView,
          appIsPlaygroundActive,
          isPlaygroundActive: isPlaygroundActive(),
          showAuthModal,
          setShowAuthModal
        }} />
      </div>
    </div>
  );
};

export default React.memo(Layout);

