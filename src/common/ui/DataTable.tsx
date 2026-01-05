// src/common/ui/DataTable.tsx
import styled from 'styled-components';
import { 
  Table, TableBody, TableCell, TableContainer, 
  TableHead,
  TableRow,
  Box,
  Stack,
  Checkbox,
  ListItemText,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Button,
  Typography,
  IconButton,
  Divider,
  Tooltip,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { useMemo, useState, type ChangeEvent, type MouseEvent } from 'react';
import { amoreTokens } from '../../styles/theme';
import { StatusChip, type ChipStatus } from './Chip';
import { statusLabelMap } from '../../features/reservations/statusLabels';
import { Pagination } from './Pagination';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import EventIcon from '@mui/icons-material/Event';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import type { TableRowData } from '../../api/types';
import { Button as AppButton } from './Button';
import { Popover } from './Popover';
import { channelBadgeSx, formatChannelLabel } from './channel';
import { AppChip } from './Chip';

/**
 * 테이블 데이터 구조 정의 (TypeScript)
 */
export type { TableRowData } from '../../api/types';

export type DataTableVariant = 'today' | 'trend';

interface DataTableProps {
  rows: TableRowData[];
  onRowClick?: (row: TableRowData) => void;
  onPersonaClick?: (row: TableRowData) => void;
  onProductClick?: (row: TableRowData) => void;
  onChangeScheduleClick?: (row: TableRowData) => void;
  /**
   * (server-mode) 날짜 필터가 바뀌었을 때 App이 API 재조회할 수 있도록 알린다.
   * - 전달하지 않으면 기존처럼 클라이언트 필터로만 동작한다.
   */
  onDateFilterChange?: (dateStr: string | null) => void;
  /**
   * 발송일(날짜) 필터의 초기값.
   * 예: 통합 탭에서 기본값을 '오늘'로 맞추기 위해 사용.
   */
  defaultSelectedDate?: Dayjs | null;
  pageSize?: number;
  variant?: DataTableVariant;
  /**
   * (server-mode) 컨트롤드 페이징 지원 (1-based)
   * - 전달하지 않으면 기존처럼 rows 기반으로 클라이언트 페이징한다.
   */
  page?: number;
  pageCount?: number;
  onPageChange?: (nextPage: number) => void;
}

type FilterPopoverKey = 'date' | 'time' | 'status' | 'persona' | 'brand' | 'product' | 'channel';

export const StyledTableContainer = styled(TableContainer)`
  && {
    border: 1px solid ${amoreTokens.colors.navy[100]};
    border-radius: ${amoreTokens.radius.base};
    box-shadow: none;
    background-color: ${amoreTokens.colors.common.white};
  }
`;

// 2. 헤더 셀 스타일: Navy-50 배경에 Gray-900 텍스트
export const StyledTh = styled(TableCell)`
  && {
    background-color: ${amoreTokens.colors.navy[50]};
    color: ${amoreTokens.colors.gray[900]};
    font-weight: ${amoreTokens.typography.weight.bold};
    font-size: ${amoreTokens.typography.size.body2};
    padding: 1rem;
    border-bottom: 2px solid ${amoreTokens.colors.navy[100]};
    white-space: nowrap;
  }
`;

// 3. 본문 셀 스타일: Gray-700 텍스트와 세밀한 여백
export const StyledTd = styled(TableCell)`
  && {
    color: ${amoreTokens.colors.gray[700]};
    font-size: ${amoreTokens.typography.size.body2};
    padding: 0.875rem 1rem;
    border-bottom: 1px solid ${amoreTokens.colors.gray[100]};
  }
`;

export const StyledRow = styled(TableRow)<{ $clickable?: boolean }>`
  transition: background-color 0.2s ease;
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
  &:hover {
    background-color: ${({ $clickable }) => ($clickable ? amoreTokens.colors.blue[50] : 'inherit')} !important;
  }
`;

const ProductLink = styled(AppButton)`
  && {
    width: 100%;
    display: inline-flex;
    justify-content: flex-start !important;
    align-items: flex-start !important;
    text-align: left !important;

    white-space: normal !important;   /* 줄바꿈 허용 */
    word-break: keep-all;            /* 한글 단어 단위로 개행 */
    line-height: 1.4;
  }
`;

export const DataTable = ({
  rows,
  onRowClick,
  onPersonaClick,
  onProductClick,
  onChangeScheduleClick,
  onDateFilterChange,
  defaultSelectedDate,
  pageSize = 10,
  variant = 'today',
  page: controlledPage,
  pageCount: controlledPageCount,
  onPageChange,
}: DataTableProps) => {
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(() => defaultSelectedDate ?? null);
  const [timeFilter, setTimeFilter] = useState<string>(''); // HH:mm
  const [statusFilter, setStatusFilter] = useState<'all' | ChipStatus>('all');
  const [personaSelected, setPersonaSelected] = useState<string[]>([]);
  const [brandSelected, setBrandSelected] = useState<string[]>([]);
  const [productQuery, setProductQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<'all' | string>('all');
  const [page, setPage] = useState(1);

  const isServerPaging = controlledPageCount != null && Boolean(onPageChange);
  const activePage = isServerPaging ? (controlledPage ?? 1) : page;
  const setActivePage = (next: number) => {
    if (isServerPaging) onPageChange?.(next);
    else setPage(next);
  };

  const [popover, setPopover] = useState<{
    key: FilterPopoverKey | null;
    anchorEl: HTMLElement | null;
  }>({ key: null, anchorEl: null });

  const openPopover = (key: FilterPopoverKey) => (e: MouseEvent<HTMLElement>) => {
    setPopover({ key, anchorEl: e.currentTarget });
  };

  const closePopover = () => setPopover({ key: null, anchorEl: null });

  const filteredRows = useMemo(() => {
    // server-mode에서는 날짜 필터를 API에서 처리하므로, 여기서는 date로 필터링하지 않는다.
    const dateStr =
      !onDateFilterChange && variant === 'trend' && selectedDate ? selectedDate.format('YYYY-MM-DD') : null;
    const timeStr = variant === 'today' ? timeFilter.trim() : '';
    const productQ = productQuery.trim().toLowerCase();

    return rows.filter((row) => {
      if (dateStr && row.date !== dateStr) return false;
      if (timeStr && row.time !== timeStr) return false;
      if (statusFilter !== 'all') {
        if (row.status !== statusFilter) return false;
      }
      if (personaSelected.length > 0 && !personaSelected.includes(row.persona)) return false;
      if (brandSelected.length > 0 && !brandSelected.includes((row as any).brand ?? '')) return false;
      if (channelFilter !== 'all' && row.channel !== channelFilter) return false;
      if (productQ && !row.product.toLowerCase().includes(productQ)) return false;
      return true;
    });
  }, [brandSelected, channelFilter, personaSelected, productQuery, rows, selectedDate, statusFilter, timeFilter, variant]);

  const pageCount = isServerPaging
    ? Math.max(1, controlledPageCount ?? 1)
    : Math.max(1, Math.ceil(filteredRows.length / pageSize));

  const safePage = Math.min(activePage, pageCount);

  const pagedRows = useMemo(() => {
    if (isServerPaging) return filteredRows;
    const start = (safePage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, isServerPaging, pageSize, safePage]);

  // personaId로 정렬된 행
  const sortedPagedRows = useMemo(() => {
    return [...pagedRows].sort((a, b) => {
      const aId = a.personaId ?? a.persona;
      const bId = b.personaId ?? b.persona;
      if (aId < bId) return -1;
      if (aId > bId) return 1;
      return 0;
    });
  }, [pagedRows]);

  // 페르소나 병합 정보 계산
  const personaMergeInfo = useMemo(() => {
    const info: { rowSpan: number; shouldRender: boolean }[] = [];
    let i = 0;
    while (i < sortedPagedRows.length) {
      const currentPersonaId = sortedPagedRows[i].personaId ?? sortedPagedRows[i].persona;
      let count = 1;
      while (i + count < sortedPagedRows.length) {
        const nextPersonaId = sortedPagedRows[i + count].personaId ?? sortedPagedRows[i + count].persona;
        if (nextPersonaId !== currentPersonaId) break;
        count++;
      }
      info.push({ rowSpan: count, shouldRender: true });
      for (let j = 1; j < count; j++) {
        info.push({ rowSpan: 0, shouldRender: false });
      }
      i += count;
    }
    return info;
  }, [sortedPagedRows]);

  const handleStatusChange = (e: SelectChangeEvent) => {
    setStatusFilter(e.target.value as 'all' | ChipStatus);
    setActivePage(1);
  };

  const popoverOpen = Boolean(popover.key && popover.anchorEl);
  const popoverId = popoverOpen && popover.key ? `datatable-filter-${popover.key}` : undefined;

  // 컬럼 수: 페르소나, 브랜드, 상품명, 채널, 메시지, 발송시간/일시, 상태
  const emptyColSpan = 7;

  const headerIconButtonSx = {
    p: 0.25,
    fontSize: '1rem',
  } as const;

  const personaOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => set.add(r.persona));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ko'));
  }, [rows]);

  const brandOptions = useMemo(() => {
  const set = new Set<string>();
  rows.forEach((r) => {
    const b = (r as any).brand;        
    if (b) set.add(b);
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'ko'));
  }, [rows]);

  const channelOptions = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((r) => {
      if (!r.channel) return;
      // label은 사용자에게 보여주는 값, value는 실제 row.channel 값
      map.set(formatChannelLabel(r.channel), r.channel);
    });
    return Array.from(map.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => a.label.localeCompare(b.label, 'ko'));
  }, [rows]);

  const statusOptions = useMemo(() => {
    const set = new Set<ChipStatus>();
    rows.forEach((r) => set.add(r.status));
    return Array.from(set)
      .map((s) => ({ value: s, label: statusLabelMap[s] }))
      .sort((a, b) => a.label.localeCompare(b.label, 'ko'));
  }, [rows]);

  const truncateText = (text: string, maxLen: number) => {
    const t = (text ?? '').trim();
    if (!t) return '';
    if (t.length <= maxLen) return t;
    return `${t.slice(0, maxLen)}...`;
  };

  const canShowChangeScheduleIcon = (row: TableRowData) => {
    if (!onChangeScheduleClick) return false;
    if (variant === 'today') return true;

    // 발송 추이: "발송 예정"일 때만 노출, "발송 완료"는 미노출
    if (row.status !== 'info') return false;
    const scheduledAt = dayjs(`${row.date} ${row.time}`, 'YYYY-MM-DD HH:mm');
    if (!scheduledAt.isValid()) return false;
    return scheduledAt.isAfter(dayjs());
  };

  return (
    <Box>
      <Popover
        id={popoverId}
        open={popoverOpen}
        anchorEl={popover.anchorEl}
        onClose={closePopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        paperSx={{ borderRadius: amoreTokens.radius.base }}
      >
        <Box sx={{ p: 2, width: '100%' }}>
          {popover.key === 'date' && variant === 'trend' && (
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                날짜 필터
              </Typography>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="발송일(날짜)"
                  value={selectedDate}
                  onChange={(v: Dayjs | null) => {
                    setSelectedDate(v);
                    setActivePage(1);
                    onDateFilterChange?.(v ? v.format('YYYY-MM-DD') : null);
                  }}
                  format="YYYY-MM-DD"
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                    },
                  }}
                />
              </LocalizationProvider>
              <Divider />
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setSelectedDate(null);
                    setActivePage(1);
                    onDateFilterChange?.(null);
                  }}
                  disabled={!selectedDate}
                >
                  초기화
                </Button>
                <Button size="small" variant="contained" onClick={closePopover}>
                  저장
                </Button>
              </Stack>
            </Stack>
          )}

          {popover.key === 'time' && variant === 'today' && (
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                시간 필터
              </Typography>
              <TextField
                size="small"
                label="발송 시간(HH:mm)"
                type="time"
                value={timeFilter}
                onChange={(e) => {
                  setTimeFilter(e.target.value);
                  setActivePage(1);
                }}
                fullWidth
                inputProps={{ step: 300 }}
              />
              <Divider />
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setTimeFilter('');
                    setActivePage(1);
                  }}
                  disabled={!timeFilter}
                >
                  초기화
                </Button>
                <Button size="small" variant="contained" onClick={closePopover}>
                  저장
                </Button>
              </Stack>
            </Stack>
          )}

          {popover.key === 'status' && (
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                상태 필터
              </Typography>
              <FormControl size="small" fullWidth>
                <InputLabel id="status-filter-label">상태</InputLabel>
                <Select
                  labelId="status-filter-label"
                  value={statusFilter}
                  label="상태"
                  onChange={handleStatusChange}
                  MenuProps={{ disablePortal: true }}
                >
                  <MenuItem value="all">전체</MenuItem>
                  {statusOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Divider />
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setStatusFilter('all');
                    setActivePage(1);
                  }}
                  disabled={statusFilter === 'all'}
                >
                  초기화
                </Button>
                <Button size="small" variant="contained" onClick={closePopover}>
                  저장
                </Button>
              </Stack>
            </Stack>
          )}

          {popover.key === 'persona' && (
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                페르소나 필터
              </Typography>
              <Autocomplete
                multiple
                disableCloseOnSelect
                options={personaOptions}
                value={personaSelected}
                onChange={(_e, next) => {
                  setPersonaSelected(next);
                  setActivePage(1);
                }}
                size="small"
                renderInput={(params) => <TextField {...params} label="페르소나" placeholder="검색 후 선택" />}
                renderOption={(props, option, { selected }) => (
                  <li {...props}>
                    <Checkbox size="small" sx={{ mr: 1 }} checked={selected} />
                    <ListItemText primary={option} />
                  </li>
                )}
              />
              <Divider />
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setPersonaSelected([]);
                    setActivePage(1);
                  }}
                  disabled={personaSelected.length === 0}
                >
                  초기화
                </Button>
                <Button size="small" variant="contained" onClick={closePopover}>
                  저장
                </Button>
              </Stack>
            </Stack>
          )}

          {popover.key === 'brand' && (
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                브랜드 필터
              </Typography>

              <Autocomplete
                multiple
                disableCloseOnSelect
                options={brandOptions}
                value={brandSelected}
                onChange={(_e, next) => {
                  setBrandSelected(next);
                  setActivePage(1);
                }}
                size="small"
                renderInput={(params) => <TextField {...params} label="브랜드" placeholder="검색 후 선택" />}
                renderOption={(props, option, { selected }) => (
                  <li {...props}>
                    <Checkbox size="small" sx={{ mr: 1 }} checked={selected} />
                    <ListItemText primary={option} />
                  </li>
                )}
              />

              <Divider />
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setBrandSelected([]);
                    setActivePage(1);
                  }}
                  disabled={brandSelected.length === 0}
                >
                  초기화
                </Button>
                <Button size="small" variant="contained" onClick={closePopover}>
                  저장
                </Button>
              </Stack>
            </Stack>
          )}

          {popover.key === 'channel' && (
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                채널 필터
              </Typography>
              <FormControl size="small" fullWidth>
                <InputLabel id="channel-filter-label">채널</InputLabel>
                <Select
                  labelId="channel-filter-label"
                  value={channelFilter}
                  label="채널"
                  onChange={(e) => {
                    setChannelFilter(e.target.value as 'all' | string);
                    setActivePage(1);
                  }}
                  MenuProps={{ disablePortal: true }}
                >
                  <MenuItem value="all">전체</MenuItem>
                  {channelOptions.map((c) => (
                    <MenuItem key={c.value} value={c.value}>
                      {c.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Divider />
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setChannelFilter('all');
                    setActivePage(1);
                  }}
                  disabled={channelFilter === 'all'}
                >
                  초기화
                </Button>
                <Button size="small" variant="contained" onClick={closePopover}>
                  저장
                </Button>
              </Stack>
            </Stack>
          )}

          {popover.key === 'product' && (
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                상품명 검색
              </Typography>
              <TextField
                size="small"
                label="상품명"
                placeholder="예: 쿠션"
                value={productQuery}
                onChange={(e) => {
                  setProductQuery(e.target.value);
                  setActivePage(1);
                }}
                fullWidth
              />
              <Divider />
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setProductQuery('');
                    setActivePage(1);
                  }}
                  disabled={!productQuery}
                >
                  초기화
                </Button>
                <Button size="small" variant="contained" onClick={closePopover}>
                  저장
                </Button>
              </Stack>
            </Stack>
          )}

        </Box>
      </Popover>

      <StyledTableContainer>
        <Table sx={{ minWidth: '50rem' }} aria-label={variant === 'trend' ? 'send history table' : 'today schedule table'}>
        <TableHead>
          <TableRow>
            <StyledTh>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Box component="span">페르소나</Box>
                <Tooltip title="페르소나 필터">
                  <IconButton
                    size="small"
                    onClick={openPopover('persona')}
                    sx={{
                      ...headerIconButtonSx,
                      color: personaSelected.length > 0 ? amoreTokens.colors.brand.amoreBlue : amoreTokens.colors.gray[500],
                    }}
                  >
                    <FilterAltIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </StyledTh>
            
            {/* 브랜드 컬럼 추가 */}
            <StyledTh>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Box component="span">브랜드</Box>
                <Tooltip title="브랜드 필터">
                  <IconButton
                    size="small"
                    onClick={openPopover('brand')}
                    sx={{
                      ...headerIconButtonSx,
                      color: brandSelected.length > 0 ? amoreTokens.colors.brand.amoreBlue : amoreTokens.colors.gray[500],
                    }}
                  >
                    <FilterAltIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </StyledTh>

            <StyledTh>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Box component="span">상품명</Box>
                <Tooltip title="상품명 필터">
                  <IconButton
                    size="small"
                    onClick={openPopover('product')}
                    sx={{
                      ...headerIconButtonSx,
                      color: productQuery ? amoreTokens.colors.brand.amoreBlue : amoreTokens.colors.gray[500],
                    }}
                  >
                    <FilterAltIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </StyledTh>
            <StyledTh>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Box component="span">채널</Box>
                <Tooltip title="채널 필터">
                  <IconButton
                    size="small"
                    onClick={openPopover('channel')}
                    sx={{
                      ...headerIconButtonSx,
                      color: channelFilter !== 'all' ? amoreTokens.colors.brand.amoreBlue : amoreTokens.colors.gray[500],
                    }}
                  >
                    <FilterAltIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </StyledTh>
            <StyledTh>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Box component="span">메시지</Box>
              </Stack>
            </StyledTh>
            <StyledTh>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Box component="span">{variant === 'today' ? '발송 시간' : '발송 일시'}</Box>
                {variant === 'trend' ? (
                  <Tooltip title="날짜 필터">
                    <IconButton
                      size="small"
                      onClick={openPopover('date')}
                      sx={{
                        ...headerIconButtonSx,
                        color: selectedDate ? amoreTokens.colors.brand.amoreBlue : amoreTokens.colors.gray[500],
                      }}
                    >
                      <EventIcon fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Tooltip title="시간 필터">
                    <IconButton
                      size="small"
                      onClick={openPopover('time')}
                      sx={{
                        ...headerIconButtonSx,
                        color: timeFilter ? amoreTokens.colors.brand.amoreBlue : amoreTokens.colors.gray[500],
                      }}
                    >
                      <EventIcon fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            </StyledTh>
            <StyledTh align="center">
              <Stack direction="row" spacing={0.25} alignItems="center" justifyContent="center">
                <Box component="span">상태</Box>
                <Tooltip title="상태 필터">
                  <IconButton
                    size="small"
                    onClick={openPopover('status')}
                    sx={{
                      ...headerIconButtonSx,
                      color: statusFilter !== 'all' ? amoreTokens.colors.brand.amoreBlue : amoreTokens.colors.gray[500],
                    }}
                  >
                    <FilterAltIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </StyledTh>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedPagedRows.length > 0 ? (
            sortedPagedRows.map((row, idx) => (
              <StyledRow
                key={row.id}
                hover
                $clickable={Boolean(onRowClick)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {personaMergeInfo[idx]?.shouldRender && (
                  <StyledTd
                    rowSpan={personaMergeInfo[idx].rowSpan}
                    sx={{ minWidth: '12rem', fontWeight: 600, verticalAlign: 'middle' }}
                  >
                    {onPersonaClick ? (
                      <Tooltip title="페르소나 상세로 이동해요.">
                        <span>
                          <AppButton
                            variant="link"
                            linkKind="internal"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPersonaClick(row);
                            }}
                            aria-label="페르소나 상세 보기"
                          >
                            {row.persona}
                          </AppButton>
                        </span>
                      </Tooltip>
                    ) : (
                      row.persona
                    )}
                  </StyledTd>
                )}

                {/* 브랜드 매 행마다 렌더 */} 
                <StyledTd sx={{ minWidth: '7rem', whiteSpace: 'nowrap' }}> 
                  {row.brand ?? '-'} 
                </StyledTd>

                <StyledTd sx={{ minWidth: '10rem', textAlign: 'left' }}>
                  {onProductClick ? (
                    <Tooltip title="아모레몰 상품 상세로 이동해요.">
                      <span style={{ display: 'block', width: '100%', textAlign: 'left' }}>
                        <ProductLink
                          variant="link"
                          linkKind="external"
                          onClick={(e) => {
                            e.stopPropagation();
                            onProductClick(row);
                          }}
                          aria-label="상품 상세 보기"
                        >
                          {row.product}
                        </ProductLink>
                      </span>
                    </Tooltip>
                  ) : (
                    <Box sx={{ textAlign: 'left', whiteSpace: 'normal', wordBreak: 'keep-all', lineHeight: 1.4 }}>
                      {row.product}
                    </Box>
                  )}
                </StyledTd>
                
                <StyledTd sx={{ whiteSpace: 'nowrap' }}>
                  {row.channel ? (
                    <AppChip
                      size="small"
                      variant="outlined"
                      tone="neutral"
                      label={formatChannelLabel(row.channel)}
                      sx={channelBadgeSx}
                    />
                  ) : (
                    '-'
                  )}
                </StyledTd>
                <StyledTd sx={{ maxWidth: '26rem' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {row.title}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: amoreTokens.colors.gray[600],
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {truncateText(row.description, 60)}
                    </Typography>
                  </Box>
                </StyledTd>
                <StyledTd sx={{ whiteSpace: 'nowrap' }}>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Box component="span">{variant === 'today' ? row.time : `${row.date} ${row.time}`}</Box>
                    {canShowChangeScheduleIcon(row) && (
                      <Tooltip title="시간 변경">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onChangeScheduleClick?.(row);
                          }}
                          sx={{ ...headerIconButtonSx, color: amoreTokens.colors.gray[500] }}
                        >
                          <EditOutlinedIcon fontSize="inherit" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </StyledTd>
                <StyledTd align="center">
                  <StatusChip label={statusLabelMap[row.status]} status={row.status} />
                </StyledTd>
              </StyledRow>
            ))
          ) : (
            <TableRow>
              <StyledTd colSpan={emptyColSpan} align="center" sx={{ py: 10 }}>
                데이터가 없어요.
              </StyledTd>
            </TableRow>
          )}
        </TableBody>
        </Table>
      </StyledTableContainer>

      <Pagination
        count={pageCount}
        page={safePage}
        onChange={(_event: ChangeEvent<unknown>, value: number) => setActivePage(value)}
      />
    </Box>
  );
};