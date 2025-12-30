// src/common/ui/PersonaCloud.tsx
import { Box, Chip, Typography } from '@mui/material';
import styled from 'styled-components';
import { amoreTokens } from '../../styles/theme';

export type PersonaCloudItem = {
  personaId: string;
  label: string;
  weight?: number; // 1~5 정도를 권장
};

interface PersonaCloudProps {
  items: PersonaCloudItem[];
  onSelect?: (personaId: string) => void;
}

const CloudWrap = styled(Box)`
  border: 1px solid ${amoreTokens.colors.navy[100]};
  background: ${amoreTokens.colors.common.white};
  padding: ${amoreTokens.spacing(3)};
`;

export const PersonaCloud = ({ items, onSelect }: PersonaCloudProps) => {
  if (!items.length) {
    return (
      <CloudWrap>
        <Typography variant="body2" sx={{ color: amoreTokens.colors.gray[600] }}>
          표시할 페르소나가 없습니다.
        </Typography>
      </CloudWrap>
    );
  }

  return (
    <CloudWrap>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {items.map((it) => {
          const w = Math.max(1, Math.min(5, it.weight ?? 3));
          const fontSize = w <= 2 ? '0.75rem' : w === 3 ? '0.85rem' : w === 4 ? '0.95rem' : '1.05rem';
          return (
            <Chip
              key={it.personaId}
              label={it.label}
              onClick={onSelect ? () => onSelect(it.personaId) : undefined}
              clickable={Boolean(onSelect)}
              sx={{
                borderRadius: amoreTokens.radius.base,
                fontWeight: 800,
                fontSize,
                bgcolor: amoreTokens.colors.blue[50],
              }}
            />
          );
        })}
      </Box>
    </CloudWrap>
  );
};


