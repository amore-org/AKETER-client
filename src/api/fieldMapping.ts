// src/api/fieldMapping.ts
// 서버(API) 영문 필드명이 확정되면 이 파일만 수정해도 UI 모델로 변환 가능하게 설계한다.

import type { PersonaProfile, TableRowData } from './types';

/**
 * UI 모델 필드 -> 서버 응답 필드 키 매핑
 * - 서버가 동적으로 매핑을 내려주는 경우에도 같은 형태를 사용한다.
 */
export type ModelFieldMapping<TModel> = Partial<Record<Extract<keyof TModel, string>, string>>;

export interface FieldMapping {
  send?: ModelFieldMapping<TableRowData>;
  persona?: ModelFieldMapping<PersonaProfile>;
}

/**
 * 기본 매핑(현재는 mock이 UI 모델과 동일한 키를 사용하므로 identity에 가깝다)
 * - 추후 API 영문 키가 정해지면 아래 값을 업데이트한다.
 */
export const defaultFieldMapping: FieldMapping = {
  send: {
    // 예시)
    // id: 'send_id',
    // persona: 'persona_name',
    // productUrl: 'product_url',
    // recommendedReason: 'recommended_reason',
  },
  persona: {
    // 예시)
    // personaId: 'persona_id',
    // ageGroup: 'age_group',
  },
};


