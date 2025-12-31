// src/common/ui/PersonaCloud.tsx
import { useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { ParentSize } from '@visx/responsive';
import { Wordcloud } from '@visx/wordcloud';
import styled from 'styled-components';
import { amoreTokens } from '../../styles/theme';

export type PersonaCloudItem = {
  personaId: string;
  label: string;
  /**
   * 과거 Chip UI 호환을 위해 유지.
   * (현재 워드클라우드 렌더링에서는 value/count 기반으로 크기를 계산한다.)
   */
  weight?: number;
  /** 페르소나별 건수(비중 계산 원천) */
  count?: number;
  /** 전체 대비 비중(0~1) */
  ratio?: number;
  /** 최다 비중 페르소나 강조 */
  isTop?: boolean;
  /** 워드클라우드 크기 계산용 값 (미전달 시 count 기반) */
  value?: number;
};

interface PersonaCloudProps {
  items: PersonaCloudItem[];
  onSelect?: (personaId: string) => void;
}

type CloudDatum = {
  text: string;
  value: number;
  personaId: string;
  isTop?: boolean;
  count?: number;
  ratio?: number;
};

const CloudWrap = styled(Box)`
  border: 1px solid ${amoreTokens.colors.navy[100]};
  background: ${amoreTokens.colors.common.white};
  padding: ${amoreTokens.spacing(3)};
`;

const seededRandom = (seed: number) => {
  // mulberry32
  let t = (seed >>> 0) || 1;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

type PositionedBubble = {
  personaId: string;
  text: string;
  lines: string[];
  x: number;
  y: number;
  rotate: number;
  size: number;
  bg: string;
  textFill: string;
  ringStroke: string;
  bubbleRadius: number;
  collisionRadius: number;
  fittedFontSize: number;
  isTop?: boolean;
  count?: number;
  ratio?: number;
};

const HOVER_SCALE = 1.06;
const LINE_HEIGHT_EM = 1.08;

// 폰트 굵기(원하면 여기만 바꾸면 됨)
const BASE_WORD_FONT_WEIGHT = amoreTokens.typography.weight.medium; // 500 (기본: 더 얇게)
const TOP_WORD_FONT_WEIGHT = amoreTokens.typography.weight.semibold; // 600 (top 강조)

const hexToRgb = (hex: string) => {
  const h = hex.replace('#', '').trim();
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const num = parseInt(full, 16);
  if (!Number.isFinite(num)) return { r: 0, g: 0, b: 0 };
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
};

const rgbToHex = (r: number, g: number, b: number) => {
  const toHex = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

// t=0 -> a, t=1 -> b
const mixHex = (a: string, b: string, t: number) => {
  const tt = clamp(t, 0, 1);
  const ar = hexToRgb(a);
  const br = hexToRgb(b);
  return rgbToHex(ar.r + (br.r - ar.r) * tt, ar.g + (br.g - ar.g) * tt, ar.b + (br.b - ar.b) * tt);
};

// 상대 휘도(간단)로 텍스트 색상을 선택한다.
const pickTextColor = (bgHex: string) => {
  const { r, g, b } = hexToRgb(bgHex);
  const srgbToLin = (c: number) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const L = 0.2126 * srgbToLin(r) + 0.7152 * srgbToLin(g) + 0.0722 * srgbToLin(b);
  return L < 0.45 ? amoreTokens.colors.common.white : amoreTokens.colors.brand.pacificBlue;
};

const splitIntoTwoLines = (text: string) => {
  // 공백이 있으면 공백 기준으로, 없으면 가운데 기준으로 자른다.
  const trimmed = text.trim();
  if (!trimmed) return [''];
  const spaceIdx = trimmed.indexOf(' ');
  if (spaceIdx >= 0) {
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length <= 1) return [trimmed];
    // 균등하게 2줄로 나눔
    const mid = Math.ceil(parts.length / 2);
    return [parts.slice(0, mid).join(' '), parts.slice(mid).join(' ')];
  }
  const mid = Math.ceil(trimmed.length / 2);
  return [trimmed.slice(0, mid), trimmed.slice(mid)];
};

const fitTextInCircle = (text: string, radius: number) => {
  const bubblePadding = 10;
  const baseFontRatio = 0.42; // 원 반지름 대비 폰트 크기 비율(원 크기와 함께 선형 스케일)
  const approxCharWidthFactor = 0.95; // 한글 기준 보수적 폭 추정
  const lineHeight = LINE_HEIGHT_EM;

  let lines = [text];
  let fontSize = radius * baseFontRatio;
  fontSize = clamp(fontSize, 10, radius * 0.62);

  const availableW = 2 * Math.max(0, radius - bubblePadding);
  const availableH = 2 * Math.max(0, radius - bubblePadding);

  const doesFit = (ls: string[], fs: number) => {
    const maxCharsPerLine = Math.max(1, Math.floor(availableW / (fs * approxCharWidthFactor)));
    const longest = Math.max(...ls.map((l) => l.length));
    const textH = ls.length * fs * lineHeight;
    return longest <= maxCharsPerLine && textH <= availableH * 0.9;
  };

  // 1) 1줄로 먼저 시도
  if (doesFit(lines, fontSize)) return { lines, fontSize };

  // 2) 2줄 개행 시도
  lines = splitIntoTwoLines(text);
  if (doesFit(lines, fontSize)) return { lines, fontSize };

  // 3) 그래도 안 되면 폰트 사이즈를 줄여서 강제로 맞춘다.
  for (let i = 0; i < 24; i += 1) {
    fontSize = fontSize * 0.93;
    if (doesFit(lines, fontSize)) return { lines, fontSize };
  }

  // 최후: 더 줄여도 안 되면 2줄 유지 + 최소 폰트
  return { lines, fontSize: clamp(fontSize, 9, fontSize) };
};

const resolveCircleCollisions = (nodes: PositionedBubble[], bounds: { halfW: number; halfH: number }) => {
  // n이 작다는 전제(페르소나 수)에서 O(n^2) 반복 완화로 “절대 겹치지 않게” 보정한다.
  const { halfW, halfH } = bounds;
  const gap = 3; // 원 사이 최소 간격(겹침 방지 우선)
  const iterations = 90;

  for (let iter = 0; iter < iterations; iter += 1) {
    let moved = false;
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
        const minDist = a.collisionRadius + b.collisionRadius + gap;
        if (dist < minDist) {
          const push = (minDist - dist) / 2;
          const ux = dx / dist;
          const uy = dy / dist;
          a.x -= ux * push;
          a.y -= uy * push;
          b.x += ux * push;
          b.y += uy * push;
          moved = true;
        }
      }
    }

    // bounds clamp (Wordcloud 내부 Group이 (width/2,height/2)로 이동하므로 좌표계는 중심 기준)
    for (const n of nodes) {
      n.x = clamp(n.x, -halfW + n.collisionRadius, halfW - n.collisionRadius);
      n.y = clamp(n.y, -halfH + n.collisionRadius, halfH - n.collisionRadius);
    }

    if (!moved) break;
  }
};

