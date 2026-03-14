import { Component, type ReactNode } from 'react';
import { logger } from '../../utils/logger';
import * as Sentry from '@sentry/react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorType?: 'chunk' | 'network' | 'runtime' | 'unknown';
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Categorize error type
    const errorMessage = error.message.toLowerCase();
    let errorType: State['errorType'];

    if (
      errorMessage.includes('loading chunk') ||
      errorMessage.includes('failed to fetch dynamically imported module') ||
      errorMessage.includes('dynamically imported module')
    ) {
      errorType = 'chunk';
    } else if (
      errorMessage.includes('network') ||
      errorMessage.includes('fetch')
    ) {
      errorType = 'network';
    } else {
      errorType = 'runtime';
    }

    return { hasError: true, error, errorType };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to console in development
    logger.error('ErrorBoundary caught an error:', error, errorInfo);

    // Send to Sentry in production
    if (import.meta.env.PROD) {
      Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack
          }
        },
        tags: {
          errorBoundary: true,
          errorType: this.state.errorType
        }
      });
    }

    // Auto-reload for chunk loading errors
    if (this.state.errorType === 'chunk') {
      logger.warn('Chunk loading error detected, reloading page in 2s...');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }

    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  getErrorMessage(): { title: string; description: string; action: string } {
    const { errorType, error } = this.state;

    switch (errorType) {
      case 'chunk':
        return {
          title: 'Loading Error',
          description:
            'Failed to load part of the application. The page will reload automatically.',
          action: 'Reloading...'
        };
      case 'network':
        return {
          title: 'Connection Error',
          description:
            'Unable to connect to the server. Please check your internet connection.',
          action: 'Retry'
        };
      case 'runtime':
        return {
          title: 'Something went wrong',
          description: import.meta.env.DEV
            ? error?.message || 'An unexpected error occurred'
            : 'An unexpected error occurred. Our team has been notified.',
          action: 'Try Again'
        };
      default:
        return {
          title: 'Error',
          description: 'An unexpected error occurred',
          action: 'Try Again'
        };
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { title, description, action } = this.getErrorMessage();
      const { errorType } = this.state;

      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center">
          <div className="text-red-500 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-200 mb-2">{title}</h2>
          <p className="text-sm text-gray-400 mb-4">{description}</p>

          {/* Show component stack in development */}
          {import.meta.env.DEV && this.state.errorInfo && (
            <details className="mb-4 text-left max-w-md">
              <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-400">
                Error Details (Dev Only)
              </summary>
              <pre className="mt-2 text-xs text-gray-500 overflow-auto max-h-40 bg-gray-900 p-2 rounded">
                {this.state.error?.stack}
                {'\n\n'}
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}

          <div className="flex gap-2">
            {errorType !== 'chunk' && (
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors"
              >
                {action}
              </button>
            )}
            <button
              onClick={this.handleReload}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
