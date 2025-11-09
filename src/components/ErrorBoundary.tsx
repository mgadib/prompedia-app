import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * Komponen Error Boundary untuk menangkap dan menangani error React
 * Menyediakan penanganan error yang graceful dan opsi recovery
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Memperbarui state agar render berikutnya menampilkan UI fallback
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Mencatat error ke console dan berpotensi ke error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Di sini Anda bisa mengirim error ke logging service
    // Contoh: logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // UI fallback kustom
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI error default
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <div className="max-w-md w-full space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
              <AlertTitle className="font-mono text-base sm:text-lg">An Error Occurred</AlertTitle>
              <AlertDescription className="font-mono text-sm">
                The application encountered an unexpected error. Please try reloading the page.
              </AlertDescription>
            </Alert>

            <div className="space-y-2 sm:space-y-3">
              <Button 
                onClick={this.handleReset} 
                className="w-full font-mono touch-manipulation min-h-[44px] sm:min-h-0"
                variant="outline"
              >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Try Again
              </Button>
              
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full font-mono touch-manipulation min-h-[44px] sm:min-h-0"
              >
                Reload Page
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 p-3 sm:p-4 bg-muted rounded-md text-sm font-mono">
                <summary className="cursor-pointer font-medium touch-manipulation min-h-[44px] flex items-center sm:min-h-0">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 whitespace-pre-wrap text-xs overflow-x-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component untuk membungkus komponen dengan error boundary
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};