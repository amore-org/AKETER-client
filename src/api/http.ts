// src/api/http.ts
// fetch 기반의 최소 공용 HTTP 유틸

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface HttpRequestOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  signal?: AbortSignal;
}

const buildQueryString = (query: HttpRequestOptions['query']): string => {
  if (!query) return '';
  const usp = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    usp.set(k, String(v));
  });
  const qs = usp.toString();
  return qs ? `?${qs}` : '';
};

const getApiBaseUrl = (): string => {
  // 기본은 same-origin(`/api/...`) 사용. 필요시 VITE_API_BASE_URL 로 오버라이드.
  const envBase = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_BASE_URL;
  return envBase ?? '';
};

export class HttpError extends Error {
  status: number;
  bodyText?: string;

  constructor(message: string, status: number, bodyText?: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.bodyText = bodyText;
  }
}

export async function requestJson<T>(path: string, options: HttpRequestOptions = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${path}${buildQueryString(options.query)}`;

  const res = await fetch(url, {
    method: options.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers ?? {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => undefined);
    throw new HttpError(`HTTP ${res.status} ${res.statusText}`, res.status, text);
  }

  return (await res.json()) as T;
}


