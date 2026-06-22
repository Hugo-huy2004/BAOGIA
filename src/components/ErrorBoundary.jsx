import React from 'react';

const CHUNK_ERROR_PATTERN = /failed to fetch dynamically imported module|importing a module script failed|error loading dynamically imported module/i;
const RELOAD_FLAG = 'chunk_reload_attempted';

function isChunkLoadError(error) {
  return CHUNK_ERROR_PATTERN.test(error?.message || '');
}

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, autoReloading: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);

    // A new deploy replaced the hashed JS chunk files, but this tab is still
    // running an older index.html that references the old filenames. A single
    // hard reload fetches the current index.html + matching chunks. Guarded
    // by sessionStorage so a genuinely broken deploy doesn't reload forever.
    if (isChunkLoadError(error) && !sessionStorage.getItem(RELOAD_FLAG)) {
      sessionStorage.setItem(RELOAD_FLAG, '1');
      this.setState({ autoReloading: true });
      window.location.reload();
    }
  }

  componentDidMount() {
    // Reached a successful render — clear the guard so a future real chunk
    // error gets its one automatic retry again.
    sessionStorage.removeItem(RELOAD_FLAG);
  }

  render() {
    if (this.state.hasError) {
      if (this.state.autoReloading) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-background p-4">
            <div className="text-center space-y-3">
              <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground">Đang tải phiên bản mới nhất...</p>
            </div>
          </div>
        );
      }
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-background p-4">
          <div className="max-w-md w-full bg-white dark:bg-background border border-border rounded-3xl p-8 text-center space-y-4">
            <span className="material-symbols-outlined text-5xl text-destructive">error</span>
            <h1 className="text-2xl font-black text-foreground">Có lỗi xảy ra</h1>
            <p className="text-sm text-muted-foreground">
              {this.state.error?.message || 'Vui lòng làm mới trang'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-colors"
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
