import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, User, LogOut, Lock, Users, Hash, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import LogoutDialog from './LogoutDialog';
import { TagService } from '@/lib/tag-service';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    const loadUserMostUsedTags = async () => {
      setIsLoadingTags(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Get user's most frequently used tags (exactly 7)
          const userTags = await TagService.getUserMostUsedTags(user.id, 7);
          const tagNames = userTags.map(tag => tag.name);
          setAllTags(tagNames);
        } else {
          setAllTags([]);
        }
      } catch (error) {
        console.error('Failed to load user most used tags:', error);
        setAllTags([]);
      } finally {
        setIsLoadingTags(false);
      }
    };

    loadUserMostUsedTags();
  }, [user]);

  const sidebarContent = (
    <div className={`h-full bg-sidebar-background flex flex-col ${
      !isMobile && (isFocusMode 
        ? 'w-0 overflow-hidden opacity-0' 
        : isCollapsed ? 'w-16' : 'w-64')
    } ${!isMobile && 'border-r border-sidebar-border'} transition-all duration-300 ease-in-out relative`}>

      {/* Logo Section */}
      <div className={`border-b border-sidebar-border ${isMobile ? 'p-4' : 'p-6'}`}>
        {(!isCollapsed || isMobile) ? (
          <>
            <h1 className="prompedia-logo">Prompedia.app</h1>
            <p className="text-xs text-muted-foreground mt-1 font-mono">Prompt Engineering Lab</p>
          </>
        ) : (
          <div className="flex justify-center">
            <div className="w-10 h-10 bg-gradient-to-br from-prompedia-green-500 to-prompedia-green-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg">P</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className={`flex-1 space-y-1 overflow-y-auto ${isMobile ? 'p-3' : 'p-4'}`}>
        <div className="mb-4">
          {/* Playground Button */}
          {onNewPrompt && (
            <button
              onClick={onNewPrompt}
              className={`w-full flex items-center ${isMobile || isCollapsed ? 'justify-center' : 'gap-3'} ${isMobile ? 'px-4 py-4 min-h-[44px]' : 'px-3 py-3'} rounded-lg text-sm transition-all duration-200 font-mono mb-2 group touch-manipulation ${
                isPlaygroundActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-md'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/20 hover:text-sidebar-accent-foreground hover:shadow-sm'
              }`}
              title={isMobile || isCollapsed ? 'Playground' : ''}
            >
              <Play className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} ${isPlaygroundActive ? '' : 'group-hover:scale-110'} transition-transform`} />
              {!isMobile && !isCollapsed && 'Playground'}
            </button>
          )}
          
          {/* Private Library - Only for authenticated users */}
          {user && (
            <button
              onClick={() => onViewChange('my-library')}
              className={`w-full flex items-center ${isMobile || isCollapsed ? 'justify-center' : 'gap-3'} ${isMobile ? 'px-4 py-4 min-h-[44px]' : 'px-3 py-3'} rounded-lg text-sm transition-all duration-200 font-mono group touch-manipulation ${
                activeView === 'my-library' && !isPlaygroundActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-md'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/20 hover:text-sidebar-accent-foreground hover:shadow-sm'
              }`}
              title={isMobile || isCollapsed ? 'Private Library' : ''}
            >
              <Lock className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} ${activeView === 'my-library' && !isPlaygroundActive ? '' : 'group-hover:scale-110'} transition-transform`} />
              {!isMobile && !isCollapsed && 'Private Library'}
            </button>
          )}

          <button
            onClick={() => onViewChange('public-library')}
            className={`w-full flex items-center ${isMobile || isCollapsed ? 'justify-center' : 'gap-3'} ${isMobile ? 'px-4 py-4 min-h-[44px]' : 'px-3 py-3'} rounded-lg text-sm transition-all duration-200 font-mono group touch-manipulation ${
              activeView === 'public-library' && !isPlaygroundActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-md'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/20 hover:text-sidebar-accent-foreground hover:shadow-sm'
            }`}
            title={isMobile || isCollapsed ? 'Public Library' : ''}
          >
            <Users className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} ${activeView === 'public-library' && !isPlaygroundActive ? '' : 'group-hover:scale-110'} transition-transform`} />
            {!isMobile && !isCollapsed && 'Public Library'}
          </button>
        </div>

        {/* Tags Section - Show on mobile, hide when collapsed on desktop */}
        {(!isCollapsed || isMobile) && (
          <div className="mt-6">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 font-mono">
              Most Used Tags
            </h3>
            {isLoadingTags ? (
              <div className="space-y-1">
                {[...Array(7)].map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md animate-pulse"
                  >
                    <div className="w-3 h-3 bg-muted-foreground/20 rounded-full" />
                    <div className="h-3 bg-muted-foreground/20 rounded w-16" />
                  </div>
                ))}
              </div>
            ) : allTags.length > 0 ? (
              <div className="space-y-1">
                {allTags.map(tag => (
                  <div
                    key={tag}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-sidebar-foreground hover:bg-sidebar-accent/10 hover:text-sidebar-accent-foreground rounded-lg transition-all duration-200 cursor-pointer font-mono group"
                  >
                    <Hash className="w-3 h-3 text-prompedia-green-400 group-hover:scale-110 transition-transform" />
                    <span className="truncate">{tag}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </nav>

      {/* User Profile Section */}
      <div className={`border-t border-sidebar-border space-y-2 ${isMobile ? 'p-3' : 'p-4'}`}>
        {user ? (
          // Logged in user
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
                title={user.email || 'User'}
              >
                <User className="w-4 h-4 text-sidebar-accent-foreground" />
              </div>


              <LogoutDialog
                onConfirm={onLogout}
                isCollapsed={true}
              />
            </div>
          )
        ) : (
          // Guest user
          !isCollapsed ? (
            <>
              
              <button
                onClick={onLogin}
                className={`w-full flex items-center justify-center gap-2 ${isMobile ? 'px-4 py-4 min-h-[44px]' : 'px-3 py-3'} rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md transition-all duration-200 font-mono group touch-manipulation`}
              >
                <User className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} group-hover:scale-110 transition-transform`} />
                Sign In
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={onLogin}
                className={`${isMobile ? 'w-11 h-11' : 'w-9 h-9'} flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md transition-all duration-200 group touch-manipulation`}
                title="Sign In"
              >
                <User className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} group-hover:scale-110 transition-transform`} />
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );

  // Mobile: Render as Sheet
  if (isMobile) {
    return (
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="w-80 p-0 bg-sidebar-background border-sidebar-border">
          {sidebarContent}
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Render as fixed sidebar
  return sidebarContent;
};

export default Sidebar;
