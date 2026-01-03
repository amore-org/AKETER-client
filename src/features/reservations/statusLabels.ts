// src/features/reservations/statusLabels.ts
// 발송 예약(도메인)에서 사용하는 상태 라벨 정의
import type { ChipStatus } from '../../common/ui/Chip';

export const statusLabelMap: Record<ChipStatus, string> = {
  success: '발송 완료',
  // FAILED/CANCELED 등을 한 뱃지로 표현하는 UI 정책(백엔드 세부 사유는 추후 확장)
  error: '발송 실패/취소',
  info: '발송 예정',
};

export const getStatusLabel = (status: ChipStatus) => statusLabelMap[status];


