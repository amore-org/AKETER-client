import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 일부 환경에서 `.env` 파일 접근이 EPERM으로 막힐 수 있어 방어적으로 로드한다.
  const env = (() => {
    try {
      return loadEnv(mode, process.cwd(), '');
    } catch {
      return {};
    }
  })();

  // 기본 동작:
  // - src/api/http.ts 는 `/api/...` same-origin 호출
  // - dev 서버에서는 아래 proxy가 없으면 5173에서 `/api`를 받아버려 백엔드 연결 실패가 발생
  //
  // 우선순위:
  // 1) VITE_API_PROXY_TARGET (권장: 예) http://localhost:8080
  // 2) VITE_API_BASE_URL (이미 쓰고 있다면 동일 값을 proxy target으로도 활용 가능)
  // NOTE: loadEnv는 기본적으로 `.env*` 파일을 읽기 때문에, 셸에서 export한 값까지는 포함되지 않을 수 있다.
  // 로컬에서 `export VITE_API_PROXY_TARGET=...` 형태로 쓰는 경우를 위해 process.env도 fallback으로 본다.
  const proxyTarget =
    env.VITE_API_PROXY_TARGET ||
    env.VITE_API_BASE_URL ||
    process.env.VITE_API_PROXY_TARGET ||
    process.env.VITE_API_BASE_URL;

  return {
    plugins: [react()],
    server: proxyTarget
      ? {
          proxy: {
            '/api': {
              target: proxyTarget,
              changeOrigin: true,
              secure: false,
            },
          },
        }
      : undefined,
  };
});
