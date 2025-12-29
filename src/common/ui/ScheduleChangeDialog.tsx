// src/common/ui/ScheduleChangeDialog.tsx
import { useMemo, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Stack, Typography, Divider, TextField, Button } from '@mui/material';
import { amoreTokens } from '../../styles/theme';
import type { TableRowData } from './DataTable';

interface ScheduleChangeDialogProps {
  open: boolean;
  row: TableRowData | null;
  onClose: () => void;
  onConfirm?: (payload: { id: number; before: string; after: string }) => void;
}

export const ScheduleChangeDialog = ({ open, row, onClose, onConfirm }: ScheduleChangeDialogProps) => {
  const initial = useMemo(() => {
    if (!row) return { time: '' };
    return { time: row.time };
  }, [row]);

  const [step, setStep] = useState<'edit' | 'confirm'>('edit');
  const [nextTime, setNextTime] = useState(initial.time);

  // row가 바뀔 때만 초기화(부드러운 UX)
  if (row && nextTime !== initial.time && step === 'edit') {
    // noop: 사용자가 수정중일 수 있어 자동 동기화는 하지 않음
  }

  const before = row ? `${row.date} ${row.time}` : '';
  const after = row ? `${row.date} ${nextTime}` : '';

  return (
    <Dialog
      open={open}
      onClose={() => {
        setStep('edit');
        onClose();
      }}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle sx={{ fontWeight: 900 }}>시간 변경</DialogTitle>
      <DialogContent dividers>
        {!row ? (
          <Typography variant="body2" sx={{ color: amoreTokens.colors.gray[600] }}>
            선택된 항목이 없습니다.
          </Typography>
        ) : step === 'edit' ? (
          <Stack spacing={2}>
            <Typography variant="body2" sx={{ color: amoreTokens.colors.gray[700] }}>
              변경 전: {before} · 채널 {row.channel ?? '-'} · 대상 {row.recipientCount != null ? `${row.recipientCount.toLocaleString()}명` : '-'}
            </Typography>
            <TextField
              label="변경 시간(HH:mm)"
              type="time"
              value={nextTime}
              onChange={(e) => setNextTime(e.target.value)}
              fullWidth
              inputProps={{ step: 300 }}
            />
          </Stack>
        ) : (
          <Stack spacing={1.5}>
            <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
              변경 내용 확인
            </Typography>
            <Typography variant="body2" sx={{ color: amoreTokens.colors.gray[700] }}>
              변경 전: {before}
            </Typography>
            <Typography variant="body2" sx={{ color: amoreTokens.colors.gray[900], fontWeight: 800 }}>
              변경 후: {after}
            </Typography>
            <Divider />
            <Typography variant="body2" sx={{ color: amoreTokens.colors.gray[700] }}>
              채널: {row.channel ?? '-'} · 대상: {row.recipientCount != null ? `${row.recipientCount.toLocaleString()}명` : '-'}
            </Typography>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          variant="outlined"
          onClick={() => {
            if (step === 'confirm') setStep('edit');
            else {
              setStep('edit');
              onClose();
            }
          }}
        >
          {step === 'confirm' ? '뒤로' : '닫기'}
        </Button>
        {step === 'edit' ? (
          <Button variant="contained" onClick={() => setStep('confirm')} disabled={!row || !nextTime}>
            다음
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={() => {
              if (!row) return;
              onConfirm?.({ id: row.id, before, after });
              setStep('edit');
              onClose();
            }}
            sx={{ bgcolor: amoreTokens.colors.brand.pacificBlue }}
            disabled={!row || !nextTime}
          >
            변경 확정
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};


