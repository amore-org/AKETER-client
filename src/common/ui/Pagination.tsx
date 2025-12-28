// src/common/ui/Pagination.tsx
import styled from 'styled-components';
import { Box, Pagination as MuiPagination, PaginationItem } from '@mui/material';
import { amoreTokens } from '../../styles/theme';

const PaginationContainer = styled(Box)`
  display: flex;
  justify-content: center;
  padding: ${amoreTokens.spacing(3)} 0;
  background-color: ${amoreTokens.colors.common.white};
  border: 1px solid ${amoreTokens.colors.navy[100]};
  border-top: none; /* 테이블 바로 아래 붙이기 위해 상단 테두리 제거 */
`;

const StyledPagination = styled(MuiPagination)`
  & .MuiPaginationItem-root {
    font-family: ${amoreTokens.typography.fontFamily};
    font-size: ${amoreTokens.typography.size.body2};
    font-weight: 500;
    color: ${amoreTokens.colors.gray[600]};
    border-radius: 0.125rem !important; /* 2px - 아모레 스타일 */
    margin: 0 2px;
    
    &:hover {
      background-color: ${amoreTokens.colors.blue[50]};
      color: ${amoreTokens.colors.brand.amoreBlue};
    }
    
    &.Mui-selected {
      background-color: ${amoreTokens.colors.brand.pacificBlue} !important;
      color: ${amoreTokens.colors.common.white} !important;
      font-weight: 700;
      
      &:hover {
        background-color: ${amoreTokens.colors.brand.amoreBlue} !important;
      }
    }
  }
`;

interface PaginationProps {
  count: number;     // 전체 페이지 수
  page: number;      // 현재 페이지
  onChange: (event: React.ChangeEvent<unknown>, value: number) => void;
}

export const Pagination = ({ count, page, onChange }: PaginationProps) => {
  return (
    <PaginationContainer>
      <StyledPagination 
        count={count} 
        page={page} 
        onChange={onChange}
        shape="rounded"
        color="primary"
        renderItem={(item) => (
          <PaginationItem 
            {...item}
            // 이전/다음 버튼 텍스트나 아이콘 커스텀 가능
          />
        )}
      />
    </PaginationContainer>
  );
};