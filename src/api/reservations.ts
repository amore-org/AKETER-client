// src/api/reservations.ts
// docs/API.md 기반: "메시지 발송 예약 목록" API

import dayjs from 'dayjs';
import type { ChipStatus } from '../common/ui/Chip';
import type { TableRowData } from './types';
import { requestJson } from './http';

/**
 * 1) 서버 응답 타입 (명세서의 필드명을 그대로 반영)
 * - 나중에 실제 JSON 예시로 키가 바뀌면 "여기"만 수정하면 됨.
 */
// docs/API.md 예시: PENDING(대기), SENT(발송완료)
// 운영 중 확장 가능성을 고려해 알려진 값 + string을 허용한다.
export type ReservationStatusServer =
  | 'PENDING'
  | 'SENT'
  | 'READY'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELED'
  | (string & {});
// 문서 예시: "SMS", "Kakao" 등. 서버 enum이 확정되지 않았으므로 string으로 수용한다.
export type ChannelTypeServer = string;

export interface ReservationRowServer {
  id: number;
  messageReservationId: number;
  personaId: number;
  personaName: string;
  scheduledAt: string; // "2025-12-30T09:00:00"
  channelType: ChannelTypeServer;
  status: ReservationStatusServer;
  targetCount: number;
  itemId: number;
  itemKey: string;
  itemName: string;
  brandName?: string;
  messageId: number;
  messageTitle: string;
  messageDescription: string;
}

export interface SpringPageServer<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  pageable?: unknown;
  sort?: unknown;
}

export interface ReservationDetailServer {
  id: number;
  messageReservationId: number;
  personaId: number;
  personaName: string;
  scheduledAt: string;
  channelType: ChannelTypeServer;
  status: ReservationStatusServer;
  targetCount: number;
  item: {
    id: number;
    itemKey: string;
    name: string;
  };
  message: {
    id: number;
    title: string;
    description: string;
  };
  recommendReason?: string;
}

/**
 * 2) 프론트 DTO (추천 필드명)
 * - UI가 다루기 쉬운 구조로 정규화/정리한 형태
 * - "DTO 필드명"을 나중에 바꾸고 싶으면 여기/매퍼만 고치면 됨.
 */
export type ReservationStatusDto = ReservationStatusServer;
export type ChannelTypeDto = ChannelTypeServer;

export interface ReservationMessageDto {
  messageId: number;
  title: string;
  description: string;
}

export interface ReservationItemDto {
  itemId: number;
  itemKey: string;
  name: string;
}

export interface ReservationSummaryDto {
  reservationId: number;
  messageReservationId: number;
  personaId: number;
  personaName: string;
  scheduledAt: string;
  channelType: ChannelTypeDto;
  status: ReservationStatusDto;
  targetCount: number;
  item: ReservationItemDto;
  message: ReservationMessageDto;
}

export interface ReservationDetailDto extends ReservationSummaryDto {
  recommendReason?: string;
}

export interface PageDto<T> {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
}

const toPageDto = <T>(p: SpringPageServer<T>): PageDto<T> => ({
  items: p.content ?? [],
  page: p.number ?? 0,
  size: p.size ?? 10,
  totalItems: p.totalElements ?? 0,
  totalPages: p.totalPages ?? 0,
  isFirst: Boolean(p.first),
  isLast: Boolean(p.last),
});

const mapChannelLabel = (channelType: ChannelTypeDto): string => String(channelType);

const mapStatusToChipStatus = (status: ReservationStatusDto): ChipStatus => {
  switch (status) {
    case 'READY':
    case 'PENDING':
      return 'info'; // 발송 예정/대기
    case 'SENT':
    case 'COMPLETED':
      return 'success'; // 발송 완료
    case 'CANCELED':
    case 'FAILED':
      return 'error'; // 발송 취소
    default:
      return 'info';
  }
};

const buildProductUrl = (itemId?: number): string | undefined => {
  if (!itemId || !Number.isFinite(itemId)) return undefined;
  // 기존 mock과 동일한 패턴
  return `https://www.amoremall.com/kr/ko/product/detail?pid=${itemId}`;
};

export const mapReservationRowServerToDto = (row: ReservationRowServer): ReservationSummaryDto => ({
  reservationId: row.id,
  messageReservationId: row.messageReservationId,
  personaId: row.personaId,
  personaName: row.personaName,
  scheduledAt: row.scheduledAt,
  channelType: row.channelType,
  status: row.status,
  targetCount: row.targetCount,
  item: {
    itemId: row.itemId,
    itemKey: row.itemKey,
    name: row.itemName,
  },
  message: {
    messageId: row.messageId,
    title: row.messageTitle,
    description: row.messageDescription,
  },
});

