import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Home, RefreshCw, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error Boundary component to catch React errors and display a user-friendly error message.
 * Provides recovery actions like retry and navigation to home.
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error to console in development
        if (import.meta.env.DEV) {
            console.error('ErrorBoundary caught an error:', error, errorInfo);
        }

        // Call optional error handler
        this.props.onError?.(error, errorInfo);

        // In production, you might want to send this to an error tracking service
        // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
        });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return <ErrorFallback error={this.state.error} onReset={this.handleReset} />;
        }

        return this.props.children;
    }
}

/**
 * Default error fallback UI
 */
function ErrorFallback({ error, onReset }: { error: Error | null; onReset: () => void }) {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="max-w-md w-full bg-card border border-border rounded-lg shadow-lg p-6 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold text-foreground">
                            {t('error.boundary.title', 'Something went wrong')}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {t('error.boundary.description', 'An unexpected error occurred. Please try again.')}
                        </p>
                    </div>
                </div>

                {error && import.meta.env.DEV && (
                    <div className="mt-4 p-3 bg-muted rounded text-xs font-mono text-muted-foreground overflow-auto max-h-32">
                        {error.message}
                    </div>
                )}

                <div className="flex gap-3 pt-2">
                    <Button
                        variant="default"
                        onClick={onReset}
                        className="flex-1"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        {t('error.boundary.retry', 'Try Again')}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => {
                            window.location.href = '/';
                        }}
                        className="flex-1"
                    >
                        <Home className="w-4 h-4 mr-2" />
                        {t('error.boundary.home', 'Go Home')}
                    </Button>
                </div>
            </div>
        </div>
    );
}
