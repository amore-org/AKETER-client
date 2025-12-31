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
  Chip,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  ListItemIcon,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { amoreTokens } from '../../styles/theme';
import { StatusChip } from './Chip';
import type { TableRowData } from './DataTable';
import { getStatusLabel } from './statusLabels';
import dayjs from 'dayjs';
import { Button as AppButton } from './Button';
import { ConfirmModal } from './ConfirmModal';

const EMPTY_RECIPIENTS: NonNullable<TableRowData['failedRecipients']> = [];

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
  initialDialog?: 'schedule' | 'cancel' | 'reprocess' | null;
}

export const DetailDrawer = ({ open, onClose, data, onPersonaClick, onProductClick, initialDialog = null }: DetailDrawerProps) => {
  const failedRecipients = data?.failedRecipients ?? EMPTY_RECIPIENTS;

  const isTrend = useMemo(() => {
    if (!data) return false;
    return data.successCount != null || data.errorCount != null || data.optoutCount != null;
  }, [data]);

  const hasFailure = useMemo(() => {
    if (!data) return false;
    return (data.errorCount ?? 0) > 0 || (data.optoutCount ?? 0) > 0 || failedRecipients.length > 0;
  }, [data, failedRecipients.length]);

  const statusLabel = useMemo(() => {
    if (!data) return '';
    if (isTrend) return hasFailure ? '실패' : '성공';
    return getStatusLabel(data.status);
  }, [data, hasFailure, isTrend]);

  const successCount = data?.successCount ?? 0;
  const failureCount = (data?.errorCount ?? 0) + (data?.optoutCount ?? 0);

  const [selectedUserIds, setSelectedUserIds] = useState<Record<string, boolean>>({});

  const initialSchedule = useMemo(() => {
    if (!data) return { time: '', open: false };
    const initial = dayjs(`${data.date} ${data.time}`, 'YYYY-MM-DD HH:mm');
    return {
      time: initial.isValid() ? initial.format('HH:mm') : '09:00',
      open: initialDialog === 'schedule',
    };
  }, [data, initialDialog]);

  const [scheduleDialogOpen, setScheduleDialogOpen] = useState<boolean>(initialSchedule.open);
  const [scheduleStep, setScheduleStep] = useState<'edit' | 'confirm'>('edit');
  const [nextTime, setNextTime] = useState<string>(initialSchedule.time);

  const [cancelDialogOpen, setCancelDialogOpen] = useState(initialDialog === 'cancel');
  const [cancelReason, setCancelReason] = useState('');

  const [reprocessDialogOpen, setReprocessDialogOpen] = useState(initialDialog === 'reprocess');

  const channelBadgeSx = {
    borderRadius: amoreTokens.radius.base,
    borderColor: amoreTokens.colors.gray[300],
    color: amoreTokens.colors.gray[500],
    bgcolor: amoreTokens.colors.common.white,
    fontWeight: amoreTokens.typography.weight.semibold,
  } as const;

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const selectedErrorUserIds = useMemo(
    () =>
      failedRecipients
    .filter((r) => r.failureType === 'error' && selectedUserIds[r.userId])
    .map((r) => r.userId),
    [failedRecipients, selectedUserIds],
  );

  const handleRequestReprocess = () => {
    // TODO: 실제 재처리 API 연동 필요 (유저 ID 단위)
    if (!data) return;
    console.log('[재처리 요청]', { sendId: data.id, userIds: selectedErrorUserIds });
  };

  const handleChangeSchedule = () => {
    if (!data) return;
    const initial = dayjs(`${data.date} ${data.time}`, 'YYYY-MM-DD HH:mm');
    setNextTime(initial.isValid() ? initial.format('HH:mm') : '09:00');
    setScheduleStep('edit');
    setScheduleDialogOpen(true);
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
              {isTrend ? (
                <>
                  {successCount > 0 ? <StatusChip status="success" label={`성공 ${successCount}건`} /> : null}
                  {failureCount > 0 ? <StatusChip status="error" label={`실패 ${failureCount}건`} /> : null}
                  {successCount === 0 && failureCount === 0 ? <StatusChip status={data.status} label={statusLabel} /> : null}
                </>
              ) : (
                <StatusChip status={data.status} label={statusLabel} />
              )}
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

            {!isTrend ? (
              <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
                <InfoRow>
                  <InfoLabel>채널</InfoLabel>
                  {data.channel ? (
                    <Chip size="small" variant="outlined" label={data.channel} sx={channelBadgeSx} />
                  ) : (
                    <Typography variant="body2">-</Typography>
                  )}
                </InfoRow>
                <InfoRow>
                  <InfoLabel>대상 규모</InfoLabel>
                  <Typography variant="body2">
                    {data.recipientCount != null ? `${data.recipientCount.toLocaleString()}명` : '-'}
                  </Typography>
                </InfoRow>
              </Stack>
            ) : null}

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

            {isTrend && hasFailure && (
              <Box sx={{ border: `1px solid ${amoreTokens.colors.gray[200]}`, p: 2, borderRadius: amoreTokens.radius.base }}>
                <Stack spacing={1} margin={0}>
                  <Box display="flex" flexDirection="row" gap={1} alignItems="center">
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      실패 항목
                    </Typography>
                    <Typography variant="body2" sx={{ color: amoreTokens.colors.gray[700] }}>
                      오류 {(data.errorCount ?? 0).toLocaleString()}건 · 수신거부 {(data.optoutCount ?? 0).toLocaleString()}건
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: amoreTokens.colors.gray[400] }}>
                    * 재처리는 유저 ID 단위이며, ‘오류’로 분류된 유저만 요청할 수 있습니다.
                  </Typography>
                  <div>
                    {failedRecipients.length > 0 ? (
                      <List dense sx={{ p: 0, m: 0 }}>
                        {failedRecipients.map((r) => {
                          const disabled = r.failureType === 'optout';
                          const checked = Boolean(selectedUserIds[r.userId]);
                          const rowLabel = `${r.name} (${r.userId})`;
                          const reasonLabel = r.failureType === 'error' ? '오류' : '수신 거부';
                          const disabledReason = '수신 거부 건은 재처리할 수 없습니다.';
                          const enabledHint = '오류 건만 선택해 재처리 요청할 수 있습니다.';
                          const tooltipTitle = disabled ? disabledReason : enabledHint;
                          return (
                            <Tooltip key={r.userId} title={tooltipTitle} placement="top" arrow>
                              <Box>
                                <ListItem
                                  sx={{
                                    px: 0,
                                    py: 0.25,
                                    cursor: disabled ? 'not-allowed' : 'pointer',
                                    opacity: disabled ? 0.45 : 1,
                                    '&:hover': {
                                      bgcolor: disabled ? 'transparent' : amoreTokens.colors.blue[50],
                                    },
                                  }}
                                  disableGutters
                                  secondaryAction={
                                    <Typography variant="caption" sx={{ color: amoreTokens.colors.gray[600] }}>
                                      {reasonLabel}
                                      {r.failureMessage ? ` · ${r.failureMessage}` : ''}
                                    </Typography>
                                  }
                                  onClick={!disabled ? () => toggleUser(r.userId) : undefined}
                                >
                                  <ListItemIcon sx={{ minWidth: '2rem' }}>
                                    <span style={{ display: 'inline-flex', cursor: disabled ? 'not-allowed' : 'pointer' }}>
                                      <Checkbox
                                        edge="start"
                                        size="small"
                                        disabled={disabled}
                                        checked={checked}
                                        tabIndex={-1}
                                        disableRipple
                                      />
                                    </span>
                                  </ListItemIcon>
                                  <ListItemText
                                    primaryTypographyProps={{
                                      variant: 'body2',
                                      sx: { color: disabled ? amoreTokens.colors.gray[400] : undefined },
                                    }}
                                    primary={rowLabel}
                                  />
                                </ListItem>
                              </Box>
                            </Tooltip>
                          );
                        })}
                      </List>
                    ) : (
                      <Typography variant="body2" sx={{ color: amoreTokens.colors.gray[600] }}>
                        실패자가 없습니다.
                      </Typography>
                    )}
                  </div>
                </Stack>
              </Box>
            )}
          </Stack>
        </Box>

        {/* 3. 푸터 버튼 */}
        <Box sx={{ pt: 2 }}>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={1}>
            {isTrend ? (
              hasFailure ? (
              <Button
                fullWidth
                variant="contained"
                onClick={() => setReprocessDialogOpen(true)}
                disabled={selectedErrorUserIds.length === 0}
                sx={{ bgcolor: amoreTokens.colors.brand.pacificBlue }}
              >
                재처리 요청
              </Button>
              ) : null
            ) : (
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
                  sx={{ borderColor: amoreTokens.colors.status.red, color: amoreTokens.colors.status.red }}
                >
                  취소
                </Button>
              </>
            )}
          </Stack>
        </Box>

        {/* 시간 변경 Modal (2단계 확인) */}
        <Dialog open={scheduleDialogOpen} onClose={() => setScheduleDialogOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle sx={{ fontWeight: 900 }}>시간 변경</DialogTitle>
          <DialogContent dividers>
            {scheduleStep === 'edit' ? (
              <Stack spacing={2}>
                <Typography variant="body2" sx={{ color: amoreTokens.colors.gray[700] }}>
                  변경 전: {`${data.date} ${data.time}`} · 채널 {data.channel ?? '-'} · 대상 {data.recipientCount != null ? `${data.recipientCount.toLocaleString()}명` : '-'}
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
                  변경 전: {`${data.date} ${data.time}`}
                </Typography>
                <Typography variant="body2" sx={{ color: amoreTokens.colors.gray[900], fontWeight: 800 }}>
                  변경 후: {`${data.date} ${nextTime}`}
                </Typography>
                <Divider />
                <Typography variant="body2" sx={{ color: amoreTokens.colors.gray[700] }}>
                  채널: {data.channel ?? '-'} · 대상: {data.recipientCount != null ? `${data.recipientCount.toLocaleString()}명` : '-'}
                </Typography>
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              variant="outlined"
              onClick={() => {
                if (scheduleStep === 'confirm') setScheduleStep('edit');
                else setScheduleDialogOpen(false);
              }}
            >
              {scheduleStep === 'confirm' ? '뒤로' : '취소'}
            </Button>
            {scheduleStep === 'edit' ? (
              <Button
                variant="contained"
                onClick={() => setScheduleStep('confirm')}
                disabled={!nextTime}
              >
                다음
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={() => {
                  // TODO: 실제 스케줄 변경 API 연동 필요
                  console.log('[발송 시간 변경]', {
                    id: data.id,
                    before: `${data.date} ${data.time}`,
                    after: `${data.date} ${nextTime}`,
                    channel: data.channel,
                    recipientCount: data.recipientCount,
                  });
                  setScheduleDialogOpen(false);
                }}
                sx={{ bgcolor: amoreTokens.colors.brand.pacificBlue }}
              >
                변경 확정
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* 취소 Confirm Modal */}
        <ConfirmModal
          open={cancelDialogOpen}
          onClose={() => setCancelDialogOpen(false)}
          title="발송 취소"
          tone="danger"
          confirmText="취소 확정"
          cancelText="닫기"
          description={
            <>
              ID #{data.id} · {data.persona}
              <br />
              발송 일시 {`${data.date} ${data.time}`} · 채널 {data.channel ?? '-'} · 대상{' '}
              {data.recipientCount != null ? `${data.recipientCount.toLocaleString()}명` : '-'}
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

        {/* 재처리 요청 Confirm Modal */}
        <ConfirmModal
          open={reprocessDialogOpen}
          onClose={() => setReprocessDialogOpen(false)}
          title="재처리 요청"
          confirmText="요청 확정"
          cancelText="닫기"
          confirmDisabled={selectedErrorUserIds.length === 0}
          description={
            <>
              ID #{data.id} · 선택된 오류 유저 {selectedErrorUserIds.length}명
              <br />
              <Typography component="span" variant="caption" sx={{ color: amoreTokens.colors.gray[600] }}>
                수신거부 유저는 선택/재처리할 수 없습니다.
              </Typography>
            </>
          }
          onConfirm={() => {
            handleRequestReprocess();
            setReprocessDialogOpen(false);
          }}
        />
      </DrawerWrapper>
    </Drawer>
  );
};