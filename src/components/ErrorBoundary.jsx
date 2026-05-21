import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-[#0b0a0f] p-4">
          <div className="max-w-md w-full bg-white dark:bg-[#12111a] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-4">
            <span className="material-symbols-outlined text-5xl text-rose-500">error</span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Có lỗi xảy ra</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {this.state.error?.message || 'Vui lòng làm mới trang'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors"
            >
              Làm mới trang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
