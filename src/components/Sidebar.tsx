import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, User, LogOut, Lock, Users, Hash } from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import LogoutDialog from './LogoutDialog';
import { TagService } from '@/lib/tag-service';
import { supabase } from '@/integrations/supabase/client';

interface SidebarProps {
  activeView: 'my-library' | 'public-library';
  onViewChange: (view: 'my-library' | 'public-library') => void;
  onNewPrompt?: () => void;
  onLogout: () => void;
  onLogin: () => void;
  user: SupabaseUser | null;
  isPlaygroundActive?: boolean;
}

const Sidebar = ({
  activeView,
  onViewChange,
  onNewPrompt,
  onLogout,
  onLogin,
  user,
  isPlaygroundActive
}: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(true);

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

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} h-screen bg-sidebar-background border-r border-sidebar-border flex flex-col transition-all duration-300 ease-in-out relative`}>
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 z-10 w-6 h-6 bg-sidebar-background border border-sidebar-border rounded-full flex items-center justify-center hover:bg-sidebar-accent/20 transition-colors"
      >
        {isCollapsed ? (
          <ChevronRight className="w-3 h-3 text-sidebar-foreground" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-sidebar-foreground" />
        )}
      </button>

      {/* Logo Section */}
      <div className="p-6 border-b border-sidebar-border">
        {!isCollapsed ? (
          <>
            <h1 className="prompedia-logo">Prompedia.app</h1>
            <p className="text-xs text-muted-foreground mt-1 font-mono">Prompt Engineering Lab</p>
          </>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 bg-prompedia-green-500 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="mb-4">
          {/* Playground Button */}
          {onNewPrompt && (
            <button
              onClick={onNewPrompt}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-md text-sm transition-all duration-200 font-mono mb-2 ${
                isPlaygroundActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/20 hover:text-sidebar-accent-foreground'
              }`}
              title={isCollapsed ? 'Playground' : ''}
            >
              <Play className="w-4 h-4" />
              {!isCollapsed && 'Playground'}
            </button>
          )}
          
          {/* Private Library - Only for authenticated users */}
          {user && (
            <button
              onClick={() => onViewChange('my-library')}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-md text-sm transition-all duration-200 font-mono ${
                activeView === 'my-library' && !isPlaygroundActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/20 hover:text-sidebar-accent-foreground'
              }`}
              title={isCollapsed ? 'Private Library' : ''}
            >
              <Lock className="w-4 h-4" />
              {!isCollapsed && 'Private Library'}
            </button>
          )}

          <button
            onClick={() => onViewChange('public-library')}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-md text-sm transition-all duration-200 font-mono ${
              activeView === 'public-library' && !isPlaygroundActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/20 hover:text-sidebar-accent-foreground'
            }`}
            title={isCollapsed ? 'Public Library' : ''}
          >
            <Users className="w-4 h-4" />
            {!isCollapsed && 'Public Library'}
          </button>
        </div>

        {/* Tags Section */}
        {!isCollapsed && (
          <div className="mt-6">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 font-mono">
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
                    className="flex items-center gap-2 px-3 py-1.5 text-xs text-sidebar-foreground hover:bg-sidebar-accent/10 rounded-md transition-colors cursor-pointer font-mono"
                  >
                    <Hash className="w-3 h-3 text-prompedia-green-400" />
                    <span className="truncate">{tag}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        {user ? (
          // Logged in user
          !isCollapsed ? (
            <>
              <div className="flex items-center gap-3 px-3 py-2 text-sm text-sidebar-foreground bg-sidebar-accent/10 rounded-md">
                <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center">
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
              />
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center"
                title={user.email || 'User'}
              >
                <User className="w-4 h-4 text-sidebar-accent-foreground" />
              </div>


              <LogoutDialog
                onConfirm={onLogout}
              />
            </div>
          )
        ) : (
          // Guest user
          !isCollapsed ? (
            <>
              
              <button
                onClick={onLogin}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 font-mono"
              >
                <User className="w-4 h-4" />
                Sign In
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={onLogin}
                className="w-8 h-8 flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200"
                title="Sign In"
              >
                <User className="w-4 h-4" />
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Sidebar;
