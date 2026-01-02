// src/api/reservations.ts
// docs/API_명세서.md 기반: "오늘 발송 예약" 및 "예약 상세" API

import dayjs from 'dayjs';
import type { ChipStatus } from '../common/ui/Chip';
import type { TableRowData } from './types';
import { requestJson } from './http';

/**
 * 1) 서버 응답 타입 (명세서의 필드명을 그대로 반영)
 * - 나중에 실제 JSON 예시로 키가 바뀌면 "여기"만 수정하면 됨.
 */
export type ReservationStatusServer = 'READY' | 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELED';
export type ChannelTypeServer = 'PUSH' | 'ALIMTALK' | string;

export interface TodayReservationRowServer {
  id: number;
  personaId: number;
  personaName: string;
  scheduledAt: string; // "2025-12-30T09:00:00"
  channelType: ChannelTypeServer;
  status: ReservationStatusServer;
  targetCount: number;
  itemId: number;
  itemKey: string;
  itemName: string;
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

const mapChannelLabel = (channelType: ChannelTypeDto): string => {
  if (channelType === 'PUSH') return '푸시';
  if (channelType === 'ALIMTALK') return '카카오톡 알림톡';
  return String(channelType);
};

const mapStatusToChipStatus = (status: ReservationStatusDto): ChipStatus => {
  switch (status) {
    case 'READY':
      return 'info'; // 발송 예정
    case 'COMPLETED':
      return 'success'; // 발송 완료
    case 'CANCELED':
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

export const mapTodayRowServerToDto = (row: TodayReservationRowServer): ReservationSummaryDto => ({
  reservationId: row.id,
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

  return {
    id: dto.reservationId,
    persona: dto.personaName,
    personaId: String(dto.personaId),
    date,
    time,
    product: dto.item?.name ?? '-',
    productUrl: buildProductUrl(dto.item?.itemId),
    title: dto.message?.title ?? '',
    description: dto.message?.description ?? '',
    status: mapStatusToChipStatus(dto.status),
    channel: mapChannelLabel(dto.channelType),
    recipientCount: dto.targetCount,
    recommendedReason: 'recommendReason' in dto ? dto.recommendReason : undefined,
  };
};

/**
 * 4) API 함수
 */
export interface GetTodayReservationsParams {
  date?: string; // YYYY-MM-DD
  status?: ReservationStatusServer;
  productSearch?: string;
  page?: number;
  size?: number;
  sort?: string; // 예: scheduledAt,asc
}

export async function getTodayReservations(params: GetTodayReservationsParams = {}): Promise<PageDto<ReservationSummaryDto>> {
  const res = await requestJson<SpringPageServer<TodayReservationRowServer>>('/api/reservations/today', {
    query: {
      date: params.date,
      status: params.status,
      productSearch: params.productSearch,
      page: params.page ?? 0,
      size: params.size ?? 50,
      sort: params.sort ?? 'scheduledAt,asc',
    },
  });

  const page = toPageDto(res);
  return {
    ...page,
    items: page.items.map(mapTodayRowServerToDto),
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


