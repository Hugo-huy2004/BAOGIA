import * as Sentry from '@sentry/react';

let enabled = false;

export function initSentryMonitoring() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn || enabled) return;
  enabled = true;
  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
    release: import.meta.env.VITE_SENTRY_RELEASE || undefined,
    sendDefaultPii: false,
    tracesSampleRate: Math.min(
      1,
      Math.max(0, Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || 0))
    ),
  });
}

export function captureClientException(error, context = {}) {
  if (!enabled || !error) return;
  Sentry.captureException(error, {
    tags: { source: context.source || 'ui' },
    extra: { componentStack: String(context.componentStack || '').slice(0, 4000) },
  });
}
