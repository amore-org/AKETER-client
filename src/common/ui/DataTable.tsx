// src/common/ui/DataTable.tsx
import styled from 'styled-components';
import { 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow
} from '@mui/material';
import { amoreTokens } from '../../styles/theme';
import { StatusChip, type ChipStatus } from './Chip';

/**
 * 테이블 데이터 구조 정의 (TypeScript)
 */
export interface TableRowData {
  id: number;
  persona: string;
  date: string;
  time: string;
  product: string;
  message: string;
  status: ChipStatus;
}

interface DataTableProps {
  rows: TableRowData[];
}

const StyledTableContainer = styled(TableContainer)`
  border: 1px solid ${amoreTokens.colors.navy[100]};
  border-radius: 0 !important;
  box-shadow: none !important;
  background-color: ${amoreTokens.colors.common.white};
`;

const StyledTh = styled(TableCell)`
  background-color: ${amoreTokens.colors.navy[50]} !important;
  color: ${amoreTokens.colors.gray[900]} !important;
  font-weight: ${amoreTokens.typography.weight.bold} !important;
  font-size: ${amoreTokens.typography.size.body2} !important;
  padding: 1rem !important;
  border-bottom: 2px solid ${amoreTokens.colors.navy[100]} !important;
  white-space: nowrap;
`;

const StyledTd = styled(TableCell)`
  color: ${amoreTokens.colors.gray[700]} !important;
  font-size: ${amoreTokens.typography.size.body2} !important;
  padding: 0.875rem 1rem !important;
  border-bottom: 1px solid ${amoreTokens.colors.gray[100]} !important;
`;

export const DataTable = ({ rows }: DataTableProps) => {
  const statusLabelMap: Record<ChipStatus, string> = {
    success: '발송 완료',
    warning: '확인 필요',
    error: '발송 취소',
    info: '발송 대기',
    default: '미정',
  };

  return (
    <StyledTableContainer>
      <Table sx={{ minWidth: '50rem' }} aria-label="today schedule table">
        <TableHead>
          <TableRow>
            <StyledTh>ID</StyledTh>
            <StyledTh>페르소나</StyledTh>
            <StyledTh>발송 일시</StyledTh>
            <StyledTh>상품명</StyledTh>
            <StyledTh>메시지 문구</StyledTh>
            <StyledTh align="center">상태</StyledTh>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length > 0 ? (
            rows.map((row) => (
              <TableRow key={row.id} hover>
                <StyledTd>{row.id}</StyledTd>
                <StyledTd sx={{ minWidth: '12rem', fontWeight: 600 }}>{row.persona}</StyledTd>
                <StyledTd sx={{ whiteSpace: 'nowrap' }}>{`${row.date} ${row.time}`}</StyledTd>
                <StyledTd sx={{ minWidth: '10rem' }}>{row.product}</StyledTd>
                <StyledTd sx={{ maxWidth: '26rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {row.message}
                </StyledTd>
                <StyledTd align="center">
                  <StatusChip 
                    label={statusLabelMap[row.status]} 
                    status={row.status} 
                  />
                </StyledTd>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <StyledTd colSpan={6} align="center" sx={{ py: 10 }}>
                데이터가 존재하지 않습니다.
              </StyledTd>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </StyledTableContainer>
  );
};