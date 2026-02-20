import { SEO } from "../SEO";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { HelpCircle, MessageCircle } from 'lucide-react';

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

            <main className="flex-1 w-full flex flex-col items-center">
                {/* Hero */}
                <div className="w-full bg-linear-to-b from-primary/10 to-background py-16 px-4">
                    <div className="max-w-3xl mx-auto text-center animate-fade-in">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4">
                            <HelpCircle className="w-3.5 h-3.5" />
                            {t('faq.badge', 'Support Center')}
                        </div>
                        <h1 className="text-page-title font-bold text-foreground mb-4 italic uppercase tracking-tight font-heading">
                            {t('faq.title')}
                        </h1>
                        <p className="text-body-lg text-muted-foreground leading-relaxed">
                            {t('faq.description')}
                        </p>
                    </div>
                </div>

                <div className="max-w-3xl w-full px-4 py-12 pb-24">
                    <div className="space-y-4 animate-fade-in-up">
                        {faqs.map((faq, index) => (
                            <div
                                key={index}
                                className="group bg-card border border-border rounded-2xl p-6 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all animate-fade-in-up"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-muted group-hover:bg-primary/10 flex items-center justify-center flex-shrink-0 transition-colors">
                                        <MessageCircle className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-card-title font-bold text-foreground mb-3 group-hover:text-primary transition-colors font-heading">
                                            {faq.q}
                                        </h2>
                                        <p className="text-body text-muted-foreground leading-relaxed">
                                            {faq.a}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <section className="mt-20 p-10 bg-linear-to-br from-secondary/40 to-muted/20 rounded-3xl border border-border animate-fade-in">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
                            <div>
                                <h2 className="text-xl font-bold text-foreground mb-2 italic uppercase font-heading">{t('faq.related_title')}</h2>
                                <p className="text-body text-muted-foreground">{t('faq.related_desc')}</p>
                            </div>
                            <div className="flex gap-4">
                                <Button variant="outline" asChild className="rounded-full px-8 font-bold">
                                    <Link to="/about">{t('footer.links.about')}</Link>
                                </Button>
                                <Button variant="brand" asChild className="rounded-full px-8 font-bold shadow-lg shadow-primary/20">
                                    <Link to="/use-cases">{t('footer.links.use_cases')}</Link>
                                </Button>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default FAQPage;