export const mapDetailServerToDto = (d: ReservationDetailServer): ReservationDetailDto => ({
  reservationId: d.id,
  messageReservationId: d.messageReservationId,
  personaId: d.personaId,
  personaName: d.personaName,
  scheduledAt: d.scheduledAt,
  channelType: d.channelType,
  status: d.status,
  targetCount: d.targetCount,
  item: {
    itemId: d.item.id,
    itemKey: d.item.itemKey,
    name: d.item.name,
  },
  message: {
    messageId: d.message.id,
    title: d.message.title,
    description: d.message.description,
  },
  recommendReason: d.recommendReason,
});

/**
 * 3) DTO -> 화면(UI) 모델(TableRowData) 매핑
 * - 지금 UI는 TableRowData를 중심으로 구성되어 있어 최소 변경으로 연결
 */
export const mapReservationDtoToTableRow = (dto: ReservationSummaryDto | ReservationDetailDto): TableRowData => {
  const dt = dayjs(dto.scheduledAt);
  const date = dt.isValid() ? dt.format('YYYY-MM-DD') : '';
  const time = dt.isValid() ? dt.format('HH:mm') : '';

  // 발송 일시가 현재 시간을 지났으면 발송 완료로 표시
  const isPastScheduledTime = dt.isValid() && dt.isBefore(dayjs());
  const chipStatus =
    isPastScheduledTime && (dto.status === 'PENDING' || dto.status === 'READY')
      ? 'success'
      : mapStatusToChipStatus(dto.status);

  return {
    id: dto.reservationId,
    messageReservationId: dto.messageReservationId,
    persona: dto.personaName,
    personaId: String(dto.personaId),
    date,
    time,
    product: dto.item?.name ?? '-',
    productUrl: buildProductUrl(dto.item?.itemId),
    title: dto.message?.title ?? '',
    description: dto.message?.description ?? '',
    status: chipStatus,
    channel: mapChannelLabel(dto.channelType),
    recipientCount: dto.targetCount,
    recommendedReason: 'recommendReason' in dto ? dto.recommendReason : undefined,
  };
};

/**
 * 4) API 함수
 */
export interface GetReservationsParams {
  /**
   * docs/API.md: 조회 날짜(YYYY-MM-DD)
   * - null/undefined: 오늘 포함 이후 전체
   * - YYYY-MM-DD: 해당 날짜 예약만
   */
  scheduledAt?: string | null;
  page?: number; // 0-based
  size?: number;
}

export async function getReservations(params: GetReservationsParams = {}): Promise<PageDto<ReservationSummaryDto>> {
  const res = await requestJson<SpringPageServer<ReservationRowServer>>('/api/reservations', {
    query: {
      scheduledAt: params.scheduledAt ?? null,
      page: params.page ?? 0,
      size: params.size ?? 10,
    },
  });

  const page = toPageDto(res);
  return {
    ...page,
    items: page.items.map(mapReservationRowServerToDto),
  };
}

/**
 * docs/API.md: 오늘 발송 예약 목록 조회
 * - GET /api/reservations/today
 * - Query: date, status, productSearch, page, size, sort
 *
 * NOTE:
 * - 기존 화면(통합 탭)은 /api/reservations 를 사용 중이지만,
 *   서버가 today 전용 엔드포인트를 제공하므로 별도 함수로 노출한다.
 */
export interface GetReservationsTodayParams {
  /** YYYY-MM-DD */
  date?: string | null;
  /** 서버 enum(READY/PENDING 등). 확정 전이라 string 허용 */
  status?: ReservationStatusServer | null;
  productSearch?: string | null;
  page?: number; // 0-based
  size?: number;
  /** 예: scheduledAt,asc */
  sort?: string | null;
}

export async function getReservationsToday(
  params: GetReservationsTodayParams = {},
): Promise<PageDto<ReservationSummaryDto>> {
  const res = await requestJson<SpringPageServer<ReservationRowServer>>('/api/reservations/today', {
    query: {
      date: params.date ?? null,
      status: params.status ?? null,
      productSearch: params.productSearch ?? null,
      page: params.page ?? 0,
      size: params.size ?? 50,
      sort: params.sort ?? 'scheduledAt,asc',
    },
  });

  const page = toPageDto(res);
  return {
    ...page,
    items: page.items.map(mapReservationRowServerToDto),
  };
}

export async function getReservationDetail(reservationId: number): Promise<ReservationDetailDto> {
  const res = await requestJson<ReservationDetailServer>(`/api/reservations/${reservationId}`);
  return mapDetailServerToDto(res);
}

/**
 * 5) 변경 API(시간 변경/취소)
 * NOTE: 백엔드 엔드포인트가 확정되면 아래 path/body만 조정하면 됩니다.
 */
export async function updateReservationSchedule(reservationId: number, scheduledAt: string): Promise<void> {
  await requestJson<unknown>(`/api/reservations/${reservationId}/schedule`, {
    method: 'PATCH',
    body: { scheduledAt },
  });
}

export async function cancelReservation(reservationId: number, reason?: string): Promise<void> {
  await requestJson<unknown>(`/api/reservations/${reservationId}/cancel`, {
    method: 'POST',
    body: { reason },
  });
}


