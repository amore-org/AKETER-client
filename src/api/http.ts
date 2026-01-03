// src/api/http.ts
// fetch 기반의 최소 공용 HTTP 유틸

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface HttpRequestOptions {
    method?: HttpMethod;
    headers?: Record<string, string>;
    query?: Record<string, string | number | boolean | undefined | null>;
    body?: unknown;
    signal?: AbortSignal;
}

const buildQueryString = (query: HttpRequestOptions["query"]): string => {
    if (!query) return "";
    const usp = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
        if (v === undefined || v === null) return;
        usp.set(k, String(v));
    });
    const qs = usp.toString();
    return qs ? `?${qs}` : "";
};

const getApiBaseUrl = (): string => {
    /**
     * 기본은 same-origin(`/api/...`) 사용.
     *
     * 로컬 개발에서 `VITE_API_PROXY_TARGET`(vite.config.ts proxy) 를 쓰는 경우
     * baseURL을 비워야 브라우저 CORS를 피하고 dev proxy를 탈 수 있다.
     *
     * - dev + proxyTarget 설정: '' (same-origin)
     * - 그 외(예: 배포): VITE_API_BASE_URL 사용 가능
     */
    const env = (import.meta as unknown as { env?: Record<string, unknown> }).env ?? {};
    const envBase = typeof env.VITE_API_BASE_URL === "string" ? env.VITE_API_BASE_URL : undefined;
    const isDev = Boolean((env as { DEV?: boolean }).DEV);

    // dev에서는 CORS 회피를 위해 기본적으로 same-origin(`/api`)을 사용하고,
    // vite proxy(vite.config.ts)가 백엔드로 전달하도록 한다.
    if (isDev) return "";
    return envBase ?? "";
};

export class HttpError extends Error {
    status: number;
    bodyText?: string;

    constructor(message: string, status: number, bodyText?: string) {
        super(message);
        this.name = "HttpError";
        this.status = status;
        this.bodyText = bodyText;
    }
}

export async function requestJson<T>(path: string, options: HttpRequestOptions = {}): Promise<T> {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}${path}${buildQueryString(options.query)}`;

    const res = await fetch(url, {
        method: options.method ?? "GET",
        headers: {
            Accept: "application/json",
            ...(options.body ? { "Content-Type": "application/json" } : {}),
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
