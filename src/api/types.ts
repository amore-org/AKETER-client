// src/api/types.ts
// 화면(UI)에서 사용하는 표준 모델 타입들

import type { ChipStatus } from '../common/ui/Chip';

export type FailureType = 'error' | 'optout';

export interface FailedRecipient {
  userId: string;
  name: string;
  failureType: FailureType;
  failureMessage?: string;
}

/**
 * TAB1(오늘 발송 예약) / TAB3(발송 추이) 공용 행(Row) 모델
 * - 테이블/드로어는 이 타입만 바라본다.
 * - API 응답 키가 확정되면 normalize 레이어에서 이 타입으로 변환한다.
 */
export interface TableRowData {
  // 공통
  id: number;
  /** 상세 조회 API 호출 시 사용하는 예약 ID */
  messageReservationId?: number;
  persona: string;
  /** 페르소나 상세 드로어 연결용(없으면 persona 문자열을 키로 사용 가능) */
  personaId?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  product: string;
  /** 상품 상세 이동 링크 */
  productUrl?: string;
  /** 메시지 */
  title: string;
  description: string;
  /** TAB1 운영 상태 또는 TAB3 결과 상태 표현에 사용 */
  status: ChipStatus;

  // TAB1(오늘)에서 주로 사용
  channel?: string; // 푸시/알림톡 등
  recipientCount?: number; // 대상 규모
  lastUpdatedBy?: string;
  lastUpdatedAt?: string;

  // Drawer에서 추가로 노출되는 필드
  recommendedReason?: string;

  // TAB3(추이)에서 사용(옵션)
  successCount?: number;
  errorCount?: number;
  optoutCount?: number;
  failedRecipients?: FailedRecipient[];
}

export interface PersonaProfile {
  personaId: string;
  persona: string;
  /** 해당 페르소나에 속한 고객 수 (persona-types API) */
  memberCount?: number;
  ageGroup?: string;
  mainCategory?: string;
  purchaseMethod?: string;
  brandLoyalty?: string;
  trendKeywords?: string[];
  coreKeywords?: string[];
  priceSensitivity?: string;
  benefitSensitivity?: string;
  recentSends?: Array<Pick<TableRowData, 'id' | 'date' | 'time' | 'product' | 'title' | 'status'>>;
}


