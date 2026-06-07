import { DEV_BYPASS_TOKEN } from '@/lib/auth/devBypass';

/** API origin only - request paths must include `/api/v1/...` (Nest `setGlobalPrefix('api/v1')`). */
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export class ApiError extends Error {
  status: number;
  data: unknown;
  code?: string;

  constructor(message: string, status: number, data: unknown, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.code = code;
  }
}

type RequestOptions = {
  auth?: boolean;
  credentials?: boolean;
};

function getToken() {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('accessToken');
  }
  return null;
}

function parseErrorPayload(data: unknown): { message: string; code?: string } {
  const payload = data as {
    message?: string | { code?: string; message?: string };
    code?: string;
  } | null;

  if (!payload) return { message: 'Request failed' };

  if (typeof payload.message === 'object' && payload.message !== null) {
    return {
      message: payload.message.message || 'Request failed',
      code: payload.message.code,
    };
  }

  return {
    message: typeof payload.message === 'string' ? payload.message : 'Request failed',
    code: payload.code,
  };
}

let refreshPromise: Promise<string | null> | null = null;

async function tryRefreshToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) return null;
      const data = await res.json();
      const accessToken = data?.accessToken as string | undefined;
      if (accessToken && typeof window !== 'undefined') {
        sessionStorage.setItem('accessToken', accessToken);
      }
      return accessToken ?? null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function request(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
) {
  const useAuth = options.auth !== false;
  const token = useAuth ? getToken() : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const fetchOptions: RequestInit = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: options.credentials ? 'include' : 'same-origin',
  };

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, fetchOptions);
  } catch {
    throw new ApiError(
      `Cannot reach API at ${BASE_URL}. Is kinetiq-api running on port 3000?`,
      0,
      null,
    );
  }

  if (res.status === 401 && useAuth && token && token !== DEV_BYPASS_TOKEN) {
    const newToken = await tryRefreshToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`${BASE_URL}${path}`, { ...fetchOptions, headers });
    }
  }

  if (res.status === 401) {
    if (typeof window !== 'undefined' && token !== DEV_BYPASS_TOKEN) {
      sessionStorage.removeItem('accessToken');
      document.cookie = 'kinetiq_session=; path=/; max-age=0';
      const onAuthPage = window.location.pathname.startsWith('/auth/');
      if (!onAuthPage) {
        window.location.href = '/auth/login';
      }
    }
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const { message, code } = parseErrorPayload(data);
    throw new ApiError(message, res.status, data, code);
  }

  return { data };
}

const api = {
  get: (path: string, options?: RequestOptions) => request('GET', path, undefined, options),
  post: (path: string, body?: unknown, options?: RequestOptions) =>
    request('POST', path, body, options),
  patch: (path: string, body?: unknown, options?: RequestOptions) =>
    request('PATCH', path, body, options),
  put: (path: string, body?: unknown, options?: RequestOptions) =>
    request('PUT', path, body, options),
  delete: (path: string, options?: RequestOptions) => request('DELETE', path, undefined, options),
};

export default api;
