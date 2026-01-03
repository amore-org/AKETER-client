import { Box, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { TopNavbar } from "./common/ui/TopNavbar";
import { MainTabs } from "./common/ui/MainTabs";
import { DataTable } from "./common/ui/DataTable";
import type { TableRowData } from "./common/ui/DataTable";
import { DetailDrawer } from "./common/ui/DetailDrawer";
import type { PersonaProfile } from "./api/types";
import { PersonaDrawer } from "./common/ui/PersonaDrawer";
import { PersonaCloud, type PersonaCloudItem } from "./common/ui/PersonaCloud";
import { PersonaRankTable } from "./common/ui/PersonaRankTable";
import { AppToast, type ToastState } from "./common/ui/Toast";
import { getReservations, getReservationsToday, mapReservationDtoToTableRow } from "./api/reservations";
import { getPersonaTypes } from "./api/personaTypes";
import { HttpError } from "./api/http";
import { amoreTokens } from "./styles/theme";

const NAVBAR_HEIGHT = amoreTokens.spacing(8); // 4rem
const TABS_HEIGHT = amoreTokens.spacing(6); // 3rem

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

type TabKey = "reservations" | "persona";

const tabKeyToIndex = (key: TabKey): number => {
    switch (key) {
        case "reservations":
            return 0;
        case "persona":
            return 1;
        default:
            return 0;
    }
};

const tabIndexToKey = (idx: number): TabKey => {
    switch (idx) {
        case 0:
            return "reservations";
        case 1:
            return "persona";
        default:
            return "reservations";
    }
};

const readTabFromHash = (): TabKey => {
    const raw = window.location.hash || "";
    const normalized = raw.replace(/^#\/?/, "");
    // 레거시 해시(#/today, #/trend)는 통합 탭(#/reservations)으로 매핑한다.
    if (normalized === "today" || normalized === "trend" || normalized === "reservations") return "reservations";
    if (normalized === "persona") return "persona";
    return "reservations";
};

function App() {
    const [tabValue, setTabValue] = useState(() => tabKeyToIndex(readTabFromHash()));
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState<TableRowData | null>(null);
    const [detailInitialDialog, setDetailInitialDialog] = useState<"schedule" | "cancel" | null>(null);

    const [personaDrawerOpen, setPersonaDrawerOpen] = useState(false);
    const [selectedPersona, setSelectedPersona] = useState<PersonaProfile | null>(null);

    const [toast, setToast] = useState<ToastState>({
        open: false,
        severity: "success",
        message: "",
        detail: undefined,
    });

    const showToast = (payload: Omit<ToastState, "open">) => {
        setToast({ open: true, ...payload });
    };

    const tabKey = useMemo(() => tabIndexToKey(tabValue), [tabValue]);

    const [trendRows, setTrendRows] = useState<TableRowData[]>([]);
    const [reservationsScheduledAt, setReservationsScheduledAt] = useState<string | null>(null);
    const [reservationsPage, setReservationsPage] = useState<number>(1); // 1-based(UI)
    const [reservationsPageCount, setReservationsPageCount] = useState<number>(1);

    const [personaProfiles, setPersonaProfiles] = useState<PersonaProfile[]>([]);

    useEffect(() => {
        // 예약 목록 조회 (docs/API.md: /api/reservations)
        void (async () => {
            try {
                const res = await getReservations({
                    scheduledAt: reservationsScheduledAt,
                    page: Math.max(0, reservationsPage - 1),
                    size: 10,
                }).catch(async (e) => {
                    // 백엔드가 today 전용 엔드포인트만 제공하는 환경을 위한 fallback
                    if (e instanceof HttpError && e.status === 404) {
                        return await getReservationsToday({
                            date: reservationsScheduledAt,
                            page: Math.max(0, reservationsPage - 1),
                            size: 10,
                            sort: "scheduledAt,asc",
                        });
                    }
                    throw e;
                });
                setTrendRows(res.items.map(mapReservationDtoToTableRow));
                setReservationsPageCount(Math.max(1, res.totalPages || 1));
            } catch (e) {
                console.error(e);
                showToast({
                    severity: "error",
                    message: "예약 목록을 불러오지 못했어요.",
                    detail: "잠시 후 다시 시도해 주세요.",
                });
            }
        })();
    }, [reservationsPage, reservationsScheduledAt]);

    useEffect(() => {
        // 페르소나 유형 조회 (docs/API.md: /api/persona-types)
        void (async () => {
            try {
                const first = await getPersonaTypes({ page: 0, size: 200 });
                let all = first.items.slice();
                const totalPages = Math.max(1, first.totalPages || 1);
                if (totalPages > 1) {
                    const rest = await Promise.all(
                        Array.from({ length: totalPages - 1 }, (_, i) => getPersonaTypes({ page: i + 1, size: 200 }))
                    );
                    rest.forEach((p) => {
                        all = all.concat(p.items);
                    });
                }
                setPersonaProfiles(all);
            } catch (e) {
                console.error(e);
                showToast({
                    severity: "error",
                    message: "페르소나 목록을 불러오지 못했어요.",
                    detail: "잠시 후 다시 시도해 주세요.",
                });
            }
        })();
    }, []);

    const personaCloudItems: PersonaCloudItem[] = useMemo(() => {
        const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
        const total = personaProfiles.reduce((acc, p) => acc + (p.memberCount ?? 0), 0);
        const max = personaProfiles.reduce((acc, p) => Math.max(acc, p.memberCount ?? 0), 0);

        return personaProfiles.map((p) => {
            const c = p.memberCount ?? 0;
            const ratio = total ? c / total : 0;
            const isTop = max > 0 && c === max;
            // 기존 UX: 0이어도 최소 1로 보여주되, 실제 count/ratio는 0을 유지
            const displayCount = c || 1;
            const weight = max > 0 ? clamp(Math.round(1 + 4 * (c / max)), 1, 5) : 1;
            return { personaId: p.personaId, label: p.persona, weight, count: c, ratio, isTop, value: displayCount };
        });
    }, [personaProfiles]);

    const personaRankRows = useMemo(() => {
        const total = personaProfiles.reduce((acc, p) => acc + (p.memberCount ?? 0), 0);
        const sorted = personaProfiles.slice().sort((a, b) => (b.memberCount ?? 0) - (a.memberCount ?? 0));
        return sorted.map((p, idx) => {
            const count = p.memberCount ?? 0;
            const ratio = total ? count / total : 0;
            return { rank: idx + 1, profile: p, count, ratio };
        });
    }, [personaProfiles]);

    const handleRowClick = (row: TableRowData) => {
        setSelectedRow(row);
        setDetailInitialDialog(null);
        setDrawerOpen(true);
    };

    const handleChangeScheduleClick = (row: TableRowData) => {
        setSelectedRow(row);
        setDetailInitialDialog("schedule");
        setDrawerOpen(true);
    };

    const handleCloseDrawer = () => {
        setDrawerOpen(false);
        setDetailInitialDialog(null);
    };

    const openPersonaByRow = (row: TableRowData) => {
        const key = row.personaId ?? row.persona;
        const found =
            personaProfiles.find((p) => p.personaId === key) ??
            personaProfiles.find((p) => p.persona === row.persona) ??
            null;
        setSelectedPersona(
            found ?? {
                personaId: String(key),
                persona: row.persona,
                trendKeywords: [],
                coreKeywords: [],
                recentSends: [],
            }
        );
        setPersonaDrawerOpen(true);
    };

    const handlePersonaSelect = (personaId: string) => {
        // 워드클라우드/랭킹 테이블에서 넘어오는 값이 personaId가 아닐 수도 있어 fallback을 둔다.
        const found =
            personaProfiles.find((p) => p.personaId === personaId) ??
            personaProfiles.find((p) => p.persona === personaId) ??
            null;
        // 그래도 못 찾으면, 최소 정보로라도 드로어가 열리도록 fallback 프로필을 만든다.
        setSelectedPersona(
            found ?? {
                personaId: String(personaId),
                persona: String(personaId),
                trendKeywords: [],
                coreKeywords: [],
                recentSends: [],
            }
        );
        setPersonaDrawerOpen(true);
    };

    const handleProductClick = (row: TableRowData) => {
        if (!row.productUrl) return;
        window.open(row.productUrl, "_blank", "noopener,noreferrer");
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
        window.addEventListener("hashchange", onHashChange);
        return () => window.removeEventListener("hashchange", onHashChange);
    }, []);

    useEffect(() => {
        const nextHash = `#/${tabKey}`;
        if (window.location.hash !== nextHash) window.location.hash = nextHash;
    }, [tabKey]);

    return (
        <Box sx={{ height: "100vh", overflow: "hidden" }}>
            <TopNavbar />
            <MainTabs value={tabValue} onChange={setTabValue} />

            <ContentScrollArea>
                <PageWrapper>
                    {tabValue === 0 && (
                        <>
                            <Box sx={{ mb: 2, display: "flex", flexDirection: "column", gap: 0.5 }}>
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
                                defaultSelectedDate={null}
                                onDateFilterChange={(dateStr) => {
                                    setReservationsScheduledAt(dateStr);
                                    setReservationsPage(1);
                                }}
                                page={reservationsPage}
                                pageCount={reservationsPageCount}
                                onPageChange={(next) => setReservationsPage(next)}
                                pageSize={10}
                                variant="trend"
                            />
                        </>
                    )}

                    {tabValue === 1 && (
                        <>
                            <Box sx={{ mb: 2, display: "flex", flexDirection: "column", gap: 0.5 }}>
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                                    <Typography variant="h3">페르소나 유형</Typography>
                                    <Typography variant="body2" sx={{ color: amoreTokens.colors.gray[600] }}>
                                        페르소나를 선택하면 상세 정보를 확인할 수 있어요!
                                    </Typography>
                                </Box>
                            </Box>
                            <PersonaCloud items={personaCloudItems} onSelect={handlePersonaSelect} />
                            <PersonaRankTable rows={personaRankRows} onSelectPersona={handlePersonaSelect} />
                        </>
                    )}
                </PageWrapper>
            </ContentScrollArea>

            <DetailDrawer
                key={`${selectedRow?.id ?? "none"}-${detailInitialDialog ?? "none"}`}
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

            <PersonaDrawer
                open={personaDrawerOpen}
                onClose={() => setPersonaDrawerOpen(false)}
                data={selectedPersona}
                onOpenHistory={(personaId) => {
                    void personaId;
                    const base = `${window.location.origin}${window.location.pathname}`;
                    window.open(`${base}#/reservations`, "_blank", "noopener,noreferrer");
                }}
            />

            <AppToast toast={toast} onClose={() => setToast((prev) => ({ ...prev, open: false }))} />
        </Box>
    );
}

export default App;
