// src/common/ui/DetailDrawer.tsx
import dayjs from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { 
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Stack,
  Tooltip,
  TextField,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { amoreTokens } from '../../styles/theme';
import { AppChip, StatusChip } from './Chip';
import type { TableRowData } from './DataTable';
import { getStatusLabel } from '../../features/reservations/statusLabels';
import { Button as AppButton } from './Button';
import { channelBadgeSx } from './channel';
import { ConfirmModal, ScheduleChangeModal } from './ConfirmModal';
import { cancelReservation, getReservationDetail, mapReservationDtoToTableRow, updateReservationSchedule } from '../../api/reservations';

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
  onShowToast?: (payload: { severity: 'success' | 'info' | 'warning' | 'error'; message: string; detail?: string }) => void;
  onPatchRow?: (id: number, patch: Partial<TableRowData>) => void;
  onReplaceRow?: (row: TableRowData) => void;
  /**
   * 테이블에서 아이콘 클릭 등으로 "열리자마자" 특정 모달을 띄워야 할 때 사용.
   * (렌더 시점 초기값으로만 사용; row 변경 시에는 App에서 key로 remount하는 방식 권장)
   */
  initialDialog?: 'schedule' | 'cancel' | null;
}

export const DetailDrawer = ({
  open,
  onClose,
  data,
  onPersonaClick,
  onProductClick,
  onShowToast,
  onPatchRow,
  onReplaceRow,
  initialDialog = null,
}: DetailDrawerProps) => {
  const statusLabel = useMemo(() => {
    if (!data) return '';
    return getStatusLabel(data.status);
  }, [data]);

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [nextTime, setNextTime] = useState('');
  const fetchedDetailIdsRef = useRef<Set<number>>(new Set());

  const canEditSchedule = useMemo(() => {
    if (!data) return false;
    if (data.status !== 'info') return false;
    const scheduledAt = dayjs(`${data.date} ${data.time}`, 'YYYY-MM-DD HH:mm');
    if (!scheduledAt.isValid()) return false;
    return scheduledAt.isAfter(dayjs());
  }, [data]);

  // 드로어가 열렸을 때(또는 row가 바뀔 때) 상세 조회로 추천이유 등 보강
  useEffect(() => {
    if (!open || !data) return;
    // id 누락 시 /api/reservations/undefined 같은 잘못된 호출을 막는다.
    if (!Number.isFinite(data.id) || data.id <= 0) {
      onShowToast?.({
        severity: 'warning',
        message: '상세 정보를 불러올 수 없어요.',
        detail: '예약 ID가 올바르지 않아요.',
      });
      return;
    }
    // 동일 id에 대해 상세 조회는 1회만 수행(추천 이유가 null/undefined인 케이스에서도 무한 재시도 방지)
    if (fetchedDetailIdsRef.current.has(data.id)) return;
    if (data.recommendedReason != null) return; // 이미 값이 있으면 재조회 생략 (null/undefined만 재조회 대상)

    let cancelled = false;
    void (async () => {
      try {
        const detail = await getReservationDetail(data.id);
        if (cancelled) return;
        const row = mapReservationDtoToTableRow(detail);
        onReplaceRow?.(row);
      } catch (e) {
        // 상세 조회 실패는 치명적이지 않으므로 조용히 토스트만
        console.error(e);
        onShowToast?.({
          severity: 'warning',
          message: '상세 정보를 일부 불러오지 못했어요.',
          detail: '추천 이유 등 일부 항목이 누락될 수 있어요.',
        });
      } finally {
        // 성공/실패와 관계없이 1회 호출로 마킹(필요 시 사용자가 드로어를 닫았다가 다시 열면 재시도 가능)
        fetchedDetailIdsRef.current.add(data.id);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [data, onReplaceRow, onShowToast, open]);

  // initialDialog 처리(렌더 시점 초기값)
  useEffect(() => {
    if (!open || !data) return;
    if (initialDialog === 'schedule') setScheduleOpen(true);
    if (initialDialog === 'cancel') setCancelOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, data?.id]);

  // schedule modal 초기값
  useEffect(() => {
    if (!data) return;
    setNextTime(data.time);
  }, [data, open]);

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
            {data.channel ? (
                  <AppChip size="small" variant="outlined" tone="neutral" label={data.channel} sx={channelBadgeSx} />
                ) : (
                  <Typography variant="body2">-</Typography>
                )}
              <StatusChip status={data.status} label={statusLabel} />
                

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
                  <Tooltip title="페르소나 상세로 이동해요.">
                    <span>
                      <AppButton
                        variant="link"
                        linkKind="internal"
                        onClick={() => {
                          onPersonaClick(data);
                          // 드로어가 겹치지 않게 현재(발송 상세) 드로어는 닫는다.
                          onClose();
                        }}
                      >
                        {data.persona}
                      </AppButton>
                    </span>
                  </Tooltip>
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
                  <Tooltip title="아모레몰 상품 상세로 이동해요.">
                    <span>
                      <AppButton
                        variant="link"
                        linkKind="external"
                        onClick={() => onProductClick(data)}
                      >
                        {data.product}
                      </AppButton>
                    </span>
                  </Tooltip>
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

        {/* 3. 액션 */}
        <Divider sx={{ mt: 3, mb: 2 }} />
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <AppButton
            variant="secondary-outlined"
            onClick={() => setCancelOpen(true)}
            disabled={!canEditSchedule}
            title={!canEditSchedule ? '발송 예정 상태이며 미래 시간일 때만 취소할 수 있어요.' : undefined}
          >
            예약 취소
          </AppButton>
          <AppButton
            variant="primary"
            onClick={() => setScheduleOpen(true)}
            disabled={!canEditSchedule}
            title={!canEditSchedule ? '발송 예정 상태이며 미래 시간일 때만 변경할 수 있어요.' : undefined}
          >
            시간 변경
          </AppButton>
        </Stack>

        <ScheduleChangeModal
          open={scheduleOpen}
          row={data}
          onClose={() => setScheduleOpen(false)}
          value={nextTime}
          onChange={setNextTime}
          onConfirm={async ({ id }) => {
            if (!data || !nextTime) return;
            const scheduledAt = dayjs(`${data.date} ${nextTime}`, 'YYYY-MM-DD HH:mm');
            if (!scheduledAt.isValid()) {
              onShowToast?.({ severity: 'error', message: '시간 형식이 올바르지 않아요.' });
              return;
            }

            try {
              await updateReservationSchedule(id, scheduledAt.format('YYYY-MM-DDTHH:mm:ss'));
              onPatchRow?.(id, { time: nextTime });
              onShowToast?.({ severity: 'success', message: '발송 시간이 변경되었어요.' });
            } catch (e) {
              console.error(e);
              onShowToast?.({ severity: 'error', message: '시간 변경에 실패했어요.', detail: '잠시 후 다시 시도해 주세요.' });
            }
          }}
        />

        <ConfirmModal
          open={cancelOpen}
          onClose={() => {
            setCancelOpen(false);
            setCancelReason('');
          }}
          title="예약 취소"
          tone="danger"
          confirmText="취소 확정"
          cancelText="닫기"
          description={
            <>
              정말로 이 예약을 취소할까요?
              <br />
              #{data.id} · {data.persona} · {data.date} {data.time}
            </>
          }
          content={
            <TextField
              label="취소 사유(옵션)"
              placeholder="예: 캠페인 변경"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
          }
          onConfirm={async () => {
            if (!data) return;
            try {
              await cancelReservation(data.id, cancelReason.trim() ? cancelReason.trim() : undefined);
              onPatchRow?.(data.id, { status: 'error' });
              onShowToast?.({ severity: 'success', message: '예약이 취소되었어요.' });
              setCancelOpen(false);
              setCancelReason('');
            } catch (e) {
              console.error(e);
              onShowToast?.({ severity: 'error', message: '예약 취소에 실패했어요.', detail: '잠시 후 다시 시도해 주세요.' });
            }
          }}
        />
      </DrawerWrapper>
    </Drawer>
  );
};