import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('💥 ErrorBoundary caught an error:', error, info);
    // Optional: log to Sentry or external service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center text-white bg-black text-center p-6">
          <div>
            <h1 className="text-3xl font-bold mb-4">Something went wrong.</h1>
            <p className="text-lg text-neutral-400">Please refresh or try again later.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;