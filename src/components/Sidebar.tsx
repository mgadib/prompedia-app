import { Home, Library, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { storage } from '@/lib/storage';
import { toast } from 'sonner';

interface SidebarProps {
  activeView: 'my-library' | 'public-library';
  onViewChange: (view: 'my-library' | 'public-library') => void;
}

const Sidebar = ({ activeView, onViewChange }: SidebarProps) => {
  const navigate = useNavigate();
  const user = storage.getUser();

  const handleLogout = () => {
    storage.clearUser();
    toast.success('Logged out successfully');
    navigate('/auth');
  };

  return (
    <div className="w-64 h-screen bg-sidebar-background border-r border-sidebar-border flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-lg font-bold text-primary">Prompedia.app</h1>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <button
          onClick={() => onViewChange('my-library')}
          className={`w-full flex items-center gap-3 px-4 py-2 rounded-sm text-sm transition-colors ${
            activeView === 'my-library'
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
          }`}
        >
          <Home className="w-4 h-4" />
          My Library
        </button>

        <button
          onClick={() => onViewChange('public-library')}
          className={`w-full flex items-center gap-3 px-4 py-2 rounded-sm text-sm transition-colors ${
            activeView === 'public-library'
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
          }`}
        >
          <Library className="w-4 h-4" />
          Public Library
        </button>
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-2">
        <div className="flex items-center gap-3 px-4 py-2 text-sm text-sidebar-foreground">
          <User className="w-4 h-4" />
          <span className="truncate">{user?.username}</span>
        </div>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-sm text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
