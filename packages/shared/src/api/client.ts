export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

let _baseUrl = 'http://localhost:3001';
let _getToken: () => Promise<string | null> = async () => null;

export function configureApiClient(
  baseUrl: string,
  getToken: () => Promise<string | null>,
) {
  _baseUrl = baseUrl;
  _getToken = getToken;
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await _getToken();

  const res = await fetch(`${_baseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    const message = body.detail
      ? `${body.error}: ${body.detail}`
      : (body.error ?? 'Request failed');
    throw new ApiError(res.status, message);
  }

  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}
