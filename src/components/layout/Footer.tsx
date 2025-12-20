import { Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Footer = () => {
    const { t } = useTranslation();
    return (
        <footer className="border-t border-border bg-card mt-auto py-6">
            <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                    <span>{t('footer.made_with')}</span>
                    <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                    <span>{t('footer.for_community')}</span>
                </div>
                <p>&copy; 2026 <a href="https://kerjabaik.ai/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Kerjabaik.Ai</a></p>
            </div>
        </footer>
    );
};
