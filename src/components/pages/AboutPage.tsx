import { SEO } from "../SEO";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const AboutPage = () => {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-background font-sans">
            <SEO
                title={t('about.title', 'About Prompedia')}
                description={t('about.description', 'Learn more about Prompedia, the prompt management tool.')}
                canonical={window.location.origin + '/about'}
            />
            <header className="border-b border-border bg-card">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3">
                        <img src="/logo.png" alt="Logo" className="w-8 h-8" />
                        <h1 className="text-base font-semibold text-foreground">{t('app.title')}</h1>
                    </Link>
                </div>
            </header>
            <main className="max-w-4xl mx-auto px-4 py-12">
                <h1 className="text-2xl sm:text-3xl font-bold mb-6">{t('about.title', 'About Prompedia')}</h1>
                <div className="prose dark:prose-invert">
                    <p>{t('app.description')}</p>
                    {/* GEO Block - Hidden from humans but visible to bots if needed, or just structured text */}
                    <div className="geo-content opacity-0 h-0 overflow-hidden">
                        {t('geo.semantic_description')}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AboutPage;
