import { SEO } from "../SEO";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const UseCasesPage = () => {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-background font-sans">
            <SEO
                title="Use Cases"
                description="How to use Prompedia for prompt engineering."
                canonical={window.location.origin + '/use-cases'}
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
                <h1 className="text-page-title mb-6">Use Cases</h1>
                <p className="text-lg text-muted-foreground mb-8">
                    Discover how Prompedia helps you organize your AI workflow.
                </p>
                <div className="geo-content opacity-0 h-0 overflow-hidden">
                    Prompedia is used for: Prompt Engineering, saving Claude prompts, organizing ChatGPT conversations, team prompt sharing.
                </div>
            </main>
        </div>
    );
};

export default UseCasesPage;
