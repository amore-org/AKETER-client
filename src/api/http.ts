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
     * - dev + proxyTarget 미설정: VITE_API_BASE_URL이 있으면 직접 호출(단, CORS는 백엔드 설정 필요)
     * - 그 외(예: 배포): VITE_API_BASE_URL 사용 가능
     */
    const env = (import.meta as unknown as { env?: Record<string, unknown> }).env ?? {};
    const envBaseRaw =
        (typeof env.VITE_API_BASE_URL === "string" && env.VITE_API_BASE_URL) ||
        (typeof env.VITE_API_URL === "string" && env.VITE_API_URL) ||
        undefined;
    const envBase = typeof envBaseRaw === "string" ? envBaseRaw.trim() : undefined;
    const proxyTarget =
        (typeof env.VITE_API_PROXY_TARGET === "string" && env.VITE_API_PROXY_TARGET.trim()) || undefined;
    const isDev = Boolean((env as { DEV?: boolean }).DEV);

    // dev에서는 CORS 회피를 위해 기본적으로 same-origin(`/api`)을 사용하고,
    // vite proxy(vite.config.ts)가 백엔드로 전달하도록 한다.
    if (isDev) {
        // proxyTarget이 있으면 항상 same-origin을 타서 proxy로 넘긴다.
        if (proxyTarget) return "";
        // proxyTarget이 없으면, 명시된 baseURL이 있을 때만 직접 호출한다.
        return envBase ?? "";
    }
    return envBase ?? "";
};

const parseJsonObject = (raw: string): Record<string, string> | null => {
    try {
        const v = JSON.parse(raw) as unknown;
        if (!v || typeof v !== "object") return null;
        const out: Record<string, string> = {};
        Object.entries(v as Record<string, unknown>).forEach(([k, val]) => {
            if (typeof val === "string") out[k] = val;
        });
        return out;
    } catch {
        return null;
    }
};

const getDefaultHeadersFromEnv = (): Record<string, string> => {
    const env = (import.meta as unknown as { env?: Record<string, unknown> }).env ?? {};
    const headers: Record<string, string> = {};

    // 1) 단일 헤더 주입(예: 아이디 헤더)
    const headerName = typeof env.VITE_API_HEADER_NAME === "string" ? env.VITE_API_HEADER_NAME.trim() : "";
    const headerValue = typeof env.VITE_API_HEADER_VALUE === "string" ? env.VITE_API_HEADER_VALUE : "";
    if (headerName && headerValue) headers[headerName] = headerValue;

    // 2) 복수 헤더(JSON) 주입: {"X-User-Id":"...", "Authorization":"Bearer ..."}
    const headersJson = typeof env.VITE_API_HEADERS_JSON === "string" ? env.VITE_API_HEADERS_JSON.trim() : "";
    if (headersJson) {
        const parsed = parseJsonObject(headersJson);
        if (parsed) Object.assign(headers, parsed);
    }

    return headers;
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
    const defaultHeaders = getDefaultHeadersFromEnv();

    const res = await fetch(url, {
        method: options.method ?? "GET",
        headers: {
            Accept: "application/json",
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...defaultHeaders,
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
