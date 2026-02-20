import { SEO } from "../SEO";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Database, Tags, Share2, Layout, Search, Sparkles, Rocket, Ghost } from 'lucide-react';

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
                description={t('geo.semantic_description')}
                canonical={window.location.origin + '/about'}
                structuredData={breadcrumbSchema}
            />
            <Header variant="public" />

            <main className="flex-1 w-full flex flex-col items-center">
                {/* Hero Section */}
                <div className="w-full bg-linear-to-b from-secondary/30 to-background py-20 px-4">
                    <div className="max-w-4xl mx-auto text-center animate-fade-in">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-6">
                            <Sparkles className="w-3 h-3" />
                            {t('about.badge', 'Inside Prompedia')}
                        </div>
                        <h1 className="text-page-title font-bold text-foreground mb-6 leading-tight tracking-tight font-heading">
                            {t('about.title')}
                        </h1>
                        <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                            {t('about.what_is_desc')}
                        </p>
                    </div>
                </div>

                <div className="max-w-4xl w-full px-4 py-16">
                    {/* Features Grid */}
                    <section className="mb-24">
                        <div className="flex items-center gap-3 mb-10">
                            <div className="h-8 w-1 bg-primary rounded-full" />
                            <h2 className="text-section-title font-bold text-foreground tracking-tight font-heading">
                                {t('about.features_title')}
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { title: t('about.features.storage'), desc: t('about.features.storage_desc'), icon: Database },
                                { title: t('about.features.tags'), desc: t('about.features.tags_desc'), icon: Tags },
                                { title: t('about.features.sharing'), desc: t('about.features.sharing_desc'), icon: Share2 },
                                { title: t('about.features.editor'), desc: t('about.features.editor_desc'), icon: Layout },
                                { title: t('about.features.search'), desc: t('about.features.search_desc'), icon: Search },
                                { title: t('about.features.sync', 'Real-time Sync'), desc: t('about.features.sync_desc', 'Your prompts are always up-to-date across all devices.'), icon: Rocket },
                            ].map((feature, i) => (
                                <div
                                    key={i}
                                    className="p-6 bg-card border border-border rounded-2xl hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all group animate-fade-in-up"
                                    style={{ animationDelay: `${i * 100}ms` }}
                                >
                                    <div className="w-12 h-12 rounded-xl bg-muted group-hover:bg-primary/10 flex items-center justify-center mb-6 transition-colors">
                                        <feature.icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                    <h3 className="text-lg font-bold mb-3 text-foreground">{feature.title}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Secondary Sections */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <section className="animate-fade-in" style={{ animationDelay: '600ms' }}>
                            <div className="flex items-center gap-3 mb-6">
                                <ShieldCheck className="w-6 h-6 text-status-public" />
                                <h2 className="text-xl font-bold text-foreground font-heading">{t('about.security_title')}</h2>
                            </div>
                            <div className="p-8 bg-status-public/5 border border-status-public/10 rounded-3xl">
                                <p className="text-body text-muted-foreground leading-relaxed italic">
                                    "{t('about.security_desc')}"
                                </p>
                            </div>
                        </section>

                        <section className="animate-fade-in" style={{ animationDelay: '800ms' }}>
                            <div className="flex items-center gap-3 mb-6">
                                <Ghost className="w-6 h-6 text-violet-500" />
                                <h2 className="text-xl font-bold text-foreground font-heading">{t('about.target_title')}</h2>
                            </div>
                            <div className="p-8 bg-violet-500/5 border border-violet-500/10 rounded-3xl">
                                <p className="text-body text-muted-foreground leading-relaxed">
                                    {t('about.target_desc')}
                                </p>
                            </div>
                        </section>
                    </div>

                    {/* Related Links */}
                    <section className="mt-24 pt-12 border-t border-border animate-fade-in" style={{ animationDelay: '1s' }}>
                        <div className="bg-muted/30 p-8 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-8 border border-border/50">
                            <div>
                                <h2 className="text-xl font-bold text-foreground mb-2 font-heading">{t('about.related_title')}</h2>
                                <p className="text-muted-foreground text-body">{t('about.related_desc')}</p>
                            </div>
                            <div className="flex gap-4">
                                <Button variant="outline" asChild className="rounded-full px-6 font-bold h-12">
                                    <Link to="/faq">{t('footer.links.faq')}</Link>
                                </Button>
                                <Button variant="brand" asChild className="rounded-full px-6 font-bold h-12">
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

export default AboutPage;

