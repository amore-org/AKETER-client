import styled from 'styled-components';
import { Chip } from '@mui/material';
import { amoreTokens } from '../../styles/theme';

// 1. 상태 타입 정의
export type ChipStatus = 'success' | 'warning' | 'error' | 'info' | 'default';

interface StatusChipProps {
  status?: ChipStatus;
  label: string;
}

// 2. 스타일 정의
const StyledStatusChip = styled(Chip)<{ $status?: ChipStatus }>`
  height: 1.5rem !important; /* 24px */
  font-size: ${amoreTokens.typography.size.caption} !important; /* 0.75rem (12px) */
  font-weight: ${amoreTokens.typography.weight.bold} !important;
  border-radius: 0.25rem !important; /* 2px */
  
  /* 아모레몰 컬러 토큰 매핑 */
  background-color: ${({ $status }) => {
    switch ($status) {
      case 'success': return amoreTokens.colors.blue[50];
      case 'error': return '#FFF0F0';
      case 'warning': return '#FFF9E6';
      case 'info': return amoreTokens.colors.navy[50];
      default: return amoreTokens.colors.gray[100];
    }
  }} !important;

  color: ${({ $status }) => {
    switch ($status) {
      case 'success': return amoreTokens.colors.brand.amoreBlue;
      case 'error': return amoreTokens.colors.status.red;
      case 'warning': return '#D99100';
      case 'info': return amoreTokens.colors.navy[700];
      default: return amoreTokens.colors.gray[500];
    }
  }} !important;

  & .MuiChip-label {
    padding-left: ${amoreTokens.spacing(1)}; /* 0.5rem (8px) */
    padding-right: ${amoreTokens.spacing(1)};
  }
`;

export const StatusChip = ({ status = 'default', label }: StatusChipProps) => {
  return (
    <StyledStatusChip 
      label={label} 
      $status={status} 
    />
  );
};