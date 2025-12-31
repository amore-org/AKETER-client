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
import { ScheduleChangeDialog } from './common/ui/ScheduleChangeDialog';
import { getReservationDetail, getTodayReservations, mapReservationDtoToTableRow } from './api/reservations';

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

const amoreMallUrl = (id: number) => `https://www.amoremall.com/kr/ko/product/detail?pid=${id}`;

const personaBaseRaw: Array<Record<string, unknown>> = [
  {
    personaId: 'p-001',
    persona: '바쁜 워커홀릭 20대 여성',
    ageGroup: '20대',
    mainCategory: '스킨케어',
    purchaseMethod: '빠른 구매(딥링크 선호)',
    brandLoyalty: '중~상',
    trendKeywords: ['5분 루틴', '보습', '출근'],
    coreKeywords: ['간편', '수분', '시간 절약'],
    priceSensitivity: '중',
    benefitSensitivity: '상',
  },
  {
    personaId: 'p-002',
    persona: '피부 컨디션 민감한 30대 남성',
    ageGroup: '30대',
    mainCategory: '남성 스킨케어',
    purchaseMethod: '정기/재구매',
    brandLoyalty: '상',
    trendKeywords: ['미니멀', '진정', '올인원'],
    coreKeywords: ['간편', '저자극', '리차징'],
    priceSensitivity: '중',
    benefitSensitivity: '중',
  },
  {
    personaId: 'p-003',
    persona: '트렌드에 민감한 20대',
    ageGroup: '20대',
    mainCategory: '메이크업',
    purchaseMethod: '신상/한정판 즉시 구매',
    brandLoyalty: '중',
    trendKeywords: ['홀리데이', '한정판', '신상'],
    coreKeywords: ['선점', '컬러', '바이럴'],
    priceSensitivity: '하',
    benefitSensitivity: '중',
  },
  {
    personaId: 'p-004',
    persona: '가성비 중시 20대 직장인',
    ageGroup: '20대',
    mainCategory: '기초',
    purchaseMethod: '쿠폰/적립금 기반',
    brandLoyalty: '중',
    trendKeywords: ['쿠폰', '점심시간', '가성비'],
    coreKeywords: ['할인', '혜택', '빠른 결정'],
    priceSensitivity: '상',
    benefitSensitivity: '상',
  },
  {
    personaId: 'p-005',
    persona: '모공/피지 고민 20대',
    ageGroup: '20대',
    mainCategory: '클렌징/마스크',
    purchaseMethod: '리뷰/성분 확인 후 구매',
    brandLoyalty: '중',
    trendKeywords: ['클린 뷰티', '모공', '피지'],
    coreKeywords: ['딥클렌징', '정리', '주말'],
    priceSensitivity: '중',
    benefitSensitivity: '중',
  },
  {
    personaId: 'p-006',
    persona: '퇴근 후 홈케어 루틴러 30대',
    ageGroup: '30대',
    mainCategory: '앰플/홈케어',
    purchaseMethod: '세트/라인 구매',
    brandLoyalty: '상',
    trendKeywords: ['홈케어', '앰플', '루틴'],
    coreKeywords: ['컨디션', '탄력', '마무리'],
    priceSensitivity: '중',
    benefitSensitivity: '중',
  },
];

