// src/common/ui/DetailDrawer.tsx
import styled from 'styled-components';
import { 
  Drawer, Box, Typography, IconButton, Divider, Stack, Button 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { amoreTokens } from '../../styles/theme';
import { StatusChip } from './Chip';
import type { TableRowData } from './DataTable';
import { getStatusLabel } from './statusLabels';

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

const InfoSection = styled(Box)`
  margin-bottom: ${amoreTokens.spacing(4)};
`;

const Label = styled(Typography)`
  color: ${amoreTokens.colors.gray[500]};
  font-size: ${amoreTokens.typography.size.caption};
  font-weight: 700;
  margin-bottom: ${amoreTokens.spacing(0.5)};
`;

interface DetailDrawerProps {
  open: boolean;
  onClose: () => void;
  data: TableRowData | null;
}

export const DetailDrawer = ({ open, onClose, data }: DetailDrawerProps) => {
  if (!data) return null;

  return (
    <Drawer 
      anchor="right" 
      open={open} 
      onClose={onClose}
      PaperProps={{
        sx: { borderRadius: 0, boxShadow: '-4px 0 10px rgba(0,0,0,0.05)' }
      }}
    >
      <DrawerWrapper>
        {/* 1. 헤더 */}
        <DrawerHeader>
          <Typography variant="h3">발송 상세 정보</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DrawerHeader>

        <Divider sx={{ mb: 3 }} />

        {/* 2. 콘텐츠 영역 */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          <InfoSection>
            <Label>상태</Label>
            <StatusChip 
              status={data.status} 
              label={getStatusLabel(data.status)} 
            />
          </InfoSection>

          <Stack spacing={3}>
            <Box>
              <Label>ID</Label>
              <Typography variant="body1">#{data.id}</Typography>
            </Box>

            <Box>
              <Label>타겟 페르소나</Label>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {data.persona}
              </Typography>
            </Box>

            <Box>
              <Label>발송 일시</Label>
              <Typography variant="body2">{`${data.date} ${data.time}`}</Typography>
            </Box>

            <Box>
              <Label>대상 상품</Label>
              <Typography variant="body2">{data.product}</Typography>
            </Box>

            <Box sx={{ bgcolor: amoreTokens.colors.navy[50], p: 2, borderRadius: '0.25rem' }}>
              <Label>메시지 문구</Label>
              <Typography variant="body2" sx={{ lineHeight: 1.6, mt: 1 }}>
                {data.message}
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* 3. 푸터 버튼 */}
        <Box sx={{ mt: 4, display: 'flex', gap: 1 }}>
          <Button 
            fullWidth 
            variant="outlined" 
            onClick={onClose}
            sx={{ borderColor: amoreTokens.colors.gray[300], color: amoreTokens.colors.gray[700] }}
          >
            닫기
          </Button>
          <Button 
            fullWidth 
            variant="contained" 
            sx={{ bgcolor: amoreTokens.colors.brand.pacificBlue }}
          >
            수정하기
          </Button>
        </Box>
      </DrawerWrapper>
    </Drawer>
  );
};