export const PersonaCloud = ({ items, onSelect }: PersonaCloudProps) => {
  const [hoveredPersonaId, setHoveredPersonaId] = useState<string | null>(null);

  const summary = useMemo(() => {
    if (!items.length) return null;
    let top: PersonaCloudItem | null = null;
    let maxCount = -Infinity;
    let totalCount = 0;

    // forEach 내부 할당은 TS 제어흐름 분석에서 추적이 약해서(closure),
    // for..of로 계산해 top narrowing이 안정적으로 되게 한다.
    for (const it of items) {
      const c = it.count ?? 0;
      totalCount += c;
      if (c > maxCount) {
        maxCount = c;
        top = it;
      }
    }

    if (!top) return null;
    const pct = top.ratio != null ? Math.round(top.ratio * 100) : totalCount ? Math.round((maxCount / totalCount) * 100) : 0;
    return { topLabel: top.label, topCount: top.count ?? 0, topPct: pct, totalCount };
  }, [items]);

  const seed = useMemo(() => {
    // items 기반으로 seed를 만들어 렌더링 때마다 레이아웃이 과도하게 흔들리지 않게 한다.
    let s = 0;
    for (const it of items) {
      const key = `${it.personaId}|${it.count ?? 0}`;
      for (let i = 0; i < key.length; i += 1) s = ((s * 31) ^ key.charCodeAt(i)) >>> 0;
    }
    return s || 1;
  }, [items]);

  if (!items.length) {
    return (
      <CloudWrap>
        <Typography variant="body2" sx={{ color: amoreTokens.colors.gray[600] }}>
          표시할 페르소나가 없습니다.
        </Typography>
      </CloudWrap>
    );
  }

  const isClickable = Boolean(onSelect);

  return (
    <CloudWrap>
      {summary && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 2, mb: 2 }}>
          <Typography variant="body2" sx={{ color: amoreTokens.colors.gray[800], fontWeight: amoreTokens.typography.weight.bold }}>
            최다 비중: {summary.topLabel} ({summary.topCount}건, {summary.topPct}%)
          </Typography>
          <Typography variant="caption" sx={{ color: amoreTokens.colors.gray[600], fontWeight: amoreTokens.typography.weight.semibold }}>
            전체 {summary.totalCount}건
          </Typography>
        </Box>
      )}

      <Box sx={{ width: '100%', height: 720 }}>
        <ParentSize debounceTime={120}>
          {({ width, height }) => {
            const w = Math.max(10, Math.floor(width));
            const h = Math.max(10, Math.floor(height));

            // 1순위: 원끼리 절대 겹치지 않기.
            // 영역이 좁아져서 수용 불가능해질 때는 하위 순위(값이 작은) 원을 렌더링하지 않는다.
            const itemsSorted = items
              .slice()
              .sort((a, b) => (b.value ?? b.count ?? 0) - (a.value ?? a.count ?? 0));

            const visibleItems: PersonaCloudItem[] = [];
            const availArea = Math.max(1, w * h);
            // 원형 패킹은 이론적으로 1에 못 미치므로 안전하게 여유를 둔다.
            const packFactor = 1;
            let usedArea = 0;

            const estimatedFontFromValue = (v: number) => {
              const vv = Math.max(1, v);
              // 기존 fontSize()와 동일한 스케일을 사용하기 위해 아래에서 values/min/max를 계산한 뒤 다시 덮어쓴다.
              return vv;
            };

            // 아래에서 min/max를 쓰기 위해 일단 words 후보를 만든다.
            const candidates: CloudDatum[] = itemsSorted.map((it) => ({
              text: it.label,
              value: it.value ?? Math.max(1, it.count ?? 1),
              personaId: it.personaId,
              isTop: it.isTop,
              count: it.count,
              ratio: it.ratio,
            }));

            const values = candidates.map((d) => d.value);
            const minVal = Math.min(...values);
            const maxVal = Math.max(...values);
            const minFont = 14;
            const maxFont = 52;

            const fontSize = (v: number) => {
              if (!Number.isFinite(v)) return minFont;
              if (minVal === maxVal) return (minFont + maxFont) / 2;
              const t =
                (Math.sqrt(clamp(v, minVal, maxVal)) - Math.sqrt(minVal)) / (Math.sqrt(maxVal) - Math.sqrt(minVal));
              return minFont + clamp(t, 0, 1) * (maxFont - minFont);
            };

            for (const it of itemsSorted) {
              const v = it.value ?? Math.max(1, it.count ?? 1);
              const fs = fontSize(estimatedFontFromValue(v));
              const r = clamp(fs * (0.9 + Math.min(8, it.label.length) * 0.18), fs * 1.15, fs * 3.2);
              const collisionR = (r + 6) * HOVER_SCALE;
              const area = Math.PI * collisionR * collisionR;
              if (visibleItems.length >= 1 && usedArea + area > availArea * packFactor) {
                break;
              }
              visibleItems.push(it);
              usedArea += area;
            }

            const words: CloudDatum[] = visibleItems.map((it) => ({
              text: it.label,
              value: it.value ?? Math.max(1, it.count ?? 1),
              personaId: it.personaId,
              isTop: it.isTop,
              count: it.count,
              ratio: it.ratio,
            }));

            return (
              <svg width={w} height={h} role="img" aria-label="페르소나 워드클라우드">
                <Wordcloud
                  words={words}
                  width={w}
                  height={h}
                  padding={2}
                  font={amoreTokens.typography.fontFamily}
                  fontSize={(d) => fontSize((d as CloudDatum).value)}
                  fontWeight={(d) => ((d as CloudDatum).isTop ? TOP_WORD_FONT_WEIGHT : BASE_WORD_FONT_WEIGHT)}
                  rotate={() => 0}
                  spiral="rectangular"
                  random={seededRandom(seed)}
                >
                  {(cloudWords) => {
                    const halfW = w / 2;
                    const halfH = h / 2;

                    const nodes: PositionedBubble[] = cloudWords.map((cw) => {
                      const wAny = cw as unknown as CloudDatum & {
                        x: number;
                        y: number;
                        rotate: number;
                        size: number;
                      };

                      const t = clamp((wAny.size - minFont) / (maxFont - minFont), 0, 1);
                      // 투명도(알파) 대신, 메인 컬러를 기준으로 "명도 단계"를 넓게 가져간다.
                      // (겹치거나 가까울 때도 색이 섞이지 않아 가독성이 좋다)
                      const base = amoreTokens.colors.brand.pacificBlue;
                      const white = amoreTokens.colors.common.white;
                      const black = amoreTokens.colors.common.black;

                      // 작은 원: 거의 흰색에 가까운 tint, 큰 원: base에 가까운 shade
                      const baseMix = 0.08 + t * 0.92; // 0.08 ~ 1.0 (차이를 크게)
                      const tinted = mixHex(white, base, baseMix);
                      // 최대 구간에서는 살짝 더 딥하게(black 쪽으로 아주 약간)
                      const deep = t > 0.9 ? mixHex(tinted, black, (t - 0.9) / 0.1 * 0.12) : tinted;

                      const bg = deep;
                      const textFill = pickTextColor(bg);

                      const bubbleRadius = clamp(
                        wAny.size * (0.9 + Math.min(8, wAny.text.length) * 0.18),
                        wAny.size * 1.15,
                        wAny.size * 3.2,
                      );

                      // top ring(+4)과 hover stroke 등을 고려해 충돌 반지름은 여유를 둔다.
                      // hover 시 살짝 커지는 애니메이션이 있어도 겹치지 않도록 "hover 최대 스케일"을 반영한다.
                      const collisionRadius = (bubbleRadius + 6) * HOVER_SCALE;

                      const fitted = fitTextInCircle(wAny.text, bubbleRadius);

                      return {
                        personaId: wAny.personaId,
                        text: wAny.text,
                        lines: fitted.lines,
                        x: wAny.x,
                        y: wAny.y,
                        rotate: wAny.rotate,
                        size: wAny.size,
                        bg,
                        textFill,
                        ringStroke: amoreTokens.colors.transparent.black10,
                        bubbleRadius,
                        collisionRadius,
                        fittedFontSize: fitted.fontSize,
                        isTop: wAny.isTop,
                        count: wAny.count,
                        ratio: wAny.ratio,
                      };
                    });

                    resolveCircleCollisions(nodes, { halfW, halfH });

                    return nodes.map((n, idx) => {
                      const isHovered = hoveredPersonaId != null && hoveredPersonaId === n.personaId;
                      const ringStroke = isHovered
                        ? amoreTokens.colors.brand.pacificBlue
                        : n.isTop
                          ? amoreTokens.colors.brand.pacificBlue
                          : amoreTokens.colors.transparent.black10;
                      const pct = n.ratio != null ? Math.round(n.ratio * 100) : null;
                      const scale = isHovered ? HOVER_SCALE : 1;

          return (
                        <g
                          key={`${n.personaId}-${idx}`}
                          transform={`translate(${n.x}, ${n.y}) rotate(${n.rotate}) scale(${scale})`}
                          style={{
                            cursor: isClickable ? 'pointer' : 'default',
                            userSelect: 'none',
                            transition: 'transform 150ms ease, filter 150ms ease',
                            transformOrigin: 'center',
                            outline: 'none',
                          }}
                          onMouseEnter={() => setHoveredPersonaId(n.personaId)}
                          onMouseLeave={() => setHoveredPersonaId(null)}
                          onFocus={() => setHoveredPersonaId(n.personaId)}
                          onBlur={() => setHoveredPersonaId(null)}
                          onClick={isClickable ? () => onSelect?.(n.personaId) : undefined}
                          role={isClickable ? 'button' : undefined}
                          tabIndex={isClickable ? 0 : -1}
                          onKeyDown={(e) => {
                            if (!isClickable) return;
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onSelect?.(n.personaId);
                            }
                          }}
                          aria-label={`${n.text}${n.count != null ? ` (${n.count}건)` : ''}`}
                          // scale 대신 간단한 glow 느낌 (겹침 없음)
                          filter={isHovered ? 'drop-shadow(0px 4px 10px rgba(0,0,0,0.12))' : undefined}
                        >
                          <title>
                            {n.text}
                            {n.count != null ? ` · ${n.count}건` : ''}
                            {pct != null ? ` · ${pct}%` : ''}
                          </title>

                          <circle
                            cx={0}
                            cy={0}
                            r={n.bubbleRadius}
                            fill={n.bg}
                            stroke={ringStroke}
                            strokeWidth={isHovered ? 2 : n.isTop ? 1.5 : 1}
                          />

                          {n.isTop && (
                            <circle
                              cx={0}
                              cy={0}
                              r={n.bubbleRadius + 4}
                              fill="transparent"
                              stroke={amoreTokens.colors.brand.pacificBlue}
                              strokeWidth={2}
                            />
                          )}

                          <text
                            x={0}
                            y={0}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill={n.textFill}
                            fontFamily={amoreTokens.typography.fontFamily}
                            fontSize={n.fittedFontSize}
                            fontWeight={n.isTop ? TOP_WORD_FONT_WEIGHT : BASE_WORD_FONT_WEIGHT}
                            style={{ pointerEvents: 'none' }}
                          >
                            {n.lines.length <= 1 ? (
                              n.lines[0]
                            ) : (
                              n.lines.map((line, li) => (
                                <tspan
                                  key={`${n.personaId}-l-${li}`}
                                  x={0}
                                  // 멀티라인일 때 텍스트 블록 자체가 원의 정중앙에 오도록 dy를 계산
                                  dy={
                                    li === 0
                                      ? `${-((n.lines.length - 1) / 2) * LINE_HEIGHT_EM}em`
                                      : `${LINE_HEIGHT_EM}em`
                                  }
                                >
                                  {line}
                                </tspan>
                              ))
                            )}
                          </text>
                        </g>
                      );
                    });
                  }}
                </Wordcloud>
              </svg>
            );
          }}
        </ParentSize>
      </Box>
    </CloudWrap>
  );
};


