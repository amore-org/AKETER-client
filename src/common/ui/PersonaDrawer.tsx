// src/common/ui/PersonaDrawer.tsx
import { useMemo, useState } from 'react';
import { Drawer, Box, Typography, IconButton, Divider, Stack, Tooltip, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import styled from 'styled-components';
import { amoreTokens } from '../../styles/theme';
import type { PersonaProfile } from '../../api/types';
import { AppChip, StatusChip } from './Chip';
import { getStatusLabel } from '../../features/reservations/statusLabels';
import { Button as AppButton } from './Button';
import { DetailDrawer } from './DetailDrawer';
import type { TableRowData } from './DataTable';
import { formatKoreanLevelLabel, personaLevelChipSx } from './personaLevel';
import { getReservationDetail, mapReservationDtoToTableRow } from '../../api/reservations';

const DrawerWrapper = styled(Box)`
  width: 30rem;
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

interface PersonaDrawerProps {
  open: boolean;
  onClose: () => void;
  data: PersonaProfile | null;
  onOpenHistory?: (personaId: string) => void;
}

export const PersonaDrawer = ({ open, onClose, data, onOpenHistory }: PersonaDrawerProps) => {
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedSend, setSelectedSend] = useState<TableRowData | null>(null);
  const [showAllHistory, setShowAllHistory] = useState(false);

  const renderValue = (v?: string) => (v && v.trim() ? v : '-');

  const historyToShow = useMemo(() => {
    const all = data?.recentSends ?? [];
    if (showAllHistory) return all;
    return all.slice(0, 10);
  }, [data?.recentSends, showAllHistory]);

  const canShowMoreButton = Boolean(!showAllHistory && (data?.recentSends?.length ?? 0) > 10);
  const canOpenHistory = Boolean(onOpenHistory);
  void canOpenHistory;

  const openSendDetail = async (send: NonNullable<PersonaProfile['recentSends']>[number]) => {
    if (!data) return;

    // 먼저 기본값으로 드로어 열기
    setSelectedSend({
      id: send.id,
      persona: data.persona,
      personaId: data.personaId,
      date: send.date,
      time: send.time,
      product: send.product,
      title: send.title,
      status: send.status,
      description: '',
    });
    setDetailOpen(true);

    // API 호출로 상세 정보(추천 이유 등) 가져오기
    try {
      const detail = await getReservationDetail(send.id);
      const row = mapReservationDtoToTableRow(detail);
      setSelectedSend(row);
    } catch (e) {
      console.error('발송 상세 조회 실패:', e);
    }
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={() => {
          setDetailOpen(false);
          onClose();
        }}
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          sx: {
            borderRadius: amoreTokens.radius.drawerRight,
            boxShadow: '-4px 0 10px rgba(0,0,0,0.05)',
          },
        }}
      >
        <DrawerWrapper>
        <DrawerHeader>
          <Typography variant="h3">{data?.persona ?? '페르소나 상세'}</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DrawerHeader>

        <Divider sx={{ mb: 3 }} />

        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          <Stack spacing={2}>
            {!data ? (
              <Typography variant="body2" sx={{ color: amoreTokens.colors.gray[600] }}>
                선택된 페르소나가 없어요.
              </Typography>
            ) : null}

            <InfoRow>
              <InfoLabel>유저 연령대</InfoLabel>
              <Typography variant="body2">{renderValue(data?.ageGroup)}</Typography>
            </InfoRow>

            <InfoRow>
              <InfoLabel>주력 카테고리</InfoLabel>
              <Typography variant="body2">{renderValue(data?.mainCategory)}</Typography>
            </InfoRow>

            <InfoRow>
              <InfoLabel>구매 방식</InfoLabel>
              <Typography variant="body2">{renderValue(data?.purchaseMethod)}</Typography>
            </InfoRow>

            <InfoRow>
              <InfoLabel>브랜드 충성도</InfoLabel>
              <AppChip
                label={formatKoreanLevelLabel(data?.brandLoyalty)}
                size="small"
                variant="filled"
                tone="neutral"
                sx={{ ...personaLevelChipSx(data?.brandLoyalty) }}
              />
            </InfoRow>

            <InfoRow>
              <InfoLabel>가격 민감도</InfoLabel>
              <AppChip
                label={formatKoreanLevelLabel(data?.priceSensitivity)}
                size="small"
                variant="filled"
                tone="neutral"
                sx={{ ...personaLevelChipSx(data?.priceSensitivity) }}
              />
            </InfoRow>

            <InfoRow>
              <InfoLabel>혜택 민감도</InfoLabel>
              <AppChip
                label={formatKoreanLevelLabel(data?.benefitSensitivity)}
                size="small"
                variant="filled"
                tone="neutral"
                sx={{ ...personaLevelChipSx(data?.benefitSensitivity) }}
              />
            </InfoRow>

            <InfoRow sx={{ alignItems: 'flex-start' }}>
              <InfoLabel sx={{ mt: '2px' }}>트렌드 키워드</InfoLabel>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                {(data?.trendKeywords?.length ? data.trendKeywords : ['-']).map((k, idx) => (
                  <AppChip key={`${k}-${idx}`} label={k} variant="filled" size="small" tone="neutral" />
                ))}
              </Stack>
            </InfoRow>

            <InfoRow sx={{ alignItems: 'flex-start' }}>
              <InfoLabel sx={{ mt: '2px' }}>핵심 키워드</InfoLabel>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                {(data?.coreKeywords?.length ? data.coreKeywords : ['-']).map((k, idx) => (
                  <AppChip key={`${k}-${idx}`} label={k} variant="filled" size="small" tone="neutral" />
                ))}
              </Stack>
            </InfoRow>

              <Box sx={{ border: `1px solid ${amoreTokens.colors.gray[200]}`, p: 2, borderRadius: amoreTokens.radius.base }}>
              <Typography
                variant="caption"
                sx={{ color: amoreTokens.colors.gray[500], fontWeight: 700, display: 'block', mb: 0.5 }}
              >
                발송 히스토리
              </Typography>

              <Stack
                spacing={1.25}
                sx={{ mt: 1.5 }}
                divider={<Divider flexItem sx={{ borderColor: amoreTokens.colors.gray[100] }} />}
              >
                {historyToShow.map((s) => (
                  <Box key={s.id} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 0.25 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Stack spacing={0.25} alignItems="flex-start" sx={{ minWidth: 0, textAlign: 'left' }}>
                        <Tooltip title="발송 상세로 이동해요.">
                          <span>
                            <AppButton
                              variant="link"
                              linkKind="internal"
                              onClick={() => openSendDetail(s)}
                              aria-label="발송 히스토리 상세 보기"
                            >
                              {s.title}
                            </AppButton>
                          </span>
                        </Tooltip>
                        <Typography variant="caption" sx={{ color: amoreTokens.colors.gray[600] }}>
                          {s.date} {s.time} · {s.product}
                        </Typography>
                      </Stack>
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <StatusChip status={s.status} label={getStatusLabel(s.status)} />
                    </Stack>
                  </Box>
                ))}

                {!data?.recentSends?.length && (
                  <Typography variant="body2" sx={{ color: amoreTokens.colors.gray[600] }}>
                    최근 발송 이력이 없어요.
                  </Typography>
                )}
              </Stack>

              {canShowMoreButton ? (
                <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setShowAllHistory(true)}
                    sx={{ borderColor: amoreTokens.colors.gray[200], color: amoreTokens.colors.gray[800] }}
                  >
                    더보기
                  </Button>
                </Box>
              ) : null}
            </Box>
          </Stack>
        </Box>

        {/* 하단 버튼 제거: 상세 Drawer 내 히스토리 섹션에서만 접근 */}
      </DrawerWrapper>
      </Drawer>

      <DetailDrawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        data={selectedSend}
      />
    </>
  );
};


