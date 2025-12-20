import { SEO } from "../SEO";
import { useTranslation } from "react-i18next";
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const AboutPage = () => {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-background font-sans flex flex-col">
            <SEO
                title={t('about.title', 'About Prompedia')}
                description={t('about.description', 'Learn more about Prompedia, the prompt management tool.')}
                canonical={window.location.origin + '/about'}
            />
            <Header variant="public" />
            <main className="max-w-4xl mx-auto px-4 py-12 flex-1 w-full">
                <h1 className="text-page-title mb-6">{t('about.title', 'About Prompedia')}</h1>
                <div className="prose dark:prose-invert">
                    <p className="text-sm text-muted-foreground">{t('app.description')}</p>
                    {/* GEO Block - Hidden from humans but visible to bots if needed, or just structured text */}
                    <div className="geo-content opacity-0 h-0 overflow-hidden">
                        {t('geo.semantic_description')}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default AboutPage;

