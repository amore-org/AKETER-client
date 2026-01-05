// src/api/personaTypes.ts
// docs/API.md 기반: "페르소나 유형 목록 조회" API

import dayjs from 'dayjs';
import type { ChipStatus } from '../common/ui/Chip';
import type { PersonaProfile } from './types';
import { requestJson } from './http';

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

export interface MessageHistoryServer {
  messageReservationId: number;
  messageTitle: string;
  messageDescription: string;
  scheduledAt: string;
  brandName?: string;
  itemName: string;
  status: string;
}

export interface PersonaTypeRowServer {
  personaId: number;
  personaName: string;
  memberCount: number;
  ageBand?: string;
  primaryCategory?: string;
  purchaseStyle?: string;
  brandLoyalty?: string;
  priceSensitivity?: string;
  benefitSensitivity?: string;
  trendKeywords?: string[];
  coreKeywords?: string[];
  messageHistory?: MessageHistoryServer[];
}

export interface PageDto<T> {
  items: T[];
  page: number; // 0-based
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

const mapAgeBandToKorean = (raw?: string): string | undefined => {
  const v = (raw ?? '').trim();
  if (!v) return undefined;

  // 예: AGE_20_EARLY -> 20대 초반, AGE_30_LATE -> 30대 후반
  const m = v.match(/^AGE_(\d+)_([A-Z]+)$/);
  if (m) {
    const decade = m[1];
    const tail = m[2];
    const suffix = tail === 'EARLY' ? '초반' : tail === 'LATE' ? '후반' : tail;
    return `${decade}대 ${suffix}`;
  }

  return v;
};

const mapPurchaseStyleToKorean = (raw?: string): string | undefined => {
  const v = (raw ?? '').trim();
  if (!v) return undefined;
  switch (v) {
    case 'INSTANT_BUY':
      return '즉시 구매형';
    case 'REBUY_AFTER_CONSUME':
      return '필요 시 재구매형';
    case 'COMPARE_THEN_BUY':
      return '비교 후 구매형';
    case 'CART_HOLD_THEN_BUY':
      return '장바구니 보관 후 구매형';
    default:
      return v;
  }
};

// UI는 personaLevel.ts에서 '상/중/하' 포함 여부로 레벨을 판단한다.
const mapLevelEnumToKoreanLevelToken = (raw?: string): string | undefined => {
  const v = (raw ?? '').trim();
  if (!v) return undefined;

  // 최대한 안전한 휴리스틱(전체 enum이 확정되지 않았으므로 보수적으로 매핑)
  if (/(PREMIUM|HIGH)/.test(v)) return '상';
  if (/(VALUE|LOW)/.test(v)) return '하';
  return '중';
};

const mapBrandLoyaltyToKoreanLevelToken = (raw?: string): string | undefined => {
  const v = (raw ?? '').trim();
  if (!v) return undefined;
  switch (v) {
    case 'SINGLE_BRAND_LOYAL':
      return '상';
    case 'NEW_PRODUCT_EXPLORER':
      return '하';
    default:
      return mapLevelEnumToKoreanLevelToken(v);
  }
};

const mapBenefitSensitivityToKoreanLevelToken = (raw?: string): string | undefined => {
  const v = (raw ?? '').trim();
  if (!v) return undefined;
  // 예시 enum: FREE_GIFT, SEASON_PROMO 등
  if (v === 'FREE_GIFT') return '상';
  if (v === 'SEASON_PROMO') return '중';
  return mapLevelEnumToKoreanLevelToken(v);
};

const mapStatusToChipStatus = (status: string): ChipStatus => {
  switch (status) {
    case 'READY':
    case 'PENDING':
      return 'info';
    case 'SENT':
    case 'COMPLETED':
      return 'success';
    case 'CANCELED':
    case 'FAILED':
      return 'error';
    default:
      return 'info';
  }
};

export const mapPersonaTypeServerToProfile = (row: PersonaTypeRowServer): PersonaProfile => {
  const recentSends = (row.messageHistory ?? []).map((msg) => {
    const dt = dayjs(msg.scheduledAt);
    return {
      id: msg.messageReservationId,
      date: dt.isValid() ? dt.format('YYYY-MM-DD') : '',
      time: dt.isValid() ? dt.format('HH:mm') : '',
      product: msg.itemName,
      title: msg.messageTitle,
      status: mapStatusToChipStatus(msg.status),
    };
  });

  return {
    personaId: String(row.personaId),
    persona: row.personaName,
    memberCount: row.memberCount,
    ageGroup: mapAgeBandToKorean(row.ageBand),
    mainCategory: row.primaryCategory,
    purchaseMethod: mapPurchaseStyleToKorean(row.purchaseStyle),
    brandLoyalty: mapBrandLoyaltyToKoreanLevelToken(row.brandLoyalty),
    priceSensitivity: mapLevelEnumToKoreanLevelToken(row.priceSensitivity),
    benefitSensitivity: mapBenefitSensitivityToKoreanLevelToken(row.benefitSensitivity),
    trendKeywords: row.trendKeywords ?? [],
    coreKeywords: row.coreKeywords ?? [],
    recentSends,
  };
};

export interface GetPersonaTypesParams {
  page?: number; // 0-based
  size?: number;
}

export async function getPersonaTypes(params: GetPersonaTypesParams = {}): Promise<PageDto<PersonaProfile>> {
  const res = await requestJson<SpringPageServer<PersonaTypeRowServer>>('/api/persona-types', {
    query: {
      page: params.page ?? 0,
      size: params.size ?? 10,
    },
  });

  const page = toPageDto(res);
  return {
    ...page,
    items: page.items.map(mapPersonaTypeServerToProfile),
  };
}


