// src/common/ui/MainTabs.tsx
import styled from 'styled-components';
import { Box, Tabs, Tab } from '@mui/material';
import { amoreTokens } from '../../styles/theme';

// 1. 탭 전체를 감싸는 컨테이너 (하단 테두리 포함)
const TabsContainer = styled(Box)`
  width: 100%;
  background-color: ${amoreTokens.colors.common.white};
  border-bottom: 1px solid ${amoreTokens.colors.navy[100]};
  /* TopNavbar 바로 아래에 고정 */
  position: fixed;
  top: ${amoreTokens.spacing(8)}; /* 4rem */
  left: 0;
  right: 0;
  z-index: 1099;
  height: ${amoreTokens.spacing(6)}; /* 3rem */
  display: flex;
  align-items: center;
  box-sizing: border-box;
`;

// 2. MUI Tab 개별 스타일 커스텀
const StyledTab = styled(Tab)`
  font-family: ${amoreTokens.typography.fontFamily} !important;
  font-size: ${amoreTokens.typography.size.body2} !important;
  font-weight: ${amoreTokens.typography.weight.semibold} !important;
  text-transform: none !important; /* 대문자 방지 */
  min-width: 7.5rem !important; /* 120px */
  min-height: 3rem !important;  /* 48px */
  padding: 0.75rem 1.5rem !important;
  color: ${amoreTokens.colors.gray[500]} !important;
  transition: all 0.2s ease;

  /* 활성화(Selected) 상태 */
  &.Mui-selected {
    color: ${amoreTokens.colors.brand.amoreBlue} !important;
  }

  /* 마우스 호버 시 */
  &:hover {
    color: ${amoreTokens.colors.brand.pacificBlue} !important;
    background-color: ${amoreTokens.colors.blue[50]};
  }
`;

export type MainTabItem = {
  label: string;
};

type MainTabsProps = {
  value: number;
  onChange: (newValue: number) => void;
  tabs?: MainTabItem[];
  ariaLabel?: string;
};

export const MainTabs = ({
  value,
  onChange,
  tabs = [{ label: '오늘 발송 예약' }, { label: '페르소나 유형' }, { label: '발송 추이 확인' }],
  ariaLabel = 'crm main tabs',
}: MainTabsProps) => {
  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    onChange(newValue);
  };

  return (
    <TabsContainer>
      <Box sx={{ maxWidth: '90rem', margin: '0 auto', width: '100%', px: amoreTokens.spacing(3), boxSizing: 'border-box' }}>
        <Tabs 
          value={value} 
          onChange={handleChange}
          aria-label={ariaLabel}
          sx={{ minHeight: amoreTokens.spacing(6) }}
          // 인디케이터(선) 스타일
          TabIndicatorProps={{
            style: { 
              backgroundColor: amoreTokens.colors.brand.amoreBlue,
              height: '2px' 
            }
          }}
        >
          {tabs.map((tab, idx) => (
            <StyledTab key={`${tab.label}-${idx}`} label={tab.label} />
          ))}
        </Tabs>
      </Box>
    </TabsContainer>
  );
};