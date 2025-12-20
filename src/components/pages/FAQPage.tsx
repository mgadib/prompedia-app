import { SEO } from "../SEO";
import { useTranslation } from "react-i18next";
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

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
        <div className="min-h-screen bg-background font-sans flex flex-col">
            <SEO
                title="FAQ"
                description="Frequently Asked Questions about Prompedia"
                canonical={window.location.origin + '/faq'}
                structuredData={faqSchema}
            />
            <Header variant="public" />
            <main className="max-w-4xl mx-auto px-4 py-12 flex-1 w-full">
                <h1 className="text-page-title mb-8">FAQ</h1>
                <div className="space-y-6">
                    {faqs.map((faq, index) => (
                        <div key={index} className="bg-card border border-border rounded-sm p-6">
                            <h3 className="text-base font-medium mb-2 text-foreground">{faq.q}</h3>
                            <p className="text-muted-foreground">{faq.a}</p>
                        </div>
                    ))}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default FAQPage;

