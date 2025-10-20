import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { storage } from '@/lib/storage';
import { toast } from 'sonner';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

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
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-6 bg-card border border-border rounded-sm">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-primary">Prompedia.app</h1>
          <p className="text-sm text-muted-foreground">
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>

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
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
