import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const Footer = () => {
    const { t } = useTranslation();
    return (
        <footer className="border-t border-border bg-card/95 backdrop-blur-sm mt-auto py-6 sm:py-8 shadow-sm">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                {/* Navigation Links */}
                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-6 pb-6 border-b border-border">
                    <Link 
                        to="/" 
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-fast ease-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-sm px-1"
                    >
                        {t('footer.links.home')}
                    </Link>
                    <Link 
                        to="/about" 
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-fast ease-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-sm px-1"
                    >
                        {t('footer.links.about')}
                    </Link>
                    <Link 
                        to="/faq" 
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-fast ease-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-sm px-1"
                    >
                        {t('footer.links.faq')}
                    </Link>
                    <Link 
                        to="/use-cases" 
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-fast ease-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-sm px-1"
                    >
                        {t('footer.links.use_cases')}
                    </Link>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-4 sm:gap-6">
                    {/* Made with love section */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-normal">{t('footer.made_with')}</span>
                        <Heart className="w-4 h-4 text-primary fill-primary transition-transform duration-fast hover:scale-110" aria-hidden="true" />
                        <span className="font-normal">{t('footer.for_community')}</span>
                    </div>

                    {/* Divider - hidden on mobile */}
                    <span className="hidden sm:block w-px h-4 bg-border" />

                    {/* Copyright section */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-normal">&copy; 2026</span>
                        <a
                            href="https://kerjabaik.ai/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-foreground hover:text-primary transition-colors duration-fast ease-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-sm px-1"
                            aria-label="Visit Kerjabaik.Ai website"
                        >
                            Kerjabaik.Ai
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
