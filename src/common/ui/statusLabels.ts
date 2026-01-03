// src/common/ui/statusLabels.ts
import type { ChipStatus } from "./Chip";

export const statusLabelMap: Record<ChipStatus, string> = {
    success: "발송 완료",
    // warning: '확인 필요',
    error: "발송 취소",
    info: "발송 대기",
    // default: "미정",
};

export const getStatusLabel = (status: ChipStatus) => statusLabelMap[status];
