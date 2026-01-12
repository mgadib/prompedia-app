import { Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Footer = () => {
    const { t } = useTranslation();
    const currentYear = new Date().getFullYear();

    return (
        <footer className="border-t border-border bg-card/95 backdrop-blur-sm mt-auto shadow-xs">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
                <div className="flex flex-col items-start gap-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80">
                        <span className="font-normal">{t('footer.made_with', 'Made with')}</span>
                        <Heart 
                            className="w-3.5 h-3.5 text-primary fill-primary transition-transform duration-fast hover:scale-110" 
                            aria-hidden="true" 
                        />
                        <span className="font-normal">{t('footer.for_community', 'for community')}</span>
                    </div>
                    <div className="text-xs text-muted-foreground/60 leading-tight">
                        <span>&copy; {currentYear} {t('footer.brand', 'prompedia.app')}</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};
