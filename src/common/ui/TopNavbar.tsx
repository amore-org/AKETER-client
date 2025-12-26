// src/common/ui/TopNavbar.tsx
import styled from 'styled-components';
import { AppBar, Toolbar, Typography, Box, IconButton, Avatar } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import { amoreTokens } from '../../styles/theme';

const StyledAppBar = styled(AppBar)`
  background-color: ${amoreTokens.colors.common.white} !important;
  color: ${amoreTokens.colors.gray[900]} !important;
  border-bottom: 1px solid ${amoreTokens.colors.navy[100]};
  box-shadow: none !important;
  height: ${amoreTokens.spacing(8)}; 
  display: flex;
  justify-content: center;
`;

const HeaderContent = styled(Toolbar)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  /* 최대 너비 설정 및 중앙 정렬 */
  max-width: 90rem; /* 1440px */
  margin: 0 auto;
  
  /* 핵심: 좌우 패딩을 rem으로 명시 (24px = 1.5rem) */
  padding: 0 ${amoreTokens.spacing(3)} !important; 
  
  /* 혹시 모를 내부 요소 잘림 방지 */
  box-sizing: border-box;
`;

const BrandLogo = styled(Typography)`
  font-weight: ${amoreTokens.typography.weight.bold} !important;
  color: ${amoreTokens.colors.brand.pacificBlue};
  letter-spacing: -0.05rem;
  font-size: ${amoreTokens.typography.size.h3} !important;
  cursor: pointer;
`;

export const TopNavbar = () => {
  return (
    <StyledAppBar position="fixed">
      <HeaderContent>
        {/* 왼쪽: 로고 영역 */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <BrandLogo>A'KETER</BrandLogo>
          <Typography 
            sx={{ 
              ml: amoreTokens.spacing(1.5), 
              fontSize: amoreTokens.typography.size.caption, 
              color: amoreTokens.colors.gray[500],
              fontWeight: amoreTokens.typography.weight.medium,
              display: { xs: 'none', md: 'block' } // 작은 화면에선 시스템명 숨김
            }}
          >
            AMOREPACIFIC
          </Typography>
        </Box>
        
        {/* 오른쪽: 유저 메뉴 영역 */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: amoreTokens.spacing(1)
        }}>
          <IconButton size="small" sx={{ color: amoreTokens.colors.gray[700] }}>
            <SearchIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" sx={{ color: amoreTokens.colors.gray[700] }}>
            <SettingsIcon fontSize="small" />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center', ml: amoreTokens.spacing(1) }}>
            <Typography 
              variant="body2" 
              sx={{ 
                mr: amoreTokens.spacing(1.5), 
                fontWeight: amoreTokens.typography.weight.semibold,
                display: { xs: 'none', sm: 'block' } 
              }}
            >
              임지민 님
            </Typography>
            <Avatar sx={{ 
              width: '2rem', 
              height: '2rem', 
              bgcolor: amoreTokens.colors.brand.amoreBlue,
              fontSize: '0.8rem'
            }}>
              JM
            </Avatar>
          </Box>
        </Box>
      </HeaderContent>
    </StyledAppBar>
  );
};