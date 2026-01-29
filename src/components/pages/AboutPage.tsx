import { SEO } from "../SEO";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const AboutPage = () => {
    const { t } = useTranslation();

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": t('footer.links.home'),
                "item": window.location.origin + "/"
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": t('about.title'),
                "item": window.location.origin + "/about"
            }
        ]
    };

    return (
        <div className="min-h-screen bg-background font-sans flex flex-col">
            <SEO
                title={t('about.title')}
                description={t('about.description')}
                canonical={window.location.origin + '/about'}
                structuredData={breadcrumbSchema}
            />
            <Header variant="public" />
            <main className="max-w-4xl mx-auto px-4 py-12 flex-1 w-full">
                <h1 className="text-page-title mb-6">{t('about.title')}</h1>
                
                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('about.what_is')}</h2>
                    <p className="text-base text-muted-foreground mb-4 leading-relaxed">{t('about.what_is_desc')}</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('about.features_title')}</h2>
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-medium mb-2 text-foreground">{t('about.features.storage')}</h3>
                            <p className="text-sm text-muted-foreground">{t('about.features.storage_desc')}</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-medium mb-2 text-foreground">{t('about.features.tags')}</h3>
                            <p className="text-sm text-muted-foreground">{t('about.features.tags_desc')}</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-medium mb-2 text-foreground">{t('about.features.sharing')}</h3>
                            <p className="text-sm text-muted-foreground">{t('about.features.sharing_desc')}</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-medium mb-2 text-foreground">{t('about.features.editor')}</h3>
                            <p className="text-sm text-muted-foreground">{t('about.features.editor_desc')}</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-medium mb-2 text-foreground">{t('about.features.search')}</h3>
                            <p className="text-sm text-muted-foreground">{t('about.features.search_desc')}</p>
                        </div>
                    </div>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('about.security_title')}</h2>
                    <p className="text-base text-muted-foreground leading-relaxed">{t('about.security_desc')}</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('about.target_title')}</h2>
                    <p className="text-base text-muted-foreground leading-relaxed">{t('about.target_desc')}</p>
                </section>

                <section className="mt-8 pt-6 border-t border-border">
                    <h2 className="text-xl font-semibold mb-2 text-foreground">{t('about.related_title')}</h2>
                    <p className="text-sm text-muted-foreground mb-4">{t('about.related_desc')}</p>
                    <div className="flex flex-wrap gap-3">
                        <Link to="/faq" className="text-sm text-primary hover:underline font-medium">{t('footer.links.faq')}</Link>
                        <span className="text-muted-foreground">•</span>
                        <Link to="/use-cases" className="text-sm text-primary hover:underline font-medium">{t('footer.links.use_cases')}</Link>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default AboutPage;

