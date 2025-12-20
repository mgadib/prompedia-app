import { Link } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

interface HeaderProps {
    variant?: 'default' | 'authenticated' | 'public';
    userEmail?: string | null;
    onLogout?: () => void;
}

export const Header = ({ variant = 'default', userEmail, onLogout }: HeaderProps) => {
    const { t, i18n } = useTranslation();
    const { theme, setTheme } = useTheme();

    return (
        <header className="border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-40 shadow-xs">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                {/* Brand Section */}
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="relative">
                        <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain transition-transform duration-normal group-hover:scale-105" />
                        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-normal" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-sm font-bold text-foreground tracking-tight leading-none hidden sm:block">
                            Personal Prompt Notes
                        </h1>
                        <span className="text-2xs text-muted-foreground/60 uppercase tracking-widest font-medium hidden sm:block">
                            by kerjabaik
                        </span>
                    </div>
                </Link>

                {/* Actions Section */}
                <div className="flex items-center gap-2 sm:gap-4">
                    {/* Language Toggle */}
                    <button
                        onClick={() => i18n.changeLanguage(i18n.resolvedLanguage === 'id' ? 'en' : 'id')}
                        className="h-8 w-8 flex items-center justify-center text-2xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-secondary/80 rounded-sm transition-all duration-normal"
                        title={i18n.resolvedLanguage === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
                    >
                        {i18n.resolvedLanguage?.toUpperCase()}
                    </button>

                    {/* Theme Toggle */}
                    <button
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 rounded-sm transition-all duration-normal"
                        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    </button>

                    {/* Authenticated User Info */}
                    {variant === 'authenticated' && userEmail && (
                        <>
                            <div className="hidden sm:flex items-center gap-4 pl-2 border-l border-border">
                                <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                                    {userEmail}
                                </span>
                                <button
                                    onClick={onLogout}
                                    className="text-xs text-muted-foreground hover:text-primary transition-colors duration-normal font-medium"
                                >
                                    {t('auth.logout')}
                                </button>
                            </div>
                        </>
                    )}

                    {/* Public View CTA */}
                    {variant === 'public' && (
                        <Button variant="brand" size="sm" asChild className="text-xs font-semibold">
                            <Link to="/">
                                {t('public_view.open_app')}
                            </Link>
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
};
