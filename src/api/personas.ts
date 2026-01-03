// src/api/personas.ts
// 페르소나 탭 실데이터 연동용 API (백엔드 경로 확정 시 조정)

import { requestJson } from './http';
import type { PersonaProfile } from './types';

type PersonasListResponse = PersonaProfile[] | { items: PersonaProfile[] };

const unwrapItems = (res: PersonasListResponse): PersonaProfile[] => {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray((res as { items?: unknown }).items)) return (res as { items: PersonaProfile[] }).items;
  return [];
};

/**
 * 페르소나 목록
 * - 백엔드 응답이 배열이든 `{ items: [...] }`든 수용
 */
export async function getPersonas(): Promise<PersonaProfile[]> {
  const res = await requestJson<PersonasListResponse>('/api/personas');
  return unwrapItems(res);
}

export type PersonaRecentSendServer = {
  id: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  product: string;
  title: string;
  status: 'success' | 'error' | 'info';
};

/**
 * 페르소나별 발송 히스토리(선택)
 */
export async function getPersonaRecentSends(personaId: string, limit = 10): Promise<PersonaProfile['recentSends']> {
  const res = await requestJson<PersonaRecentSendServer[]>(`/api/personas/${encodeURIComponent(personaId)}/recent-sends`, {
    query: { limit },
  });
  return res.map((r) => ({ id: r.id, date: r.date, time: r.time, product: r.product, title: r.title, status: r.status }));
}



