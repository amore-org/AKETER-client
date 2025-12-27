import { Box, Typography } from '@mui/material';
import { useState } from 'react';
import styled from 'styled-components';
import { TopNavbar } from './common/ui/TopNavbar';
import { MainTabs } from './common/ui/MainTabs';
import { DataTable } from './common/ui/DataTable';
import type { TableRowData } from './common/ui/DataTable';
import { amoreTokens } from './styles/theme';
import { Pagination } from './common/ui/Pagination';

const NAVBAR_HEIGHT = amoreTokens.spacing(8); // 4rem
const TABS_HEIGHT = amoreTokens.spacing(6); // 3rem

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

const mockRows: TableRowData[] = [
  {
    id: 1001,
    persona: '바쁜 워커홀릭 20대 여성 (출근 전 5분 스킨케어)',
    date: '2025-12-27',
    time: '09:00',
    product: '라네즈 워터뱅크 블루 히알루로닉 크림',
    message: '출근 준비로 바쁘죠? 5분 보습 루틴으로 촉촉하게 시작해요. 오늘만 한정 혜택 확인하기',
    status: 'info',
  },
  {
    id: 1002,
    persona: '피부 컨디션 민감한 30대 남성 (미니멀 루틴)',
    date: '2025-12-27',
    time: '10:30',
    product: '아이오페 맨 올인원 리차징 로션',
    message: '번들거림은 줄이고 수분은 채우는 올인원. 간편하게 바꿔보세요. 상품 상세 보기',
    status: 'info',
  },
  {
    id: 1003,
    persona: '트렌드에 민감한 20대 (신상/한정판 선호)',
    date: '2025-12-27',
    time: '11:00',
    product: '헤라 센슈얼 누드 글로스 (홀리데이 컬러)',
    message: '지금 가장 핫한 홀리데이 컬러, 놓치면 품절! 오늘 발송 혜택으로 먼저 만나보세요',
    status: 'warning',
  },
  {
    id: 1004,
    persona: '가성비 중시 20대 직장인 (쿠폰/적립금 민감)',
    date: '2025-12-27',
    time: '12:00',
    product: '이니스프리 그린티 씨드 세럼',
    message: '점심시간 10분 쇼핑 찬스! 쿠폰 적용 가능한 대표 보습 세럼, 지금 확인해요',
    status: 'info',
  },
  {
    id: 1005,
    persona: '건조한 겨울철 케어가 급한 30대 여성 (보습 집착)',
    date: '2025-12-27',
    time: '13:30',
    product: '에스트라 아토베리어365 크림',
    message: '당김·건조가 심해졌다면 장벽부터 케어해요. 베스트 보습 크림 상세 확인',
    status: 'info',
  },
  {
    id: 1006,
    persona: '프리미엄 선호 40대 (안티에이징/브랜드 충성)',
    date: '2025-12-27',
    time: '14:00',
    product: '설화수 자음생크림',
    message: '연말엔 탄탄한 피부 컨디션이 답. 자음생 라인으로 집중 케어 시작해보세요',
    status: 'info',
  },
  {
    id: 1007,
    persona: '선물 고민 많은 30대 (기프트/세트 선호)',
    date: '2025-12-27',
    time: '15:00',
    product: '헤라 베스트 기프트 세트',
    message: '선물 고민 끝! 베스트 셀러로 구성된 기프트 세트, 재고 소진 전 확인하세요',
    status: 'default',
  },
  {
    id: 1008,
    persona: '야외 활동 많은 20대 (톤업/선케어 관심)',
    date: '2025-12-27',
    time: '16:30',
    product: '라네즈 워터뱅크 톤업 선크림',
    message: '톤업+자외선 차단을 한 번에. 오늘 나가기 전, 가볍게 챙겨보세요',
    status: 'info',
  },
  {
    id: 1009,
    persona: '모공/피지 고민 20대 (클린 뷰티 관심)',
    date: '2025-12-27',
    time: '18:00',
    product: '이니스프리 화산송이 모공 클레이 마스크',
    message: '하루 마무리는 깔끔하게. 모공·피지 케어로 주말 약속 전 피부를 정리해요',
    status: 'info',
  },
  {
    id: 1010,
    persona: '퇴근 후 홈케어 루틴러 30대 (팩/앰플 루틴)',
    date: '2025-12-27',
    time: '20:30',
    product: '아이오페 슈퍼바이탈 앰플',
    message: '오늘 하루 고생했어요. 퇴근 후 1단계 앰플로 탄탄한 컨디션을 채워보세요',
    status: 'success',
  },
];

function App() {
  const [tabValue, setTabValue] = useState(0);

  return (
    <Box sx={{ height: '100vh', overflow: 'hidden' }}>
      <TopNavbar />
      <MainTabs value={tabValue} onChange={setTabValue} />

      <ContentScrollArea>
        <PageWrapper>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 2 }}>
            <Box>
              <Typography variant="h3">오늘 발송 예약된 메시지를 확인해 주세요!</Typography>
            </Box>
          </Box>

          <DataTable rows={mockRows} />
          <Pagination
            count={10} 
            page={1} 
            onChange={(event: React.ChangeEvent<unknown>, value: number) => {
              console.log(event, value);
            }} 
          />
        </PageWrapper>
      </ContentScrollArea>
    </Box>
  );
}

export default App;