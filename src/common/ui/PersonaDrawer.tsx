// src/common/ui/PersonaDrawer.tsx
import { Drawer, Box, Typography, IconButton, Divider, Stack, Button, Chip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import styled from 'styled-components';
import { amoreTokens } from '../../styles/theme';
import type { PersonaProfile } from '../../api/types';
import { StatusChip } from './Chip';
import { getStatusLabel } from './statusLabels';

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

const Label = styled(Typography)`
  color: ${amoreTokens.colors.gray[500]};
  font-size: ${amoreTokens.typography.size.caption};
  font-weight: 800;
  margin-bottom: ${amoreTokens.spacing(0.5)};
`;

interface PersonaDrawerProps {
  open: boolean;
  onClose: () => void;
  data: PersonaProfile | null;
  onOpenHistory?: (personaId: string) => void;
}

export const PersonaDrawer = ({ open, onClose, data, onOpenHistory }: PersonaDrawerProps) => {
  if (!data) return null;

  const openTrendTabInNewWindow = () => {
    const base = `${window.location.origin}${window.location.pathname}`;
    window.open(`${base}#/trend`, '_blank', 'noopener,noreferrer');
  };

  const renderValue = (v?: string) => (v && v.trim() ? v : '-');

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { borderRadius: amoreTokens.radius.drawerRight, boxShadow: '-4px 0 10px rgba(0,0,0,0.05)' },
      }}
    >
      <DrawerWrapper>
        <DrawerHeader>
          <Typography variant="h3">페르소나 유형 상세</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DrawerHeader>

        <Divider sx={{ mb: 3 }} />

        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          <Stack spacing={3}>
            <Box>
              <Label>페르소나</Label>
              <Typography variant="body1" sx={{ fontWeight: 800 }}>
                {data.persona}
              </Typography>
            </Box>

            <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
              <Box sx={{ minWidth: '10rem' }}>
                <Label>유저 연령대</Label>
                <Typography variant="body2">{renderValue(data.ageGroup)}</Typography>
              </Box>
              <Box sx={{ minWidth: '10rem' }}>
                <Label>주력 카테고리</Label>
                <Typography variant="body2">{renderValue(data.mainCategory)}</Typography>
              </Box>
              <Box sx={{ minWidth: '10rem' }}>
                <Label>구매 방식</Label>
                <Typography variant="body2">{renderValue(data.purchaseMethod)}</Typography>
              </Box>
              <Box sx={{ minWidth: '10rem' }}>
                <Label>브랜드 충성도</Label>
                <Typography variant="body2">{renderValue(data.brandLoyalty)}</Typography>
              </Box>
              <Box sx={{ minWidth: '10rem' }}>
                <Label>가격 민감도</Label>
                <Typography variant="body2">{renderValue(data.priceSensitivity)}</Typography>
              </Box>
              <Box sx={{ minWidth: '10rem' }}>
                <Label>혜택 민감도</Label>
                <Typography variant="body2">{renderValue(data.benefitSensitivity)}</Typography>
              </Box>
            </Stack>

            <Box>
              <Label>트렌드 키워드</Label>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                {(data.trendKeywords?.length ? data.trendKeywords : ['-']).map((k, idx) => (
                  <Chip key={`${k}-${idx}`} label={k} size="small" sx={{ borderRadius: amoreTokens.radius.base }} />
                ))}
              </Stack>
            </Box>

            <Box>
              <Label>핵심 키워드</Label>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                {(data.coreKeywords?.length ? data.coreKeywords : ['-']).map((k, idx) => (
                  <Chip key={`${k}-${idx}`} label={k} size="small" sx={{ borderRadius: amoreTokens.radius.base }} />
                ))}
              </Stack>
            </Box>

            <Box sx={{ border: `1px solid ${amoreTokens.colors.gray[200]}`, p: 2, borderRadius: amoreTokens.radius.base }}>
              <Label>발송 히스토리</Label>
              <Typography variant="caption" sx={{ color: amoreTokens.colors.gray[600] }}>
                최근 발송 5개 노출
              </Typography>

              <Stack spacing={1.25} sx={{ mt: 1.5 }}>
                {(data.recentSends?.length ? data.recentSends : []).slice(0, 5).map((s) => (
                  <Box key={s.id} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: amoreTokens.colors.gray[600] }}>
                        {s.date} {s.time} · {s.product}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <StatusChip status={s.status} label={getStatusLabel(s.status)} />
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={openTrendTabInNewWindow}
                        sx={{ borderRadius: amoreTokens.radius.base, whiteSpace: 'nowrap' }}
                      >
                        자세히보기
                      </Button>
                    </Stack>
                  </Box>
                ))}

                {!data.recentSends?.length && (
                  <Typography variant="body2" sx={{ color: amoreTokens.colors.gray[600] }}>
                    최근 발송 이력이 없습니다.
                  </Typography>
                )}
              </Stack>
            </Box>
          </Stack>
        </Box>

        <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => {
              if (onOpenHistory) onOpenHistory(data.personaId);
              else openTrendTabInNewWindow();
            }}
            sx={{ borderColor: amoreTokens.colors.gray[300], color: amoreTokens.colors.gray[700] }}
          >
            발송 히스토리 자세히보기(새창)
          </Button>
          <Button fullWidth variant="outlined" onClick={onClose} sx={{ borderColor: amoreTokens.colors.gray[300], color: amoreTokens.colors.gray[700] }}>
            닫기
          </Button>
        </Box>
      </DrawerWrapper>
    </Drawer>
  );
};


