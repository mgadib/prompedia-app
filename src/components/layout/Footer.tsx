import { Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Footer = () => {
    const { t } = useTranslation();
    return (
        <footer className="border-t border-border bg-card/95 backdrop-blur-sm mt-auto py-4 shadow-xs">
            <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-y-2 sm:gap-x-6 sm:gap-y-3">


                {/* Info Section */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground/70">
                    <div className="flex items-center gap-1.5 uppercase tracking-widest font-medium">
                        <span>{t('footer.made_with')}</span>
                        <Heart className="w-3 h-3 text-primary fill-primary" />
                        <span>{t('footer.for_community')}</span>
                    </div>

                    <span className="w-1 h-1 rounded-full bg-border hidden sm:block" />

                    <div className="flex items-center gap-1.5">
                        <span>&copy; 2026</span>
                        <a
                            href="https://kerjabaik.ai/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium hover:text-primary transition-colors duration-normal"
                        >
                            Kerjabaik.Ai
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
