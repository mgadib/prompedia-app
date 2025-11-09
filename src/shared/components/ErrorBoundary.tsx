import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

/**
 * Error fallback component that displays when an error occurs
 */
const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary }) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
          <AlertTitle className="font-mono text-base sm:text-lg">{t('common:error.occurred')}</AlertTitle>
          <AlertDescription className="font-mono text-sm">
            {t('common:error.description')}
          </AlertDescription>
        </Alert>

        <div className="space-y-2 sm:space-y-3">
          <Button 
            onClick={resetErrorBoundary} 
            className="w-full font-mono touch-manipulation min-h-[44px] sm:min-h-0 transition-smooth"
            variant="outline"
            aria-label={t('common:error.tryAgainAria')}
          >
            <RefreshCw className="w-4 h-4 sm:w-5 sm:w-5 mr-2" />
            {t('common:error.tryAgain')}
          </Button>
          
          <Button 
            onClick={() => window.location.reload()} 
            className="w-full font-mono touch-manipulation min-h-[44px] sm:min-h-0 transition-smooth"
            aria-label={t('common:error.reloadPageAria')}
          >
            {t('common:error.reloadPage')}
          </Button>
        </div>

        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-4 p-3 sm:p-4 bg-muted rounded-md text-sm font-mono">
            <summary className="cursor-pointer font-medium touch-manipulation min-h-[44px] flex items-center sm:min-h-0">
              {t('common:error.errorDetails')}
            </summary>
            <pre className="mt-2 whitespace-pre-wrap text-xs overflow-x-auto">
              {error.toString()}
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * Modern functional Error Boundary component using react-error-boundary
 * Replaces the old class component with hooks-based approach
 * 
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ 
  children, 
  fallback: Fallback = ErrorFallback,
  onError 
}) => {
  const handleError = (error: Error, errorInfo: { componentStack: string | null }) => {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call custom error handler if provided
    if (onError) {
      onError(error, {
        componentStack: errorInfo.componentStack || '',
      } as React.ErrorInfo);
    }
  };

  return (
    <ReactErrorBoundary
      FallbackComponent={Fallback}
      onError={handleError}
      onReset={() => {
        // Reset app state if needed
        window.location.reload();
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
};

/**
 * Higher-order component for wrapping components with error boundary
 * @deprecated Use ErrorBoundary component directly instead
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<ErrorFallbackProps>
) => {
  const WrappedComponent = (props: P) => {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};
