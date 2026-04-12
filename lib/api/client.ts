const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

function getToken() {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('accessToken');
  }
  return null;
}

async function request(method: string, path: string, body?: any) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');
      window.location.href = '/auth/login';
    }
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw { response: { data, status: res.status } };
  }

  return { data };
}

const api = {
  get: (path: string) => request('GET', path),
  post: (path: string, body?: any) => request('POST', path, body),
  patch: (path: string, body?: any) => request('PATCH', path, body),
  put: (path: string, body?: any) => request('PUT', path, body),
  delete: (path: string) => request('DELETE', path),
};

export default api;
