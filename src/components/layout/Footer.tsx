import { Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Footer = () => {
    const { t } = useTranslation();
    return (
        <footer className="border-t border-border bg-card/95 backdrop-blur-sm mt-auto shadow-xs">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
                <div className="flex flex-col gap-3 sm:gap-3">
                    {/* Made with love section */}
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground/80">
                        <span className="font-normal">{t('footer.made_with')}</span>
                        <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary fill-primary transition-transform duration-fast hover:scale-110" aria-hidden="true" />
                        <span className="font-normal">{t('footer.for_community')}</span>
                    </div>

                    {/* Copyright */}
                    <div className="text-xs sm:text-sm text-muted-foreground/60">
                        <span>&copy; 2026 prompedia.app</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};
