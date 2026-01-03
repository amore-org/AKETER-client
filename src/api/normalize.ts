// src/api/normalize.ts
import type { FieldMapping, ModelFieldMapping } from './fieldMapping';
import type { FailedRecipient, PersonaProfile, TableRowData } from './types';
import type { ChipStatus } from '../common/ui/Chip';

type RawRecord = Record<string, unknown>;

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

const asString = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);
const asNumber = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
const asArray = (v: unknown): unknown[] | undefined => (Array.isArray(v) ? v : undefined);

const asChipStatus = (v: unknown): ChipStatus => {
  if (v === 'success' || v === 'error' || v === 'info') return v;
  return 'info';
};

function pick<TModel>(
  raw: RawRecord,
  mapping: ModelFieldMapping<TModel> | undefined,
  uiKey: Extract<keyof TModel, string>,
): unknown {
  const serverKey = mapping?.[uiKey] ?? uiKey;
  return raw[serverKey];
}

function normalizeFailedRecipient(raw: unknown): FailedRecipient | null {
  if (!isRecord(raw)) return null;
  const failureTypeRaw = raw.failureType;
  const failureType = failureTypeRaw === 'error' || failureTypeRaw === 'optout' ? failureTypeRaw : null;
  const userId = asString(raw.userId);
  const name = asString(raw.name);
  if (!failureType || !userId || !name) return null;
  return {
    userId,
    name,
    failureType,
    failureMessage: asString(raw.failureMessage),
  };
}

export function normalizeSendRow(raw: RawRecord, mapping?: FieldMapping): TableRowData {
  const m = mapping?.send;

  const id = asNumber(pick<TableRowData>(raw, m, 'id')) ?? 0;
  const persona = asString(pick<TableRowData>(raw, m, 'persona')) ?? '-';
  const personaId = asString(pick<TableRowData>(raw, m, 'personaId'));
  const date = asString(pick<TableRowData>(raw, m, 'date')) ?? '';
  const time = asString(pick<TableRowData>(raw, m, 'time')) ?? '';
  const product = asString(pick<TableRowData>(raw, m, 'product')) ?? '-';
  const productUrl = asString(pick<TableRowData>(raw, m, 'productUrl'));
  const title = asString(pick<TableRowData>(raw, m, 'title')) ?? '';
  const description = asString(pick<TableRowData>(raw, m, 'description')) ?? '';
  const status = asChipStatus(pick<TableRowData>(raw, m, 'status'));

  const channel = asString(pick<TableRowData>(raw, m, 'channel'));
  const recipientCount = asNumber(pick<TableRowData>(raw, m, 'recipientCount'));
  const lastUpdatedBy = asString(pick<TableRowData>(raw, m, 'lastUpdatedBy'));
  const lastUpdatedAt = asString(pick<TableRowData>(raw, m, 'lastUpdatedAt'));
  const recommendedReason = asString(pick<TableRowData>(raw, m, 'recommendedReason'));

  const successCount = asNumber(pick<TableRowData>(raw, m, 'successCount'));
  const errorCount = asNumber(pick<TableRowData>(raw, m, 'errorCount'));
  const optoutCount = asNumber(pick<TableRowData>(raw, m, 'optoutCount'));

  const failedRecipientsRaw = asArray(pick<TableRowData>(raw, m, 'failedRecipients')) ?? [];
  const failedRecipients = failedRecipientsRaw
    .map(normalizeFailedRecipient)
    .filter((x): x is FailedRecipient => Boolean(x));

  return {
    id,
    persona,
    personaId,
    date,
    time,
    product,
    productUrl,
    title,
    description,
    status,
    channel,
    recipientCount,
    lastUpdatedBy,
    lastUpdatedAt,
    recommendedReason,
    successCount,
    errorCount,
    optoutCount,
    failedRecipients,
  };
}

export function normalizeSendRows(rawRows: RawRecord[], mapping?: FieldMapping): TableRowData[] {
  return rawRows.map((r) => normalizeSendRow(r, mapping));
}

export function normalizePersonaProfile(raw: RawRecord, mapping?: FieldMapping): PersonaProfile {
  const m = mapping?.persona;
  const personaId = asString(pick<PersonaProfile>(raw, m, 'personaId')) ?? '';
  const persona = asString(pick<PersonaProfile>(raw, m, 'persona')) ?? '-';

  const trendKeywords = (asArray(pick<PersonaProfile>(raw, m, 'trendKeywords')) ?? []).map(asString).filter(Boolean) as string[];
  const coreKeywords = (asArray(pick<PersonaProfile>(raw, m, 'coreKeywords')) ?? []).map(asString).filter(Boolean) as string[];

  const recentSendsRaw = asArray(pick<PersonaProfile>(raw, m, 'recentSends')) ?? [];
  const recentSends = recentSendsRaw
    .filter(isRecord)
    .map((r) => normalizeSendRow(r, mapping))
    .map((r) => ({ id: r.id, date: r.date, time: r.time, product: r.product, title: r.title, status: r.status }));

  return {
    personaId,
    persona,
    ageGroup: asString(pick<PersonaProfile>(raw, m, 'ageGroup')),
    mainCategory: asString(pick<PersonaProfile>(raw, m, 'mainCategory')),
    purchaseMethod: asString(pick<PersonaProfile>(raw, m, 'purchaseMethod')),
    brandLoyalty: asString(pick<PersonaProfile>(raw, m, 'brandLoyalty')),
    trendKeywords,
    coreKeywords,
    priceSensitivity: asString(pick<PersonaProfile>(raw, m, 'priceSensitivity')),
    benefitSensitivity: asString(pick<PersonaProfile>(raw, m, 'benefitSensitivity')),
    recentSends,
  };
}

export function normalizePersonaProfiles(rawRows: RawRecord[], mapping?: FieldMapping): PersonaProfile[] {
  return rawRows.map((r) => normalizePersonaProfile(r, mapping));
}


