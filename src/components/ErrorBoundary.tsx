
import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
          <p className="text-gray-700 mb-6">
            We're sorry, but an error occurred. Please try refreshing the page or contact support if the problem persists.
          </p>
          {this.state.error && (
            <div className="bg-red-50 border border-red-200 rounded p-4 mt-4 max-w-2xl overflow-auto text-left">
              <p className="font-semibold">Error details:</p>
              <pre className="text-xs mt-2 overflow-x-auto whitespace-pre-wrap">
                {this.state.error.toString()}
              </pre>
            </div>
          )}
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
