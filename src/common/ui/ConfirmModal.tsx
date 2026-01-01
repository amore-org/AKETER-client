import type { ReactNode } from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography, Button, TextField } from '@mui/material';
import { amoreTokens } from '../../styles/theme';
import type { TableRowData } from './DataTable';

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
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth={false}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: '400px',
          maxWidth: 'calc(100vw - 32px)',
        },
      }}
    >
      <DialogTitle
        sx={{
          fontSize: amoreTokens.typography.size.h3,
          fontWeight: amoreTokens.typography.weight.bold,
          color: tone === 'danger' ? confirmColor : amoreTokens.colors.navy[700],
        }}
      >
        {title}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
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

export interface ScheduleChangeModalProps {
  open: boolean;
  row: TableRowData | null;
  onClose: () => void;
  value: string;
  onChange: (nextTime: string) => void;
  onConfirm?: (payload: { id: number; before: string; after: string }) => void;
}

/**
 * 시간 변경 모달(ConfirmModal 기반)
 * - TextField 기본값은 현재 발송 예정 시간(row.time)
 * - 실제 API 연동은 onConfirm 콜백에서 처리
 */
export const ScheduleChangeModal = ({ open, row, onClose, value, onChange, onConfirm }: ScheduleChangeModalProps) => {
  const before = row ? `${row.date} ${row.time}` : '';
  const after = row ? `${row.date} ${value}` : '';

  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      title="시간 변경"
      confirmText="변경 확정"
      cancelText="닫기"
      confirmDisabled={!row || !value}
      description={
        row ? (
          <>
            변경 전: {before}
            <br />
            채널 {row.channel ?? '-'} · 대상 {row.recipientCount != null ? `${row.recipientCount.toLocaleString()}명` : '-'}
          </>
        ) : (
          '선택된 항목이 없습니다.'
        )
      }
      content={
        <TextField
          label="변경 시간(HH:mm)"
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          fullWidth
          inputProps={{ step: 300 }}
        />
      }
      onConfirm={() => {
        if (!row || !value) return;
        onConfirm?.({ id: row.id, before, after });
        onClose();
      }}
    />
  );
};


