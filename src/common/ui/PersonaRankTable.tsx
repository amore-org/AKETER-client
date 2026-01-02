// src/common/ui/PersonaRankTable.tsx
import type { ChangeEvent } from 'react';
import { useMemo, useState } from 'react';
import { Box, Table, TableBody, TableHead, TableRow, Typography } from '@mui/material';
import styled from 'styled-components';
import type { PersonaProfile } from '../../api/types';
import { amoreTokens } from '../../styles/theme';
import { StyledRow, StyledTableContainer, StyledTd, StyledTh } from './DataTable';
import { Pagination } from './Pagination';
import { AppChip } from './Chip';
import { formatKoreanLevelLabel, personaLevelChipSx } from './personaLevel';

type PersonaRankRow = {
  rank: number;
  profile: PersonaProfile;
  count: number;
  ratio: number; // 0~1
};

interface PersonaRankTableProps {
  rows: PersonaRankRow[];
  onSelectPersona?: (personaId: string) => void;
}

const Wrap = styled(Box)`
  margin-top: ${amoreTokens.spacing(2)};
  border: 1px solid ${amoreTokens.colors.gray[200]};
  border-radius: ${amoreTokens.radius.base};
  overflow: hidden;
  background: ${amoreTokens.colors.common.white};
`;

const Keywords = ({ values }: { values?: string[] }) => {
  const v = values?.filter(Boolean) ?? [];
  if (!v.length) return <Typography variant="caption">-</Typography>;
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {v.slice(0, 6).map((k, idx) => (
        <AppChip
          key={`${k}-${idx}`}
          label={k}
          size="small"
          variant="filled"
          tone="neutral"
          sx={{ fontWeight: amoreTokens.typography.weight.medium }}
        />
      ))}
      {v.length > 6 && (
        <Typography variant="caption" sx={{ color: amoreTokens.colors.gray[600], fontWeight: amoreTokens.typography.weight.medium }}>
          +{v.length - 6}
        </Typography>
      )}
    </Box>
  );
};

export const PersonaRankTable = ({ rows, onSelectPersona }: PersonaRankTableProps) => {
  const pageSize = 10;
  const [page, setPage] = useState(1);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pageCount);

  const pagedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, safePage]);

  return (
    <Wrap>
      <StyledTableContainer sx={{ overflowX: 'auto' }}>
        <Table size="small" aria-label="페르소나 순위 테이블" sx={{ minWidth: 1400 }}>
          <TableHead>
            <TableRow>
              <StyledTh>순위</StyledTh>
              <StyledTh>페르소나명</StyledTh>
              <StyledTh>유저 연령대</StyledTh>
              <StyledTh>주력 카테고리</StyledTh>
              <StyledTh>구매 방식</StyledTh>
              <StyledTh>브랜드 충성도</StyledTh>
              <StyledTh>가격 민감도</StyledTh>
              <StyledTh>혜택 민감도</StyledTh>
              <StyledTh>트렌드 키워드</StyledTh>
              <StyledTh>핵심 키워드</StyledTh>
            </TableRow>
          </TableHead>
          <TableBody>
            {pagedRows.map((r) => {
              const clickable = Boolean(onSelectPersona);
              const pct = Math.round(r.ratio * 100);
              return (
                <StyledRow
                  key={r.profile.personaId}
                  hover
                  $clickable={clickable}
                  onClick={clickable ? () => onSelectPersona?.(r.profile.personaId) : undefined}
                >
                  <StyledTd sx={{ fontWeight: amoreTokens.typography.weight.semibold }}>
                    {r.rank}
                    <Typography component="span" variant="caption" sx={{ ml: 1, color: amoreTokens.colors.gray[600] }}>
                      ({r.count}건, {pct}%)
                    </Typography>
                  </StyledTd>
                  <StyledTd sx={{ fontWeight: amoreTokens.typography.weight.semibold }}>
                    {r.profile.persona}
                  </StyledTd>
                  <StyledTd sx={{ whiteSpace: 'nowrap' }}>{r.profile.ageGroup ?? '-'}</StyledTd>
                  <StyledTd sx={{ whiteSpace: 'nowrap' }}>{r.profile.mainCategory ?? '-'}</StyledTd>
                  <StyledTd sx={{ whiteSpace: 'nowrap' }}>{r.profile.purchaseMethod ?? '-'}</StyledTd>
                  <StyledTd sx={{ whiteSpace: 'nowrap' }}>
                    <AppChip
                      label={formatKoreanLevelLabel(r.profile.brandLoyalty)}
                      size="small"
                      variant="filled"
                      tone="neutral"
                      sx={{ ...personaLevelChipSx(r.profile.brandLoyalty) }}
                    />
                  </StyledTd>
                  <StyledTd sx={{ whiteSpace: 'nowrap' }}>
                    <AppChip
                      label={formatKoreanLevelLabel(r.profile.priceSensitivity)}
                      size="small"
                      variant="filled"
                      tone="neutral"
                      sx={{ ...personaLevelChipSx(r.profile.priceSensitivity) }}
                    />
                  </StyledTd>
                  <StyledTd sx={{ whiteSpace: 'nowrap' }}>
                    <AppChip
                      label={formatKoreanLevelLabel(r.profile.benefitSensitivity)}
                      size="small"
                      variant="filled"
                      tone="neutral"
                      sx={{ ...personaLevelChipSx(r.profile.benefitSensitivity) }}
                    />
                  </StyledTd>
                  <StyledTd>
                    <Keywords values={r.profile.trendKeywords} />
                  </StyledTd>
                  <StyledTd>
                    <Keywords values={r.profile.coreKeywords} />
                  </StyledTd>
                </StyledRow>
              );
            })}
          </TableBody>
        </Table>
      </StyledTableContainer>

      <Pagination
        count={pageCount}
        page={safePage}
        onChange={(_e: ChangeEvent<unknown>, next: number) => setPage(next)}
      />
    </Wrap>
  );
};


