// src/App.tsx
import { Box, Typography } from '@mui/material';
import styled from 'styled-components';
import { TopNavbar } from './common/ui/TopNavbar';
import { MainTabs } from './common/ui/MainTabs';
import { amoreTokens } from './styles/theme';
import { DataTable } from './common/ui/DataTable';

const NAVBAR_HEIGHT = amoreTokens.spacing(8);
const TABS_HEIGHT = amoreTokens.spacing(6);

const ContentScrollArea = styled(Box)`
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  background-color: ${amoreTokens.colors.common.white};
  padding-top: calc(${NAVBAR_HEIGHT} + ${TABS_HEIGHT});
`;

const PageWrapper = styled(Box)`
  padding: ${amoreTokens.spacing(3)};
  max-width: 90rem;
  margin: 0 auto;
  box-sizing: border-box;
`;

function App() {
  return (
    <Box sx={{ height: '100vh', overflow: 'hidden' }}>
      <TopNavbar />

      <MainTabs />

      <ContentScrollArea>
      <PageWrapper>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 2 }}>
          <Box>
            <Typography variant="h3">오늘 발송 예약된 메시지를 확인해 주세요!</Typography>
          </Box>
        </Box>

        <DataTable />
      </PageWrapper>
      </ContentScrollArea>
    </Box>
  );
}

export default App;