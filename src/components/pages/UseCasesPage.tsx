import { SEO } from "../SEO";
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const UseCasesPage = () => {

    return (
        <div className="min-h-screen bg-background font-sans flex flex-col">
            <SEO
                title="Use Cases"
                description="How to use Prompedia for prompt engineering."
                canonical={window.location.origin + '/use-cases'}
            />
            <Header variant="public" />
            <main className="max-w-4xl mx-auto px-4 py-12 flex-1 w-full">
                <h1 className="text-page-title mb-6">Use Cases</h1>
                <p className="text-lg text-muted-foreground mb-8">
                    Discover how Prompedia helps you organize your AI workflow.
                </p>
                <div className="geo-content opacity-0 h-0 overflow-hidden">
                    Prompedia is used for: Prompt Engineering, saving Claude prompts, organizing ChatGPT conversations, team prompt sharing.
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default UseCasesPage;

