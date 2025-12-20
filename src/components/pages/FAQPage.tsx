import { SEO } from "../SEO";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const FAQPage = () => {
    const { t } = useTranslation();

    // Placeholder data - ideally this comes from structured data/CMS or locale file
    const faqs = [
        { q: "What is Prompedia?", a: t('geo.semantic_description') },
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

    return (
        <div className="min-h-screen bg-background font-sans">
            <SEO
                title="FAQ"
                description="Frequently Asked Questions about Prompedia"
                canonical={window.location.origin + '/faq'}
                structuredData={faqSchema}
            />
            <header className="border-b border-border bg-card">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3">
                        <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                        <h1 className="text-base font-semibold text-foreground">{t('app.title')}</h1>
                    </Link>
                </div>
            </header>
            <main className="max-w-4xl mx-auto px-4 py-12">
                <h1 className="text-page-title mb-8">FAQ</h1>
                <div className="space-y-6">
                    {faqs.map((faq, index) => (
                        <div key={index} className="bg-card border border-border rounded-sm p-6">
                            <h3 className="text-lg font-semibold mb-2">{faq.q}</h3>
                            <p className="text-muted-foreground">{faq.a}</p>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default FAQPage;
