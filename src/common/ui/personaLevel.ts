import { amoreTokens } from '../../styles/theme';
import type { SxProps, Theme } from '@mui/material/styles';

export type PersonaLevel = 'high' | 'mid' | 'low' | 'unknown';

export const parseKoreanLevel = (raw?: string): PersonaLevel => {
  const v = (raw ?? '').trim();
  if (!v || v === '-') return 'unknown';
  if (v.includes('상')) return 'high';
  if (v.includes('중')) return 'mid';
  if (v.includes('하')) return 'low';
  return 'unknown';
};

export const formatKoreanLevelLabel = (raw?: string): string => {
  const level = parseKoreanLevel(raw);
  switch (level) {
    case 'high':
      return '높음';
    case 'mid':
      return '보통';
    case 'low':
      return '낮음';
    case 'unknown':
    default:
      return '-';
  }
};

export const personaLevelChipSx = (raw?: string): SxProps<Theme> => {
  const level = parseKoreanLevel(raw);
  switch (level) {
    case 'high':
      return {
        backgroundColor: amoreTokens.colors.blue[50],
        color: amoreTokens.colors.brand.pacificBlue,
        fontWeight: amoreTokens.typography.weight.bold,
      };
    case 'mid':
      return {
        backgroundColor: amoreTokens.colors.navy[50],
        color: amoreTokens.colors.navy[700],
        fontWeight: amoreTokens.typography.weight.semibold,
      };
    case 'low':
      return {
        backgroundColor: amoreTokens.colors.gray[100],
        color: amoreTokens.colors.gray[700],
        fontWeight: amoreTokens.typography.weight.medium,
      };
    case 'unknown':
    default:
      return {
        backgroundColor: amoreTokens.colors.gray[50],
        color: amoreTokens.colors.gray[600],
        fontWeight: amoreTokens.typography.weight.medium,
      };
  }
};


