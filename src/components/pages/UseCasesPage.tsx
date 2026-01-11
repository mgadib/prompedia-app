import { SEO } from "../SEO";
import { useTranslation } from "react-i18next";
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const UseCasesPage = () => {
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
                "name": t('use_cases.title'),
                "item": window.location.origin + "/use-cases"
            }
        ]
    };

    return (
        <div className="min-h-screen bg-background font-sans flex flex-col">
            <SEO
                title={t('use_cases.title')}
                description={t('use_cases.description')}
                canonical={window.location.origin + '/use-cases'}
                structuredData={breadcrumbSchema}
            />
            <Header variant="public" />
            <main className="max-w-4xl mx-auto px-4 py-12 flex-1 w-full">
                <h1 className="text-page-title mb-6">{t('use_cases.title')}</h1>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                    {t('use_cases.intro')}
                </p>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('use_cases.engineers_title')}</h2>
                    <p className="text-base text-muted-foreground mb-4 leading-relaxed">{t('use_cases.engineers_desc')}</p>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-4">
                        <li>{t('use_cases.engineers_use_case_1')}</li>
                        <li>{t('use_cases.engineers_use_case_2')}</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('use_cases.developers_title')}</h2>
                    <p className="text-base text-muted-foreground mb-4 leading-relaxed">{t('use_cases.developers_desc')}</p>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-4">
                        <li>{t('use_cases.developers_use_case_1')}</li>
                        <li>{t('use_cases.developers_use_case_2')}</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('use_cases.creators_title')}</h2>
                    <p className="text-base text-muted-foreground mb-4 leading-relaxed">{t('use_cases.creators_desc')}</p>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-4">
                        <li>{t('use_cases.creators_use_case_1')}</li>
                        <li>{t('use_cases.creators_use_case_2')}</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('use_cases.learners_title')}</h2>
                    <p className="text-base text-muted-foreground mb-4 leading-relaxed">{t('use_cases.learners_desc')}</p>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-4">
                        <li>{t('use_cases.learners_use_case_1')}</li>
                        <li>{t('use_cases.learners_use_case_2')}</li>
                    </ul>
                </section>

                <section className="mt-8 pt-6 border-t border-border">
                    <h2 className="text-xl font-semibold mb-2 text-foreground">{t('use_cases.related_title')}</h2>
                    <p className="text-sm text-muted-foreground mb-4">{t('use_cases.related_desc')}</p>
                    <div className="flex flex-wrap gap-3">
                        <a href="/about" className="text-sm text-primary hover:underline font-medium">{t('footer.links.about')}</a>
                        <span className="text-muted-foreground">•</span>
                        <a href="/faq" className="text-sm text-primary hover:underline font-medium">{t('footer.links.faq')}</a>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default UseCasesPage;

