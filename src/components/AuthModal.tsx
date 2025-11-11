import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Sparkles, Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { getSuccessMessage, getErrorMessage } from '@/lib/i18n-helpers';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AuthModal = ({ isOpen, onClose, onSuccess }: AuthModalProps) => {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const isMobile = useIsMobile();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Login user
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast.success(t('auth:welcomeBack'));
        onSuccess();
        onClose();
      } else {
        // Registrasi user baru
        if (!username.trim()) {
          toast.error(t('auth:usernameRequired'));
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username.trim(),
              display_name: username.trim(),
            },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) throw error;

        toast.success(t('auth:accountCreated'));
        setIsLogin(true);
      }
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('Auth error:', error);
      }
      toast.error(error.message || t('auth:anErrorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isMobile ? 'max-w-[calc(100vw-2rem)] mx-4' : 'sm:max-w-md'} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <div className={`flex items-center justify-center gap-2 ${isMobile ? 'mb-3' : 'mb-4'}`}>
            <Sparkles className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-primary`} />
            <DialogTitle className={`${isMobile ? 'text-xl' : 'text-2xl'} font-mono`}>
              {isLogin ? t('auth:signIn') : t('auth:createAccount')}
            </DialogTitle>
          </div>
          <DialogDescription className={`font-mono text-center ${isMobile ? 'text-sm' : ''}`}>
            {isLogin
              ? t('auth:enterCredentials')
              : t('auth:joinPrompedia')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAuth} className={`space-y-4 ${isMobile ? 'mt-3' : 'mt-4'}`}>
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="username" className="font-mono">
                {t('auth:username')}
              </Label>
              <Input
                id="username"
                type="text"
                placeholder={t('common:placeholders.enterUsername')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required={!isLogin}
                className="font-mono"
                disabled={loading}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="font-mono">
              {t('auth:email')}
            </Label>
            <Input
              id="email"
              type="email"
              placeholder={t('common:placeholders.enterEmail')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="font-mono"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="font-mono">
              {t('auth:password')}
            </Label>
            <Input
              id="password"
              type="password"
              placeholder={t('common:placeholders.enterPassword')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="font-mono"
              disabled={loading}
            />
            {!isLogin && (
              <p className="text-xs text-muted-foreground font-mono">
                {t('auth:minimumCharacters')}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className={`w-full font-mono touch-manipulation ${isMobile ? 'min-h-[44px] text-base' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className={`${isMobile ? 'mr-2 h-5 w-5' : 'mr-2 h-4 w-4'} animate-spin`} />
                {t('auth:processing')}
              </>
            ) : isLogin ? (
              t('auth:signIn')
            ) : (
              t('auth:createAccount')
            )}
          </Button>
        </form>

        <div className={`${isMobile ? 'mt-3' : 'mt-4'} text-center`}>
          <button
            onClick={() => setIsLogin(!isLogin)}
            className={`${isMobile ? 'text-base min-h-[44px] py-2' : 'text-sm'} text-primary hover:underline font-mono touch-manipulation`}
            disabled={loading}
          >
            {isLogin
              ? t('auth:dontHaveAccount')
              : t('auth:alreadyHaveAccount')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
