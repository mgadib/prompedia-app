import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { storage } from '@/lib/storage';
import { toast } from 'sonner';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}

const AuthModal = ({ isOpen, onClose, onAuthSuccess }: AuthModalProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || (!isLogin && !username)) {
      toast.error('Please fill in all fields');
      return;
    }

    const user = {
      id: crypto.randomUUID(),
      email,
      username: isLogin ? email.split('@')[0] : username,
    };

    storage.setUser(user);
    toast.success(isLogin ? 'Welcome back!' : 'Account created successfully!');
    
    // Reset form
    setEmail('');
    setUsername('');
    setPassword('');
    
    onAuthSuccess();
    onClose();
  };

  const handleClose = () => {
    // Reset form when closing
    setEmail('');
    setUsername('');
    setPassword('');
    setIsLogin(true);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {isLogin ? 'Sign In' : 'Create Account'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Username</label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="johndoe"
                className="bg-secondary border-border"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-secondary border-border"
            />
          </div>

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
            {isLogin ? 'Sign In' : 'Sign Up'}
          </Button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;