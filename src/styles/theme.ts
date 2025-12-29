import { createTheme } from '@mui/material/styles';

/**
 * 1. 디자인 토큰 (Design Tokens) - REM 기반
 * 16px = 1rem 기준으로 변환되었습니다.
 */
export const amoreTokens = {
  colors: {
    brand: {
      amoreBlue: '#1F5795',
      pacificBlue: '#001C58',
    },
    common: {
      white: '#ffffff',
      black: '#000000',
    },
    navy: {
      50: '#f4f5f7', 100: '#eff0f2', 200: '#e5e7eb', 300: '#d1d5dc',
      400: '#99a1af', 500: '#6a7282', 700: '#364153',
    },
    blue: {
      50: '#eef8ff', 400: '#4ba8ff', 500: '#2896fc', 600: '#0884f7',
    },
    gray: {
      50: '#f5f5f5', 100: '#f0f0f0', 200: '#e5e5e5', 300: '#d4d4d4',
      400: '#a1a1a1', 500: '#797979', 600: '#525252', 700: '#404040',
      800: '#262626', 900: '#121212',
    },
    status: {
      red: '#ff4e4e',
      purple: '#6e52ff',
      pink: '#ec1fe2',
    },
    transparent: {
      white80: 'hsla(0, 0%, 100%, 0.8)',
      black05: 'rgba(0, 0, 0, 0.05)',
      black10: 'rgba(0, 0, 0, 0.1)',
      black40: 'rgba(0, 0, 0, 0.4)',
      black80: 'rgba(0, 0, 0, 0.8)',
    }
  },
  
  // 2. 스페이싱 (8px = 0.5rem 단위 그리드 시스템)
  spacing: (factor: number) => `${0.5 * factor}rem`,

  // 3. 타이포그래피 명세 (REM 단위)
  typography: {
    fontFamily: '"Pretendard Variable", Pretendard, -apple-system, sans-serif',
    size: {
      h1: '2rem',         // 32px
      h2: '1.5rem',       // 24px
      h3: '1.25rem',      // 20px
      h4: '1rem',      // 16px
      body1: '1rem',      // 16px
      body2: '0.875rem',  // 14px
      caption: '0.75rem', // 12px
    },
    weight: {
      regular: 400, medium: 500, semibold: 600, bold: 700,
    }
  }
};

/**
 * 2. MUI 테마 정의
 */
export const amoreTheme = createTheme({
  palette: {
    primary: {
      main: amoreTokens.colors.brand.pacificBlue,
      light: amoreTokens.colors.blue[400],
    },
    secondary: {
      main: amoreTokens.colors.brand.amoreBlue,
    },
    text: {
      primary: amoreTokens.colors.gray[900],
      secondary: amoreTokens.colors.gray[500],
    },
    background: {
      default: amoreTokens.colors.navy[50],
      paper: amoreTokens.colors.common.white,
    },
    divider: amoreTokens.colors.gray[200],
  },
  
  typography: {
    fontFamily: amoreTokens.typography.fontFamily,
    h1: { fontSize: amoreTokens.typography.size.h1, fontWeight: amoreTokens.typography.weight.bold },
    h2: { fontSize: amoreTokens.typography.size.h2, fontWeight: amoreTokens.typography.weight.bold },
    h3: { fontSize: amoreTokens.typography.size.h3, fontWeight: amoreTokens.typography.weight.semibold },
    body1: { fontSize: amoreTokens.typography.size.body1, fontWeight: amoreTokens.typography.weight.regular },
    body2: { fontSize: amoreTokens.typography.size.body2, fontWeight: amoreTokens.typography.weight.regular },
    caption: { fontSize: amoreTokens.typography.size.caption, fontWeight: amoreTokens.typography.weight.medium },
    button: { 
      fontSize: amoreTokens.typography.size.body2, 
      textTransform: 'none', 
      fontWeight: amoreTokens.typography.weight.semibold 
    },
  },

  // MUI 기본 간격을 8px로 설정하되, 내부적으로 rem으로 계산되도록 함
  spacing: 8,

  shape: {
    borderRadius: 0,
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '0.125rem', // 2px
          padding: '0.5rem 1.25rem', // 8px 20px
        },
      },
    },
  },
});