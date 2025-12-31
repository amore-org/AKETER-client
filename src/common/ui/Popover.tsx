import type { ReactNode } from 'react';
import { Popover as MuiPopover } from '@mui/material';
import type { PopoverOrigin } from '@mui/material/Popover';
import type { SxProps, Theme } from '@mui/material/styles';
import { amoreTokens } from '../../styles/theme';

export interface PopoverProps {
  id?: string;
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  children: ReactNode;
  anchorOrigin?: PopoverOrigin;
  transformOrigin?: PopoverOrigin;
  paperSx?: SxProps<Theme>;
}

/**
 * 공통 Popover 래퍼
 * - 기본 borderRadius 등 공통 스타일 제공
 * - open/anchorEl/onClose 제어는 사용처에서 유지(회귀 최소화)
 */
export const Popover = ({
  id,
  open,
  anchorEl,
  onClose,
  children,
  anchorOrigin = { vertical: 'bottom', horizontal: 'left' },
  transformOrigin = { vertical: 'top', horizontal: 'left' },
  paperSx,
}: PopoverProps) => {
  return (
    <MuiPopover
      id={id}
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={anchorOrigin}
      transformOrigin={transformOrigin}
      slotProps={{
        paper: {
          sx: {
            borderRadius: amoreTokens.radius.base,
            width: { xs: '16rem', sm: '18rem' },
            '& .MuiButton-root': {
              minHeight: 30,
              padding: '0.25rem 0.625rem',
              fontSize: '0.8125rem',
            },
            ...paperSx,
          },
        },
      }}
    >
      {children}
    </MuiPopover>
  );
};
