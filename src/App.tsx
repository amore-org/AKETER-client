// src/App.tsx
import { Box, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { TopNavbar } from './common/ui/TopNavbar';
import { MainTabs } from './common/ui/MainTabs';
import { amoreTokens } from './styles/theme';
import { DataTable } from './common/ui/DataTable';
import type { TableRowData } from './common/ui/DataTable';
import { DetailDrawer } from './common/ui/DetailDrawer';
import dayjs from 'dayjs';
import { defaultFieldMapping } from './api/fieldMapping';
import { normalizeSendRows, normalizePersonaProfiles } from './api/normalize';
import type { PersonaProfile } from './api/types';
import { PersonaDrawer } from './common/ui/PersonaDrawer';
import { PersonaCloud, type PersonaCloudItem } from './common/ui/PersonaCloud';
import { PersonaRankTable } from './common/ui/PersonaRankTable';
import { ScheduleChangeModal } from './common/ui/ConfirmModal';
import { buildTrendRowsRaw, personaBaseRaw } from './features/reservations/mockData';
import { AppToast, type ToastState } from './common/ui/Toast';
import { getReservationDetail, mapReservationDtoToTableRow, updateReservationSchedule } from './api/reservations';

const NAVBAR_HEIGHT = amoreTokens.spacing(8);
const TABS_HEIGHT = amoreTokens.spacing(6);

const ContentScrollArea = styled(Box)`
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  background-color: ${amoreTokens.colors.common.white};
  padding-top: calc(${NAVBAR_HEIGHT} + ${TABS_HEIGHT});
`;

const PageWrapper = styled(Box)`
  padding: ${amoreTokens.spacing(3)};
  max-width: 90rem;
  margin: 0 auto;
  box-sizing: border-box;
`;

type TabKey = 'reservations' | 'persona';

const tabKeyToIndex = (key: TabKey): number => {
  switch (key) {
    case 'reservations':
      return 0;
    case 'persona':
      return 1;
    default:
      return 0;
  }
};

const tabIndexToKey = (idx: number): TabKey => {
  switch (idx) {
    case 0:
      return 'reservations';
    case 1:
      return 'persona';
    default:
      return 'reservations';
  }
};

const readTabFromHash = (): TabKey => {
  const raw = window.location.hash || '';
  const normalized = raw.replace(/^#\/?/, '');
  // 레거시 해시(#/today, #/trend)는 통합 탭(#/reservations)으로 매핑한다.
  if (normalized === 'today' || normalized === 'trend' || normalized === 'reservations') return 'reservations';
  if (normalized === 'persona') return 'persona';
  return 'reservations';
};

function App() {
  // TODO(임시): 워드클라우드 비율/크기 UI 확인용 mock 모드.
  // 실제 데이터로 전환할 때 false로 바꾸면 된다.
  const USE_PERSONA_CLOUD_MOCK = true;

  const [tabValue, setTabValue] = useState(() => tabKeyToIndex(readTabFromHash()));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<TableRowData | null>(null);
  const [detailInitialDialog, setDetailInitialDialog] = useState<'schedule' | 'cancel' | null>(null);

  const [personaDrawerOpen, setPersonaDrawerOpen] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<PersonaProfile | null>(null);

  const [tableScheduleOpen, setTableScheduleOpen] = useState(false);
  const [tableScheduleRow, setTableScheduleRow] = useState<TableRowData | null>(null);
  const [tableScheduleTime, setTableScheduleTime] = useState<string>('');

  const [toast, setToast] = useState<ToastState>({
    open: false,
    severity: 'success',
    message: '',
    detail: undefined,
  });

  const showToast = (payload: Omit<ToastState, 'open'>) => {
    setToast({ open: true, ...payload });
  };

  const tabKey = useMemo(() => tabIndexToKey(tabValue), [tabValue]);

  const todayStr = useMemo(() => dayjs().format('YYYY-MM-DD'), []);

  const normalizedTrendRows = useMemo(
    () => normalizeSendRows(buildTrendRowsRaw(todayStr), defaultFieldMapping),
    [todayStr],
  );
  const [trendRows, setTrendRows] = useState<TableRowData[]>(() => normalizedTrendRows);

  const personaBase = useMemo(() => normalizePersonaProfiles(personaBaseRaw, defaultFieldMapping), []);

  const personaProfiles = useMemo(() => {
    const byPersonaId = new Map<string, TableRowData[]>();
    trendRows.forEach((r) => {
      const key = r.personaId ?? r.persona;
      const arr = byPersonaId.get(key) ?? [];
      arr.push(r);
      byPersonaId.set(key, arr);
    });

    const sortDesc = (a: TableRowData, b: TableRowData) => {
      const at = dayjs(`${a.date} ${a.time}`, 'YYYY-MM-DD HH:mm');
      const bt = dayjs(`${b.date} ${b.time}`, 'YYYY-MM-DD HH:mm');
      return bt.valueOf() - at.valueOf();
    };

    return personaBase.map((p) => {
      const key = p.personaId || p.persona;
      const recent = (byPersonaId.get(key) ?? []).slice().sort(sortDesc).slice(0, 5);
      return {
        ...p,
        recentSends: recent.map((r) => ({ id: r.id, date: r.date, time: r.time, product: r.product, title: r.title, status: r.status })),
      };
    });
  }, [personaBase, trendRows]);

  const personaProfilesForCloud = useMemo(() => {
    if (!USE_PERSONA_CLOUD_MOCK) return personaProfiles;

    // mock 모드에서는 UI 확인을 위해 페르소나를 20개로 확장한다.
    const target = 20;
    if (personaProfiles.length >= target) return personaProfiles.slice(0, target);

    const extraCount = target - personaProfiles.length;
    const extras = Array.from({ length: extraCount }, (_, i) => {
      const idx = personaProfiles.length + i;
      const template = personaProfiles[idx % personaProfiles.length];
      return {
        ...template,
        personaId: `mock-p-${String(idx + 1).padStart(3, '0')}`,
        persona: `${template.persona} #${idx + 1}`,
        recentSends: [],
      };
    });

    return [...personaProfiles, ...extras];
  }, [USE_PERSONA_CLOUD_MOCK, personaProfiles]);

  const personaCloudItems: PersonaCloudItem[] = useMemo(() => {
    const counts = new Map<string, number>();
    let totalCount = 0;
    trendRows.forEach((r) => {
      const key = r.personaId ?? r.persona;
      counts.set(key, (counts.get(key) ?? 0) + 1);
      totalCount += 1;
    });

    let maxCount = 0;
    counts.forEach((v) => {
      if (v > maxCount) maxCount = v;
    });

    return personaProfiles.map((p) => {
      const personaId = p.personaId || p.persona;
      const c = counts.get(personaId) ?? 0;
      // 기존 칩 클라우드가 "최소 1"로 보여주던 UX를 유지하면서도,
      // 실제 count/ratio는 0을 그대로 전달한다.
      const displayCount = c || 1;
      const weight = Math.max(1, Math.min(5, displayCount));
      const ratio = totalCount ? c / totalCount : 0;
      const isTop = maxCount > 0 && c === maxCount;
      return { personaId, label: p.persona, weight, count: c, ratio, isTop, value: displayCount };
    });
  }, [personaProfiles, trendRows]);

  const mockPersonaCloudItems: PersonaCloudItem[] = useMemo(() => {
    // personaProfilesForCloud 순서대로 count를 강제로 지정(비중 UI 확인용)
    // 20개 페르소나에 대해 head + mid + long-tail 형태로 분포를 만든다.
    const mockCountsByIndex = [160, 120, 95, 78, 64, 52, 44, 38, 33, 29, 25, 22, 19, 16, 13, 11, 9, 7, 5, 3];
    const total = mockCountsByIndex.reduce((a, b) => a + b, 0);
    const max = Math.max(...mockCountsByIndex);

    return personaProfilesForCloud.map((p, idx) => {
      const personaId = p.personaId || p.persona;
      const c = mockCountsByIndex[idx] ?? 1;
      const ratio = total ? c / total : 0;
      const isTop = c === max;
      const displayCount = c || 1;
      const weight = Math.max(1, Math.min(5, displayCount));
      return { personaId, label: p.persona, weight, count: c, ratio, isTop, value: displayCount };
    });
  }, [personaProfilesForCloud]);

  const personaCloudItemsToShow = USE_PERSONA_CLOUD_MOCK ? mockPersonaCloudItems : personaCloudItems;

  const personaRankRows = useMemo(() => {
    const statsById = new Map<string, { count: number; ratio: number }>();
    personaCloudItemsToShow.forEach((it) => {
      statsById.set(it.personaId, { count: it.count ?? 0, ratio: it.ratio ?? 0 });
    });

    const profiles = USE_PERSONA_CLOUD_MOCK ? personaProfilesForCloud : personaProfiles;
    const sorted = profiles
      .slice()
      .sort((a, b) => (statsById.get(b.personaId)?.count ?? 0) - (statsById.get(a.personaId)?.count ?? 0));

    return sorted.map((p, idx) => {
      const stat = statsById.get(p.personaId) ?? { count: 0, ratio: 0 };
      return { rank: idx + 1, profile: p, count: stat.count, ratio: stat.ratio };
    });
  }, [USE_PERSONA_CLOUD_MOCK, personaCloudItemsToShow, personaProfiles, personaProfilesForCloud]);

  const handleRowClick = (row: TableRowData) => {
    setSelectedRow(row);
    setDetailInitialDialog(null);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setDetailInitialDialog(null);
  };

  const openPersonaByRow = (row: TableRowData) => {
    const key = row.personaId ?? row.persona;
    const found =
      personaProfiles.find((p) => p.personaId === key) ?? personaProfiles.find((p) => p.persona === row.persona) ?? null;
    setSelectedPersona(
      found ?? {
        personaId: String(key),
        persona: row.persona,
        trendKeywords: [],
        coreKeywords: [],
        recentSends: [],
      },
    );
    setPersonaDrawerOpen(true);
  };

  const handlePersonaSelect = (personaId: string) => {
    const pool = USE_PERSONA_CLOUD_MOCK ? personaProfilesForCloud : personaProfiles;
    // 워드클라우드/랭킹 테이블에서 넘어오는 값이 personaId가 아닐 수도 있어 fallback을 둔다.
    const found =
      pool.find((p) => p.personaId === personaId) ??
      pool.find((p) => p.persona === personaId) ??
      null;
    // 그래도 못 찾으면, 최소 정보로라도 드로어가 열리도록 fallback 프로필을 만든다.
    setSelectedPersona(
      found ?? {
        personaId: String(personaId),
        persona: String(personaId),
        trendKeywords: [],
        coreKeywords: [],
        recentSends: [],
      },
    );
    setPersonaDrawerOpen(true);
  };

  const handleProductClick = (row: TableRowData) => {
    if (!row.productUrl) return;
    window.open(row.productUrl, '_blank', 'noopener,noreferrer');
  };

  const handleChangeScheduleClick = (row: TableRowData) => {
    // 테이블에서 시간 변경 클릭 시: drawer는 열지 않고, 독립 모달만 오픈
    setTableScheduleRow(row);
    setTableScheduleTime(row.time ?? '');
    setTableScheduleOpen(true);
  };

  const replaceRow = (next: TableRowData) => {
    setTrendRows((prev) => prev.map((r) => (r.id === next.id ? { ...r, ...next } : r)));
    setSelectedRow((prev) => (prev?.id === next.id ? { ...prev, ...next } : prev));
  };

  const patchRow = (id: number, patch: Partial<TableRowData>) => {
    setTrendRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    setSelectedRow((prev) => (prev?.id === id ? { ...prev, ...patch } : prev));
  };

  useEffect(() => {
    const onHashChange = () => {
      const nextKey = readTabFromHash();
      setTabValue(tabKeyToIndex(nextKey));
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    const nextHash = `#/${tabKey}`;
    if (window.location.hash !== nextHash) window.location.hash = nextHash;
  }, [tabKey]);

  return (
    <Box sx={{ height: '100vh', overflow: 'hidden' }}>
      <TopNavbar />
      <MainTabs value={tabValue} onChange={setTabValue} />

      <ContentScrollArea>
        <PageWrapper>
          {tabValue === 0 && (
            <>
              <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography variant="h3">CRM 메시지</Typography>
                <Typography variant="body2" sx={{ color: amoreTokens.colors.gray[600] }}>
                  전체 발송 내역을 확인할 수 있어요.
                </Typography>
              </Box>

              <DataTable
                rows={trendRows}
                onRowClick={handleRowClick}
                onPersonaClick={openPersonaByRow}
                onProductClick={handleProductClick}
                onChangeScheduleClick={handleChangeScheduleClick}
                defaultSelectedDate={dayjs()}
                pageSize={10}
                variant="trend"
              />
            </>
          )}

          {tabValue === 1 && (
            <>
              <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography variant="h3">페르소나 유형</Typography>
                <Typography variant="body2" sx={{ color: amoreTokens.colors.gray[600] }}>
                  페르소나를 선택하면 상세 정보를 확인할 수 있어요!
                </Typography>
                </Box>
              </Box>
              <PersonaCloud items={personaCloudItemsToShow} onSelect={handlePersonaSelect} />
              <PersonaRankTable rows={personaRankRows} onSelectPersona={handlePersonaSelect} />
            </>
          )}

        </PageWrapper>
      </ContentScrollArea>

      <DetailDrawer
        key={`${selectedRow?.id ?? 'none'}-${detailInitialDialog ?? 'none'}`}
        open={drawerOpen}
        onClose={handleCloseDrawer}
        data={selectedRow}
        onPersonaClick={openPersonaByRow}
        onProductClick={handleProductClick}
        initialDialog={detailInitialDialog}
        onShowToast={showToast}
        onReplaceRow={replaceRow}
        onPatchRow={patchRow}
      />

      <ScheduleChangeModal
        open={tableScheduleOpen}
        row={tableScheduleRow}
        value={tableScheduleTime}
        onChange={setTableScheduleTime}
        onClose={() => {
          setTableScheduleOpen(false);
          setTableScheduleRow(null);
          setTableScheduleTime('');
        }}
        onConfirm={(payload) => {
          console.log('[테이블 시간 변경]', payload);
          void (async () => {
            try {
              const scheduledAt = dayjs(payload.after, 'YYYY-MM-DD HH:mm').format('YYYY-MM-DDTHH:mm:00');
              await updateReservationSchedule(payload.id, scheduledAt);
              const fresh = await getReservationDetail(payload.id);
              replaceRow(mapReservationDtoToTableRow(fresh));
              showToast({ severity: 'success', message: '발송 시간을 변경했어요.', detail: `변경 후: ${payload.after}` });
            } catch (e) {
              console.error(e);
              showToast({ severity: 'error', message: '시간 변경에 실패했어요.', detail: '잠시 후 다시 시도해 주세요.' });
            }
          })();
        }}
      />

      <PersonaDrawer
        open={personaDrawerOpen}
        onClose={() => setPersonaDrawerOpen(false)}
        data={selectedPersona}
        onOpenHistory={(personaId) => {
          void personaId;
          const base = `${window.location.origin}${window.location.pathname}`;
          window.open(`${base}#/reservations`, '_blank', 'noopener,noreferrer');
        }}
      />

      <AppToast toast={toast} onClose={() => setToast((prev) => ({ ...prev, open: false }))} />
    </Box>
  );
}

export default App;