const buildTrendRowsRaw = (todayStr: string): Array<Record<string, unknown>> => {
  const d1 = dayjs(todayStr).subtract(1, 'day').format('YYYY-MM-DD');
  const d2 = dayjs(todayStr).subtract(2, 'day').format('YYYY-MM-DD');
  return [
    {
      id: 2001,
      personaId: 'p-001',
      persona: '바쁜 워커홀릭 20대 여성',
      date: d1,
      time: '09:00',
      channel: '푸시',
      recipientCount: 1280,
      product: '라네즈 워터뱅크 블루 히알루로닉 크림',
      productUrl: amoreMallUrl(2001),
      title: '출근 전 5분 보습 루틴',
      description: '출근 준비로 바쁘죠? 5분 보습 루틴으로 촉촉하게 시작해요. 혜택 확인하기',
      recommendedReason: '출근 전 5분 루틴 니즈가 반복적으로 관측됨',
      status: 'success',
      successCount: 128,
      errorCount: 0,
      optoutCount: 0,
      failedRecipients: [],
    },
    {
      id: 2002,
      personaId: 'p-002',
      persona: '피부 컨디션 민감한 30대 남성',
      date: d1,
      time: '10:30',
      channel: '카카오톡 알림톡',
      recipientCount: 100,
      product: '아이오페 맨 올인원 리차징 로션',
      productUrl: amoreMallUrl(2002),
      title: '간편한 올인원으로 루틴 끝',
      description: '번들거림은 줄이고 수분은 채우는 올인원. 상품 상세 보기',
      recommendedReason: '피부 민감군에서 올인원 카테고리 선호도가 높음',
      status: 'error',
      successCount: 94,
      errorCount: 6,
      optoutCount: 0,
      failedRecipients: [
        { userId: 'u-10001', name: '김민수', failureType: 'error', failureMessage: '전송 API 오류' },
        { userId: 'u-10002', name: '박지훈', failureType: 'error', failureMessage: '전송 API 오류' },
        { userId: 'u-10003', name: '이서연', failureType: 'error', failureMessage: '전송 API 오류' },
        { userId: 'u-10004', name: '정하늘', failureType: 'error', failureMessage: '전송 API 오류' },
        { userId: 'u-10005', name: '오지은', failureType: 'error', failureMessage: '전송 API 오류' },
        { userId: 'u-10006', name: '최도윤', failureType: 'error', failureMessage: '전송 API 오류' },
      ],
    },
    {
      id: 2003,
      personaId: 'p-003',
      persona: '트렌드에 민감한 20대',
      date: d2,
      time: '11:00',
      channel: '푸시',
      recipientCount: 2100,
      product: '헤라 센슈얼 누드 글로스 (홀리데이 컬러)',
      productUrl: amoreMallUrl(2003),
      title: '홀리데이 한정 컬러, 품절 전 선점',
      description: '지금 가장 핫한 홀리데이 컬러, 품절 전 확인!',
      recommendedReason: '한정판/신상 메시지의 반응도가 높은 그룹',
      status: 'success',
      successCount: 210,
      errorCount: 0,
      optoutCount: 0,
      failedRecipients: [],
    },
    {
      id: 2004,
      personaId: 'p-004',
      persona: '가성비 중시 20대 직장인',
      date: d2,
      time: '12:00',
      channel: '카카오톡 알림톡',
      recipientCount: 172,
      product: '이니스프리 그린티 씨드 세럼',
      productUrl: amoreMallUrl(2004),
      title: '점심시간 10분 쇼핑 찬스',
      description: '쿠폰 적용 가능한 대표 보습 세럼',
      recommendedReason: '혜택 민감군에서 점심시간 타임세일 메시지 반응이 높음',
      status: 'error',
      successCount: 160,
      errorCount: 0,
      optoutCount: 12,
      failedRecipients: [
        { userId: 'u-20001', name: '홍길동', failureType: 'optout', failureMessage: '수신 거부' },
        { userId: 'u-20002', name: '장미', failureType: 'optout', failureMessage: '수신 거부' },
        { userId: 'u-20003', name: '윤아', failureType: 'optout', failureMessage: '수신 거부' },
        { userId: 'u-20004', name: '한지민', failureType: 'optout', failureMessage: '수신 거부' },
        { userId: 'u-20005', name: '강호동', failureType: 'optout', failureMessage: '수신 거부' },
      ],
    },
    // 오늘자(추이에서도 확인 가능)
    {
      id: 2010,
      personaId: 'p-006',
      persona: '퇴근 후 홈케어 루틴러 30대',
      date: todayStr,
      time: '20:30',
      channel: '푸시',
      recipientCount: 1800,
      product: '아이오페 슈퍼바이탈 앰플',
      productUrl: amoreMallUrl(2010),
      title: '퇴근 후 1단계 앰플 루틴',
      description: '오늘 하루 고생했어요. 퇴근 후 1단계 앰플로 탄탄한 컨디션을 채워보세요',
      recommendedReason: '홈케어 루틴러에게 “퇴근 후” 타이밍 메시지 반응이 안정적',
      status: 'success',
      successCount: 180,
      errorCount: 0,
      optoutCount: 0,
      failedRecipients: [],
    },
  ];
};

