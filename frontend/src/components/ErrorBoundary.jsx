// src/components/ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("🛑 Caught by ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
    // Optional: send error to Sentry or log backend
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold mb-2">Something went wrong 😢</h1>
            <p className="text-sm text-neutral-400 mb-4">Please try refreshing the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-green-500 text-black font-bold px-4 py-2 rounded hover:bg-green-600"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;