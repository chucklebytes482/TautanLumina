import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 flex flex-col items-center justify-center min-h-[50vh] text-center bg-[#faf8f5] rounded-2xl border border-[#e2ddd5] m-4">
          <h2 className="text-xl font-bold mb-2 text-[#ff4f00]">Terjadi Kesalahan</h2>
          <p className="text-neutral-600 mb-5 text-sm max-w-md">{this.state.error?.message}</p>
          <button
            className="px-5 py-2.5 bg-[#ff4f00] hover:bg-[#e04500] text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-[#ff4f00]/25"
            onClick={() => window.location.reload()}
          >
            Muat Ulang
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
