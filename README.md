# AKETER Client

CRM 메시지 자동 제작을 위한 AI Agent 클라이언트 애플리케이션입니다.

## 개발 환경 (Node)

이 프로젝트는 **Node.js 20+**를 기준으로 동작합니다.

## API 연결(로컬 개발)

Vite 개발 서버에서 `/api` 호출을 백엔드로 프록시하려면 아래 환경변수 중 하나를 설정하세요.

- `VITE_API_PROXY_TARGET`: (권장) 예) `http://localhost:8080`
- `VITE_API_BASE_URL`: proxy를 쓰지 않을 때 프론트가 직접 호출할 백엔드 base URL (CORS는 백엔드 설정 필요)

예시:

```bash
export VITE_API_PROXY_TARGET="http://localhost:8080"
npm run dev
```

### (선택) 공통 헤더 주입(예: 아이디/토큰)

- 단일 헤더:
  - `VITE_API_HEADER_NAME`, `VITE_API_HEADER_VALUE`
  - 예: `VITE_API_HEADER_NAME=X-User-Id`, `VITE_API_HEADER_VALUE=123`
- 복수 헤더(JSON):
  - `VITE_API_HEADERS_JSON`
  - 예: `VITE_API_HEADERS_JSON={"X-User-Id":"123","Authorization":"Bearer ..."}`

### asdf 사용 시

- 버전은 루트의 `.tool-versions`를 따릅니다.

```bash
asdf plugin add nodejs || true
asdf install
node -v
npm ci
npm run dev
```

# PUSH 권한 테스트
# 테스트

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
