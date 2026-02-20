import { SEO } from "../SEO";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Cpu, Code2, PenTool, GraduationCap, Zap, Target } from 'lucide-react';

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

    const useCases = [
        {
            title: t('use_cases.engineers_title'),
            desc: t('use_cases.engineers_desc'),
            icon: Cpu,
            color: 'bg-blue-500/10 text-blue-500',
            borderColor: 'border-blue-200 dark:border-blue-900/30',
            list: [t('use_cases.engineers_use_case_1'), t('use_cases.engineers_use_case_2')]
        },
        {
            title: t('use_cases.developers_title'),
            desc: t('use_cases.developers_desc'),
            icon: Code2,
            color: 'bg-green-500/10 text-green-500',
            borderColor: 'border-green-200 dark:border-green-900/30',
            list: [t('use_cases.developers_use_case_1'), t('use_cases.developers_use_case_2')]
        },
        {
            title: t('use_cases.creators_title'),
            desc: t('use_cases.creators_desc'),
            icon: PenTool,
            color: 'bg-orange-500/10 text-orange-500',
            borderColor: 'border-orange-200 dark:border-orange-900/30',
            list: [t('use_cases.creators_use_case_1'), t('use_cases.creators_use_case_2')]
        },
        {
            title: t('use_cases.learners_title'),
            desc: t('use_cases.learners_desc'),
            icon: GraduationCap,
            color: 'bg-violet-500/10 text-violet-500',
            borderColor: 'border-violet-200 dark:border-violet-900/30',
            list: [t('use_cases.learners_use_case_1'), t('use_cases.learners_use_case_2')]
        }
    ];

    return (
        <div className="min-h-screen bg-background font-sans flex flex-col">
            <SEO
                title={t('use_cases.title')}
                description={t('use_cases.description')}
                canonical={window.location.origin + '/use-cases'}
                structuredData={breadcrumbSchema}
            />
            <Header variant="public" />

            <main className="flex-1 w-full flex flex-col items-center">
                {/* Hero */}
                <div className="w-full bg-linear-to-b from-primary/5 to-background py-20 px-4">
                    <div className="max-w-4xl mx-auto text-center animate-fade-in">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-6">
                            <Target className="w-3.5 h-3.5" />
                            {t('use_cases.badge', 'Value Proposition')}
                        </div>
                        <h1 className="text-4xl sm:text-6xl font-black text-foreground mb-8 italic uppercase tracking-tight">
                            {t('use_cases.title')}
                        </h1>
                        <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto font-medium">
                            {t('use_cases.intro')}
                        </p>
                    </div>
                </div>

                <div className="max-w-5xl w-full px-4 py-16 pb-32">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in-up">
                        {useCases.map((uc, i) => (
                            <div
                                key={i}
                                className={`group p-8 bg-card border ${uc.borderColor} rounded-3xl hover:shadow-2xl hover:shadow-black/5 transition-all animate-fade-in-up`}
                                style={{ animationDelay: `${i * 150}ms` }}
                            >
                                <div className="flex items-start gap-5">
                                    <div className={`w-14 h-14 rounded-2xl ${uc.color} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110`}>
                                        <uc.icon className="w-7 h-7" />
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-black text-foreground mb-4 uppercase italic tracking-tight">
                                            {uc.title}
                                        </h2>
                                        <p className="text-base text-muted-foreground mb-6 leading-relaxed font-medium">
                                            {uc.desc}
                                        </p>
                                        <ul className="space-y-3">
                                            {uc.list.map((item, j) => (
                                                <li key={j} className="flex items-center gap-3 text-sm text-foreground/80 font-bold">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-24 p-12 bg-primary text-primary-foreground rounded-[3rem] text-center animate-fade-in relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-full bg-linear-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Zap className="absolute -top-10 -right-10 w-40 h-40 opacity-10 rotate-12" />

                        <div className="relative z-10 flex flex-col items-center">
                            <h2 className="text-3xl font-black mb-4 italic uppercase tracking-tight">Ready to boost your productivity?</h2>
                            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto font-bold tracking-tight">Join thousands of users who are already saving and sharing their perfect prompts.</p>
                            <Button variant="secondary" size="lg" asChild className="rounded-full px-12 font-black transition-transform hover:scale-105 active:scale-95 shadow-xl h-14 text-lg">
                                <Link to="/">Get Started Now</Link>
                            </Button>
                        </div>
                    </div>

                    <section className="mt-24 pt-12 border-t border-border animate-fade-in">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="text-center md:text-left">
                                <h2 className="text-xl font-black text-foreground mb-1 italic uppercase tracking-tight">{t('use_cases.related_title')}</h2>
                                <p className="text-sm text-muted-foreground font-medium">{t('use_cases.related_desc')}</p>
                            </div>
                            <div className="flex flex-wrap gap-4">
                                <Button variant="outline" asChild className="rounded-full px-6 font-bold h-10">
                                    <Link to="/about">{t('footer.links.about')}</Link>
                                </Button>
                                <Button variant="outline" asChild className="rounded-full px-6 font-bold h-10">
                                    <Link to="/faq">{t('footer.links.faq')}</Link>
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

export default UseCasesPage;

