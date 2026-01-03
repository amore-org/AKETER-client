import type { ReactNode } from 'react';
import { Alert, Snackbar, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { amoreTokens } from '../../styles/theme';

export type ToastSeverity = 'success' | 'info' | 'warning' | 'error';

export interface ToastState {
  open: boolean;
  severity: ToastSeverity;
  message: string;
  detail?: string;
}

export type ToastVariant = 'filled' | 'standard' | 'outlined';

export type ToastSeverityStyle = {
  /**
   * MUI Alert severity별 기본 색상 대신 커스텀을 쓰고 싶을 때 sx로 조정한다.
   * (예: CRM 브랜드 톤에 맞춘 success/info 컬러)
   */
  alertSx?: SxProps<Theme>;
  /**
   * severity별로 variant를 다르게 쓰고 싶을 때 사용한다.
   * (예: error/warning만 filled, info는 standard)
   */
  variant?: ToastVariant;
  /**
   * severity별로 autoHideDuration을 다르게 쓰고 싶을 때 사용한다.
   */
  autoHideDuration?: number;
};

export type ToastSeverityStyleMap = Partial<Record<ToastSeverity, ToastSeverityStyle>>;

export interface AppToastProps {
  toast: ToastState;
  onClose: () => void;
  autoHideDuration?: number;
  anchorOrigin?: { vertical: 'top' | 'bottom'; horizontal: 'left' | 'center' | 'right' };
  snackbarSx?: SxProps<Theme>;
  alertSx?: SxProps<Theme>;
  severityStyles?: ToastSeverityStyleMap;
  renderMessage?: (toast: ToastState) => ReactNode;
}

export const AppToast = ({
  toast,
  onClose,
  autoHideDuration = 2500,
  anchorOrigin = { vertical: 'top', horizontal: 'right' },
  snackbarSx,
  alertSx,
  severityStyles,
  renderMessage,
}: AppToastProps) => {
  const severityStyle = severityStyles?.[toast.severity];
  const resolvedAutoHideDuration = severityStyle?.autoHideDuration ?? autoHideDuration;
  const resolvedVariant: ToastVariant = severityStyle?.variant ?? 'filled';

  // 기본은 MUI severity 색상을 따르되, 브랜드 톤을 맞추고 싶으면 severityStyles로 덮어쓴다.
  const defaultAlertSx: SxProps<Theme> = {
    alignItems: 'flex-start',
    '& .MuiAlert-message': { width: '100%' },
  };

  const resolvedAlertSx: SxProps<Theme> = [
    defaultAlertSx,
    // info/success를 약간 더 브랜드 느낌으로 바꾸고 싶으면 여기 기본값을 건드리면 됨
    toast.severity === 'info'
      ? { backgroundColor: amoreTokens.colors.navy[700] ?? amoreTokens.colors.gray[900] }
      : null,
    toast.severity === 'success' ? { backgroundColor: amoreTokens.colors.brand.pacificBlue } : null,
    toast.severity === 'warning' ? { backgroundColor: amoreTokens.colors.navy[700] } : null,
    toast.severity === 'error' ? { backgroundColor: amoreTokens.colors.status.red } : null,
    severityStyle?.alertSx ?? null,
    alertSx ?? null,
  ].filter(Boolean) as SxProps<Theme>;

  return (
    <Snackbar
      open={toast.open}
      autoHideDuration={resolvedAutoHideDuration}
      onClose={onClose}
      anchorOrigin={anchorOrigin}
      sx={snackbarSx}
    >
      <Alert
        onClose={onClose}
        severity={toast.severity}
        variant={resolvedVariant}
        sx={resolvedAlertSx}
      >
        {renderMessage ? (
          renderMessage(toast)
        ) : (
          <>
            <Typography variant="body2" sx={{ fontWeight: 800 }}>
              {toast.message}
            </Typography>
            {toast.detail ? (
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                {toast.detail}
              </Typography>
            ) : null}
          </>
        )}
      </Alert>
    </Snackbar>
  );
};