type TabKey = 'today' | 'persona' | 'trend';

const tabKeyToIndex = (key: TabKey): number => {
  switch (key) {
    case 'today':
      return 0;
    case 'persona':
      return 1;
    case 'trend':
      return 2;
  }
};

const tabIndexToKey = (idx: number): TabKey => {
  switch (idx) {
    case 0:
      return 'today';
    case 1:
      return 'persona';
    case 2:
      return 'trend';
    default:
      return 'today';
  }
};

const readTabFromHash = (): TabKey => {
  const raw = window.location.hash || '';
  const normalized = raw.replace(/^#\/?/, '');
  if (normalized === 'today' || normalized === 'persona' || normalized === 'trend') return normalized;
  return 'today';
};

function App() {
  const [tabValue, setTabValue] = useState(() => tabKeyToIndex(readTabFromHash()));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<TableRowData | null>(null);
  const [detailInitialDialog, setDetailInitialDialog] = useState<'schedule' | 'cancel' | 'reprocess' | null>(null);
  const [todayRows, setTodayRows] = useState<TableRowData[]>([]);

  const [personaDrawerOpen, setPersonaDrawerOpen] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<PersonaProfile | null>(null);

  const [tableScheduleOpen, setTableScheduleOpen] = useState(false);
  const [tableScheduleRow, setTableScheduleRow] = useState<TableRowData | null>(null);

  const tabKey = useMemo(() => tabIndexToKey(tabValue), [tabValue]);

  const todayStr = useMemo(() => dayjs().format('YYYY-MM-DD'), []);

  const normalizedTodayRows = useMemo(() => todayRows, [todayRows]);
  const normalizedTrendRows = useMemo(
    () => normalizeSendRows(buildTrendRowsRaw(todayStr), defaultFieldMapping),
    [todayStr],
  );

  const personaBase = useMemo(() => normalizePersonaProfiles(personaBaseRaw, defaultFieldMapping), []);

  const personaProfiles = useMemo(() => {
    const byPersonaId = new Map<string, TableRowData[]>();
    normalizedTrendRows.forEach((r) => {
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
  }, [normalizedTrendRows, personaBase]);

  const personaCloudItems: PersonaCloudItem[] = useMemo(() => {
    const counts = new Map<string, number>();
    normalizedTrendRows.forEach((r) => {
      const key = r.personaId ?? r.persona;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return personaProfiles.map((p) => {
      const c = counts.get(p.personaId) ?? 1;
      const weight = Math.max(1, Math.min(5, c));
      return { personaId: p.personaId, label: p.persona, weight };
    });
  }, [normalizedTrendRows, personaProfiles]);

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
    const found = personaProfiles.find((p) => p.personaId === key) ?? personaProfiles.find((p) => p.persona === row.persona) ?? null;
    setSelectedPersona(found);
    setPersonaDrawerOpen(true);
  };

  const handlePersonaSelect = (personaId: string) => {
    const found = personaProfiles.find((p) => p.personaId === personaId) ?? null;
    setSelectedPersona(found);
    setPersonaDrawerOpen(true);
  };

  const handleProductClick = (row: TableRowData) => {
    if (!row.productUrl) return;
    window.open(row.productUrl, '_blank', 'noopener,noreferrer');
  };

  const handleChangeScheduleClick = (row: TableRowData) => {
    // 테이블에서 시간 변경 클릭 시: drawer는 열지 않고, 독립 모달만 오픈
    setTableScheduleRow(row);
    setTableScheduleOpen(true);
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

  // 오늘 발송 예약: API 연동
  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      try {
        // docs/API_명세서.md: date 미전달 시 서버 기준 오늘(Asia/Seoul)이지만,
        // 프론트도 명시적으로 오늘 날짜를 내려서 동작을 고정한다.
        const page = await getTodayReservations({ date: todayStr, page: 0, size: 200, sort: 'scheduledAt,asc' });
        const rows = page.items.map(mapReservationDtoToTableRow).filter((r) => r.date === todayStr);
        setTodayRows(rows);
      } catch (e) {
        // TODO: 토스트/에러 UI 연결
        console.error('[오늘 발송 예약 조회 실패]', e);
        setTodayRows([]);
      }
    })();

    return () => ac.abort();
  }, [todayStr]);

  // Drawer 열릴 때: 예약 상세 API로 recommendReason 등 보강
  useEffect(() => {
    if (!drawerOpen || !selectedRow) return;
    const reservationId = selectedRow.id;

    (async () => {
      try {
        const detail = await getReservationDetail(reservationId);
        const mapped = mapReservationDtoToTableRow(detail);
        setSelectedRow((prev) => {
          if (!prev || prev.id !== reservationId) return prev;
          // list에서 이미 표시 중인 값은 유지하고, 상세에서만 내려오는 필드는 덮어씀
          return { ...prev, ...mapped, recommendedReason: mapped.recommendedReason };
        });
      } catch (e) {
        console.error('[예약 상세 조회 실패]', e);
      }
    })();
  }, [drawerOpen, selectedRow]);
  return (
    <Box sx={{ height: '100vh', overflow: 'hidden' }}>
      <TopNavbar />
      <MainTabs value={tabValue} onChange={setTabValue} />

      <ContentScrollArea>
        <PageWrapper>
          {tabValue === 0 && (
            <>
              <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="h3">오늘 발송 예약</Typography>
                <Typography variant="body2" sx={{ color: amoreTokens.colors.gray[600], mt: 0.5 }}>
                  오늘 발송 예약된 메시지를 확인해 주세요!
                </Typography>
              </Box>

              <DataTable
                rows={normalizedTodayRows}
                onRowClick={handleRowClick}
                onPersonaClick={openPersonaByRow}
                onProductClick={handleProductClick}
                onChangeScheduleClick={handleChangeScheduleClick}
                pageSize={10}
                variant="today"
              />
            </>
          )}

          {tabValue === 1 && (
            <>
              <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="h3">페르소나 유형</Typography>
                <Typography variant="body2" sx={{ color: amoreTokens.colors.gray[600], mt: 0.5 }}>
                  페르소나를 선택하면 상세 정보를 확인할 수 있어요!
                </Typography>
              </Box>
              <PersonaCloud items={personaCloudItems} onSelect={handlePersonaSelect} />
            </>
          )}

          {tabValue === 2 && (
            <>
              <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="h3">발송 추이 확인</Typography>
                  <Typography variant="body2" sx={{ color: amoreTokens.colors.gray[600], mt: 0.5 }}>
                  전체 발송 내역을 날짜/상태/검색으로 확인할 수 있어요.
                </Typography>
              </Box>

              <DataTable
                rows={normalizedTrendRows}
                onRowClick={handleRowClick}
                onPersonaClick={openPersonaByRow}
                onProductClick={handleProductClick}
                onChangeScheduleClick={handleChangeScheduleClick}
                pageSize={10}
                variant="trend"
              />
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
      />

      <ScheduleChangeDialog
        open={tableScheduleOpen}
        row={tableScheduleRow}
        onClose={() => {
          setTableScheduleOpen(false);
          setTableScheduleRow(null);
        }}
        onConfirm={(payload) => {
          // TODO: 실제 스케줄 변경 API 연동 필요
          console.log('[테이블 시간 변경]', payload);
        }}
      />

      <PersonaDrawer
        open={personaDrawerOpen}
        onClose={() => setPersonaDrawerOpen(false)}
        data={selectedPersona}
        onOpenHistory={() => {
          const base = `${window.location.origin}${window.location.pathname}`;
          window.open(`${base}#/trend`, '_blank', 'noopener,noreferrer');
        }}
      />
    </Box>
  );
}

export default App;