import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Hash, User, LogOut, Home, Library, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { storage, Prompt } from '@/lib/storage';
import { toast } from 'sonner';
import AuthModal from './AuthModal';

interface SidebarProps {
  activeView: 'my-library' | 'public-library';
  onViewChange: (view: 'my-library' | 'public-library') => void;
}

const Sidebar = ({ activeView, onViewChange }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [user, setUser] = useState(storage.getUser());
  const [allTags, setAllTags] = useState<string[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const prompts = storage.getPrompts();
    const tags = Array.from(new Set(prompts.flatMap(p => p.tags)));
    setAllTags(tags);
  }, []);

  const handleLogout = () => {
    storage.clearUser();
    setUser(null);
    toast.success('Logged out successfully');
    // Stay on the current page instead of redirecting
  };

  const handleAuthSuccess = () => {
    setUser(storage.getUser());
  };

  const handleProfileClick = () => {
    if (user) {
      // If user is logged in, show user info or do nothing
      return;
    } else {
      // If user is not logged in, open auth modal
      setIsAuthModalOpen(true);
    }
  };

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
            <p className="text-xs text-muted-foreground mt-1 font-mono">AI Prompt Manager</p>
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
          {!isCollapsed && (
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 font-mono">
              Library
            </h3>
          )}
          
          <button
            onClick={() => onViewChange('my-library')}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-md text-sm transition-all duration-200 font-mono ${
              activeView === 'my-library'
                ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/20 hover:text-sidebar-accent-foreground'
            }`}
            title={isCollapsed ? 'My Library' : ''}
          >
            <Home className="w-4 h-4" />
            {!isCollapsed && 'My Library'}
          </button>

          <button
            onClick={() => onViewChange('public-library')}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-md text-sm transition-all duration-200 font-mono ${
              activeView === 'public-library'
                ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/20 hover:text-sidebar-accent-foreground'
            }`}
            title={isCollapsed ? 'Public Library' : ''}
          >
            <Library className="w-4 h-4" />
            {!isCollapsed && 'Public Library'}
          </button>
        </div>

        {/* Tags Section */}
        {!isCollapsed && allTags.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 font-mono">
              Tags
            </h3>
            <div className="space-y-1 max-h-48 overflow-y-auto">
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
          </div>
        )}
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        {!isCollapsed ? (
          <>
            <div 
              className="flex items-center gap-3 px-3 py-2 text-sm text-sidebar-foreground bg-sidebar-accent/10 rounded-md cursor-pointer hover:bg-sidebar-accent/20 transition-colors"
              onClick={handleProfileClick}
            >
              <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center">
                <User className="w-4 h-4 text-sidebar-accent-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate font-mono">{user?.username || 'Guest User'}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {user ? 'User Profile' : 'Click to login'}
                </p>
              </div>
            </div>
            
            {user && (
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-sidebar-foreground hover:bg-destructive/20 hover:text-destructive transition-all duration-200 font-mono"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div 
              className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center cursor-pointer hover:bg-sidebar-accent/80 transition-colors"
              onClick={handleProfileClick}
              title={user ? user.username : 'Click to login'}
            >
              <User className="w-4 h-4 text-sidebar-accent-foreground" />
            </div>
            {user && (
              <button
                onClick={handleLogout}
                className="w-8 h-8 flex items-center justify-center rounded-md text-sidebar-foreground hover:bg-destructive/20 hover:text-destructive transition-all duration-200"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Auth Modal */}
       <AuthModal 
         isOpen={isAuthModalOpen}
         onClose={() => setIsAuthModalOpen(false)}
         onAuthSuccess={handleAuthSuccess}
       />
    </div>
  );
};

export default Sidebar;
