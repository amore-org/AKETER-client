// src/common/ui/DetailDrawer.tsx
import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { 
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Stack,
  Button,
  TextField,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { amoreTokens } from '../../styles/theme';
import { AppChip, StatusChip } from './Chip';
import type { TableRowData } from './DataTable';
import { getStatusLabel } from '../../features/reservations/statusLabels';
import { Button as AppButton } from './Button';
import { ConfirmModal, ScheduleChangeModal } from './ConfirmModal';
import { channelBadgeSx } from './channel';

const DrawerWrapper = styled(Box)`
  width: 30rem; /* 480px */
  padding: ${amoreTokens.spacing(4)};
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const DrawerHeader = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${amoreTokens.spacing(3)};
`;

const InfoRow = styled(Box)`
  display: flex;
  align-items: center;
  gap: ${amoreTokens.spacing(2)};
`;

const InfoLabel = styled(Typography)`
  color: ${amoreTokens.colors.gray[500]};
  font-size: ${amoreTokens.typography.size.caption};
  font-weight: 700;
  min-width: 6.5rem;
  flex: 0 0 auto;
`;

interface DetailDrawerProps {
  open: boolean;
  onClose: () => void;
  data: TableRowData | null;
  onPersonaClick?: (row: TableRowData) => void;
  onProductClick?: (row: TableRowData) => void;
  /**
   * 테이블에서 아이콘 클릭 등으로 "열리자마자" 특정 모달을 띄워야 할 때 사용.
   * (렌더 시점 초기값으로만 사용; row 변경 시에는 App에서 key로 remount하는 방식 권장)
   */
  initialDialog?: 'schedule' | 'cancel' | null;
}

export const DetailDrawer = ({ open, onClose, data, onPersonaClick, onProductClick, initialDialog = null }: DetailDrawerProps) => {
  const canEditSchedule = Boolean(data && data.status === 'info');

  const statusLabel = useMemo(() => {
    if (!data) return '';
    return getStatusLabel(data.status);
  }, [data]);

  const [scheduleModalOpen, setScheduleModalOpen] = useState<boolean>(initialDialog === 'schedule');
  const [nextTime, setNextTime] = useState<string>(data?.time ?? '');

  const [cancelDialogOpen, setCancelDialogOpen] = useState(initialDialog === 'cancel');
  const [cancelReason, setCancelReason] = useState('');

  const handleChangeSchedule = () => {
    if (!data) return;
    setNextTime(data.time ?? '');
    setScheduleModalOpen(true);
  };

  const handleCancelSend = () => {
    if (!data) return;
    setCancelDialogOpen(true);
  };

  if (!data) return null;

  return (
    <Drawer 
      anchor="right" 
      open={open} 
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: amoreTokens.radius.drawerRight,
          boxShadow: '-4px 0 10px rgba(0,0,0,0.05)',
          overflow: 'hidden',
        },
      }}
    >
      <DrawerWrapper>
        {/* 1. 헤더 */}
        <DrawerHeader>
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h3">발송 상세 정보</Typography>
              <Typography variant="caption" sx={{ color: amoreTokens.colors.gray[600], fontWeight: 700 }}>
                #{data.id}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <StatusChip status={data.status} label={statusLabel} />
                {data.channel ? (
                  <AppChip size="small" variant="outlined" tone="neutral" label={data.channel} sx={channelBadgeSx} />
                ) : (
                  <Typography variant="body2">-</Typography>
                )}

                <Typography variant="body2">
                  {data.recipientCount != null ? `${data.recipientCount.toLocaleString()}명` : '-'}
                </Typography>
            </Stack>
          </Stack>

          <IconButton onClick={onClose} size="small" sx={{ alignSelf: 'flex-start' }}>
            <CloseIcon />
          </IconButton>
        </DrawerHeader>

        <Divider sx={{ mb: 3 }} />

        {/* 2. 콘텐츠 영역 */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          <Stack spacing={2}>
            <InfoRow>
              <InfoLabel>발송 일시</InfoLabel>
              <Typography variant="body2">{`${data.date} ${data.time}`}</Typography>
            </InfoRow>
            <InfoRow>
              <InfoLabel>타겟 페르소나</InfoLabel>
              <Box sx={{ minWidth: 0 }}>
                {onPersonaClick ? (
                  <AppButton
                    variant="link"
                    linkKind="internal"
                    onClick={() => onPersonaClick(data)}
                  >
                    {data.persona}
                  </AppButton>
                ) : (
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {data.persona}
                  </Typography>
                )}
              </Box>
            </InfoRow>

            <InfoRow>
              <InfoLabel>대상 상품</InfoLabel>
              <Box sx={{ minWidth: 0 }}>
                {onProductClick ? (
                  <AppButton
                    variant="link"
                    linkKind="external"
                    onClick={() => onProductClick(data)}
                  >
                    {data.product}
                  </AppButton>
                ) : (
                  <Typography variant="body2">{data.product}</Typography>
                )}
              </Box>
            </InfoRow>

            <InfoRow>
              <InfoLabel>추천 이유</InfoLabel>
              <Typography variant="body2" sx={{ color: amoreTokens.colors.gray[800] }}>
                {data.recommendedReason ?? '-'}
              </Typography>
            </InfoRow>

            <Box sx={{ bgcolor: amoreTokens.colors.navy[50], p: 2, borderRadius: amoreTokens.radius.base }}>
              <Stack spacing={1}>
                <Box>
                  <Typography variant="caption" sx={{ color: amoreTokens.colors.gray[600], fontWeight: amoreTokens.typography.weight.semibold }}>
                    Title
                  </Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1.6, mt: 0.25, fontWeight: 700 }}>
                    {data.title}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: amoreTokens.colors.gray[600], fontWeight: amoreTokens.typography.weight.semibold }}>
                    Description
                  </Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1.6, mt: 0.25 }}>
                    {data.description}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Stack>
        </Box>

        {/* 3. 푸터 버튼 */}
        <Box sx={{ pt: 2 }}>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={1}>
            {canEditSchedule ? (
              <>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleChangeSchedule}
                  sx={{ bgcolor: amoreTokens.colors.brand.pacificBlue }}
                >
                  시간 변경
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleCancelSend}
                  sx={{ borderColor: amoreTokens.colors.navy[300], color: amoreTokens.colors.navy[700] }}
                >
                  발송 취소
                </Button>
              </>
            ) : null}
          </Stack>
        </Box>

        <ScheduleChangeModal
          open={scheduleModalOpen}
          row={data}
          value={nextTime}
          onChange={setNextTime}
          onClose={() => setScheduleModalOpen(false)}
          onConfirm={(payload) => {
            // TODO: 실제 스케줄 변경 API 연동 필요
            console.log('[발송 시간 변경]', payload);
          }}
        />

        {/* 취소 Confirm Modal */}
        <ConfirmModal
          open={cancelDialogOpen}
          onClose={() => setCancelDialogOpen(false)}
          title="발송 취소"
          tone='primary'
          confirmText="취소 확정"
          cancelText="닫기"
          description={
            <>
              #{data.id} · {data.persona}
              <br />
              발송 일시: {`${data.date} ${data.time}`} · 채널 {data.channel ?? '-'} · 대상{' '}
              {data.recipientCount != null ? `${data.recipientCount.toLocaleString()}명` : '-'}
              <br />
            </>
          }
          content={
            <TextField
              label="취소 사유(선택)"
              placeholder="예: 프로모션 정책 변경"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              fullWidth
            />
          }
          onConfirm={() => {
            // TODO: 실제 취소 API 연동 필요
            console.log('[발송 취소]', { id: data.id, reason: cancelReason });
            setCancelDialogOpen(false);
          }}
        />
      </DrawerWrapper>
    </Drawer>
  );
};