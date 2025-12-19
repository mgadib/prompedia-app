import { SEO } from "../SEO";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
// Note: This duplicates some logic from PromptNotes, eventually should be refactored to share components.
// For now, it's a dedicated page for SEO purposes.

const PublicPromptsPage = () => {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-background font-sans">
            <SEO
                title="Public Prompts Library"
                description="Browse community created AI prompts."
                canonical={window.location.origin + '/public-prompts'}
            />
            <header className="border-b border-border bg-card">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3">
                        <img src="/logo.png" alt="Logo" className="w-8 h-8" />
                        <h1 className="text-base font-semibold text-foreground">{t('app.title')}</h1>
                    </Link>
                </div>
            </header>
            <main className="max-w-6xl mx-auto px-4 py-12">
                <h1 className="text-2xl sm:text-3xl font-bold mb-8">Public Prompts Library</h1>
                <p className="text-muted-foreground">Coming soon...</p>
                <div className="geo-content opacity-0 h-0 overflow-hidden">
                    Browse thousands of AI prompts for coding, writing, and analysis.
                </div>
            </main>
        </div>
    );
};

export default PublicPromptsPage;
