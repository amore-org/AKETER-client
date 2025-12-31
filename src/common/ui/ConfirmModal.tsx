import type { ReactNode } from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography, Button } from '@mui/material';
import { amoreTokens } from '../../styles/theme';

export type ConfirmModalTone = 'primary' | 'danger';

export interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  tone?: ConfirmModalTone;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  confirmDisabled?: boolean;
  description?: ReactNode;
  content?: ReactNode;
}

/**
 * 공통 ConfirmModal
 * - 확인/취소 2버튼 패턴을 통일한다.
 * - 복잡한 multi-step flow(예: 시간 변경 2단계)는 범위 밖이다.
 */
export const ConfirmModal = ({
  open,
  onClose,
  title,
  tone = 'primary',
  confirmText = '확인',
  cancelText = '닫기',
  onConfirm,
  confirmDisabled = false,
  description,
  content,
}: ConfirmModalProps) => {
  const confirmColor =
    tone === 'danger' ? amoreTokens.colors.status.red : amoreTokens.colors.brand.pacificBlue;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 900, color: tone === 'danger' ? confirmColor : undefined }}>
        {title}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5}>
          {description ? (
            <Typography variant="body2" sx={{ color: amoreTokens.colors.gray[700] }}>
              {description}
            </Typography>
          ) : null}
          {content}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          {cancelText}
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={confirmDisabled}
          sx={{ bgcolor: confirmColor }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};


