// src/features/reservations/statusLabels.ts
// 발송 예약(도메인)에서 사용하는 상태 라벨 정의
import type { ChipStatus } from '../../common/ui/Chip';

export const statusLabelMap: Record<ChipStatus, string> = {
  success: '발송 완료',
  error: '발송 취소',
  info: '발송 예정',
};

export const getStatusLabel = (status: ChipStatus) => statusLabelMap[status];


