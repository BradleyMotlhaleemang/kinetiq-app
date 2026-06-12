import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  environment:
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ??
    process.env.NODE_ENV ??
    'development',
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
  enabled: Boolean(dsn),
  tracesSampleRate:
    Boolean(dsn) && process.env.NODE_ENV === 'production' ? 0.1 : 0,
});
