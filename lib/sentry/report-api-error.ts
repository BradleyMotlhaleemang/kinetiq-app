import * as Sentry from '@sentry/nextjs';
import type { ApiError } from '@/lib/api/client';

/** Report server/network API failures to Sentry (skip routine 4xx). */
export function reportApiError(error: ApiError, path: string): void {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;

  const { status, code } = error;
  if (status === 401 || status === 403 || status === 404) return;

  const shouldReport =
    status === 0 || status >= 500 || status === 429 || status === 409;

  if (!shouldReport) return;

  Sentry.captureException(error, {
    tags: {
      source: 'api-client',
      http_status: String(status),
      ...(code ? { error_code: code } : {}),
    },
    extra: {
      path,
      response: error.data,
    },
    level: status >= 500 || status === 0 ? 'error' : 'warning',
  });
}
