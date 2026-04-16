import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center p-8">
          <div className="text-center">
            <h1 className="font-heading text-2xl text-accent-red mb-2">
              Something went wrong
            </h1>
            <p className="text-text-secondary text-sm mb-4">
              Tab Out encountered an unexpected error.
            </p>
            <button
              className="rounded-chip bg-accent-blue px-4 py-2 text-sm text-white hover:opacity-85"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
