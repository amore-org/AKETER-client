// src/common/ui/statusLabels.ts
import type { ChipStatus } from './Chip';

export const statusLabelMap: Record<ChipStatus, string> = {
  success: '발송 완료',
  warning: '발송 실패',
  error: '발송 취소',
  info: '발송 대기',
  paused: '일시정지',
  default: '미정',
};

export const getStatusLabel = (status: ChipStatus) => statusLabelMap[status];