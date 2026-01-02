import { amoreTokens } from '../../styles/theme';

export const formatChannelLabel = (channel?: string) => {
  if (!channel) return '-';
  if (channel === '카카오톡 알림톡') return '알림톡';
  return channel;
};

export const channelBadgeSx = {
  borderRadius: amoreTokens.radius.base,
  borderColor: amoreTokens.colors.gray[300],
  color: amoreTokens.colors.gray[500],
  bgcolor: amoreTokens.colors.common.white,
  fontWeight: amoreTokens.typography.weight.semibold,
} as const;


