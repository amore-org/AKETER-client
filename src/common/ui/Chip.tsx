import styled from 'styled-components';
import { Chip as MuiChip, type ChipProps as MuiChipProps } from '@mui/material';
import { amoreTokens } from '../../styles/theme';

// 1. 상태 타입 정의
export type ChipStatus = 'success' | 'error' | 'info';

export type AppChipTone = 'neutral' | ChipStatus;

interface StatusChipProps {
  status?: ChipStatus;
  label: string;
}

export interface AppChipProps extends Omit<MuiChipProps, 'color'> {
  tone?: AppChipTone;
}

const toneToColors = (tone: AppChipTone) => {
  switch (tone) {
    case 'success':
      return {
        bg: amoreTokens.colors.blue[50],
        fg: amoreTokens.colors.brand.amoreBlue,
        border: amoreTokens.colors.blue[400],
      };
    case 'error':
      return {
        bg: '#FFF0F0',
        fg: amoreTokens.colors.status.red,
        border: amoreTokens.colors.status.red,
      };
    case 'info':
      return {
        bg: amoreTokens.colors.navy[50],
        fg: amoreTokens.colors.navy[700],
        border: amoreTokens.colors.gray[300],
      };
    case 'neutral':
    default:
      return {
        bg: amoreTokens.colors.gray[50],
        fg: amoreTokens.colors.gray[600],
        border: amoreTokens.colors.gray[300],
      };
  }
};

// 2. 스타일 정의(공용)
const StyledAppChip = styled(MuiChip)<{ $tone: AppChipTone }>`
  && {
    height: 1.5rem; /* 24px */
    font-size: ${amoreTokens.typography.size.caption}; /* 0.75rem (12px) */
    font-weight: ${amoreTokens.typography.weight.semibold};
    border-radius: ${amoreTokens.radius.base};
  }
  
  /* 아모레몰 컬러 토큰 매핑 */
  && {
    background-color: ${({ $tone, variant }) => {
      const c = toneToColors($tone);
      return variant === 'outlined' ? amoreTokens.colors.common.white : c.bg;
    }};

    color: ${({ $tone }) => {
      const c = toneToColors($tone);
      return c.fg;
    }};

    border-color: ${({ $tone, variant }) => {
      const c = toneToColors($tone);
      return variant === 'outlined' ? c.border : 'transparent';
    }};
  }

  & .MuiChip-label {
    padding-left: ${amoreTokens.spacing(1)}; /* 0.5rem (8px) */
    padding-right: ${amoreTokens.spacing(1)};
  }
`;

/**
 * 공용 Chip(배지)
 * - MUI Chip을 감싸서 공통 스타일을 적용한다.
 * - `variant="outlined"` 등 props만 바꿔 바로 사용 가능하게 한다.
 */
export const AppChip = ({
  tone = 'neutral',
  size = 'small',
  variant = 'outlined',
  ...props
}: AppChipProps) => {
  return <StyledAppChip {...props} $tone={tone} size={size} variant={variant} />;
};

export const StatusChip = ({ status = 'info', label }: StatusChipProps) => {
  return (
    <AppChip label={label} tone={status} variant="filled" sx={{ fontWeight: amoreTokens.typography.weight.bold }} />
  );
};