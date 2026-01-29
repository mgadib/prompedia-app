import { SEO } from "../SEO";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const FAQPage = () => {
    const { t } = useTranslation();

    const faqs = [
        { q: t('faq.q1'), a: t('faq.a1') },
        { q: t('faq.q2'), a: t('faq.a2') },
        { q: t('faq.q3'), a: t('faq.a3') },
        { q: t('faq.q4'), a: t('faq.a4') },
        { q: t('faq.q5'), a: t('faq.a5') },
        { q: t('faq.q6'), a: t('faq.a6') },
    ];

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(f => ({
            "@type": "Question",
            "name": f.q,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": f.a
            }
        }))
    };

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
                "name": t('faq.title'),
                "item": window.location.origin + "/faq"
            }
        ]
    };

    return (
        <div className="min-h-screen bg-background font-sans flex flex-col">
            <SEO
                title={t('faq.title')}
                description={t('faq.description')}
                canonical={window.location.origin + '/faq'}
                structuredData={[faqSchema, breadcrumbSchema]}
            />
            <Header variant="public" />
            <main className="max-w-4xl mx-auto px-4 py-12 flex-1 w-full">
                <h1 className="text-page-title mb-8">{t('faq.title')}</h1>
                <div className="space-y-6 mb-8">
                    {faqs.map((faq, index) => (
                        <div key={index} className="bg-card border border-border rounded-sm p-6">
                            <h2 className="text-lg font-semibold mb-3 text-foreground">{faq.q}</h2>
                            <p className="text-base text-muted-foreground leading-relaxed">{faq.a}</p>
                        </div>
                    ))}
                </div>
                
                <section className="mt-8 pt-6 border-t border-border">
                    <h2 className="text-xl font-semibold mb-2 text-foreground">{t('faq.related_title')}</h2>
                    <p className="text-sm text-muted-foreground mb-4">{t('faq.related_desc')}</p>
                    <div className="flex flex-wrap gap-3">
                        <Link to="/about" className="text-sm text-primary hover:underline font-medium">{t('footer.links.about')}</Link>
                        <span className="text-muted-foreground">•</span>
                        <Link to="/use-cases" className="text-sm text-primary hover:underline font-medium">{t('footer.links.use_cases')}</Link>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default FAQPage;

