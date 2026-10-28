import React from 'react';
import { reportClientEvent } from '../utils/clientMonitoring';
import { captureClientException } from '../utils/sentryMonitoring';

const CHUNK_ERROR_PATTERN = /failed to fetch dynamically imported module|importing a module script failed|error loading dynamically imported module/i;
const RELOAD_FLAG = 'chunk_reload_attempted';
// componentDidMount can't clear the guard: the boundary mounts (Suspense
// fallback) before the lazy chunk fails, so a cleared flag meant reload loops.
const RELOAD_COOLDOWN_MS = 60_000;
const HARD_RESET_FLAG = 'chunk_hard_reset_attempted';

/**
 * Tải lại thường không cứu được khi chính service worker hay bộ nhớ đệm giữ
 * index.html cũ: trang tải lại vẫn trỏ vào file JS đã bị thay sau deploy, và
 * Safari báo "Importing a module script failed" lần nữa. Lần thứ hai thì gỡ
 * service worker, xoá cache rồi mới tải lại — một lần mỗi phiên.
 */
async function hardResetAndReload() {
  try {
    const registrations = await navigator.serviceWorker?.getRegistrations?.() || [];
    await Promise.all(registrations.map((registration) => registration.unregister()));
  } catch { /* ignore */ }
  try {
    const keys = await window.caches?.keys?.() || [];
    await Promise.all(keys.map((key) => window.caches.delete(key)));
  } catch { /* ignore */ }
  window.location.reload();
}

function isChunkLoadError(error) {
  return CHUNK_ERROR_PATTERN.test(error?.message || '');
}

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, autoReloading: false, componentStack: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Ở dev thì giữ lại để in THẲNG ra màn hình: chuỗi frame của react-dom
    // trong console không cho biết component nào ném lỗi, còn componentStack
    // thì có — dán một ảnh chụp màn hình là đủ để chẩn đoán.
    if (import.meta.env.DEV) this.setState({ componentStack: errorInfo?.componentStack || '' });

    // A new deploy replaced the hashed JS chunk files, but this tab is still
    // running an older index.html that references the old filenames. A single
    // hard reload fetches the current index.html + matching chunks. Guarded
    // by a timestamp so a genuinely broken deploy doesn't reload forever — and
    // only that case is worth reporting; a stale tab after deploy is expected.
    if (isChunkLoadError(error)) {
      const last = Number(sessionStorage.getItem(RELOAD_FLAG) || 0);
      if (Date.now() - last > RELOAD_COOLDOWN_MS) {
        sessionStorage.setItem(RELOAD_FLAG, String(Date.now()));
        this.setState({ autoReloading: true });
        window.location.reload();
        return;
      }
      let hardResetDone = true;
      try { hardResetDone = sessionStorage.getItem(HARD_RESET_FLAG) === '1'; } catch { /* ignore */ }
      if (!hardResetDone) {
        try { sessionStorage.setItem(HARD_RESET_FLAG, '1'); } catch { /* ignore */ }
        this.setState({ autoReloading: true });
        hardResetAndReload();
        return;
      }
    }

    reportClientEvent({
      type: 'react-error-boundary',
      name: error?.name || 'ReactError',
      message: error?.message,
      stack: `${error?.stack || ''}\n${errorInfo?.componentStack || ''}`,
    });
    captureClientException(error, {
      source: 'react-error-boundary',
      componentStack: errorInfo?.componentStack,
    });
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
            {import.meta.env.DEV && this.state.componentStack && (
              <pre className="max-h-48 overflow-auto rounded-xl bg-muted p-3 text-left text-[11px] leading-relaxed text-muted-foreground">
                {`${this.state.error?.name || 'Error'}\n${this.state.componentStack.trim().split('\n').slice(0, 8).join('\n')}`}
              </pre>
            )}
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
