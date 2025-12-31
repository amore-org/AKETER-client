// src/common/ui/Pagination.tsx
import type { ChangeEvent } from 'react';
import styled from 'styled-components';
import { Pagination as MuiPagination, PaginationItem } from '@mui/material';
import { amoreTokens } from '../../styles/theme';

const StyledPagination = styled(MuiPagination)`
  & .MuiPaginationItem-root {
    font-family: ${amoreTokens.typography.fontFamily};
    font-size: ${amoreTokens.typography.size.body2};
    font-weight: 500;
    color: ${amoreTokens.colors.gray[600]};
    border-radius: ${amoreTokens.radius.base};
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

type PaginationProps = {
  count: number; // 전체 페이지 수
  page: number; // 현재 페이지
  onChange: (event: ChangeEvent<unknown>, value: number) => void;
};

export const Pagination = ({ count, page, onChange }: PaginationProps) => {
  return (
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
      sx={{ display: 'flex', justifyContent: 'center', py: amoreTokens.spacing(3) }}
    />
  );
};