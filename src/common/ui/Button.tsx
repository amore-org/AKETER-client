// src/common/ui/Button.tsx
import { Button as MuiButton, type ButtonProps as MuiButtonProps } from '@mui/material';
import styled, { css } from 'styled-components';
import { amoreTokens } from '../../styles/theme';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import type { SxProps } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';

export type AppButtonVariant =
  | 'primary'
  | 'secondary'
  | 'primary-outlined'
  | 'secondary-outlined'
  | 'link'
  | 'danger'
  | 'danger-outlined';

export type AppButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<MuiButtonProps, 'variant' | 'color' | 'size'> {
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  /**
   * variant="link" 일 때 링크 타입을 명시(내부/외부 UI 구분)
   * - 지정하지 않으면 href/target 기반으로 추론합니다.
   */
  linkKind?: 'internal' | 'external';
  /**
   * MUI Button은 기본적으로 <button>을 렌더링하므로 target/rel 타입이 노출되지 않습니다.
   * link variant에서 <a>로 렌더링할 때 사용합니다.
   */
  target?: React.HTMLAttributeAnchorTarget;
  rel?: string;
}

const sizeCss = (size: AppButtonSize) => {
  switch (size) {
    case 'sm':
      return css`
        height: 2rem;
        padding: 0 ${amoreTokens.spacing(1.5)};
        font-size: ${amoreTokens.typography.size.caption};
      `;
    case 'lg':
      return css`
        height: 3rem;
        padding: 0 ${amoreTokens.spacing(2.5)};
        font-size: ${amoreTokens.typography.size.body1};
      `;
    case 'md':
    default:
      return css`
        height: 2.5rem;
        padding: 0 ${amoreTokens.spacing(2)};
        font-size: ${amoreTokens.typography.size.body2};
      `;
  }
};

const variantCss = (variant: AppButtonVariant) => {
  const primaryBg = amoreTokens.colors.brand.pacificBlue;
  const primaryFg = amoreTokens.colors.common.white;

  const secondaryBg = amoreTokens.colors.navy[50];
  const secondaryFg = amoreTokens.colors.navy[700] ?? amoreTokens.colors.gray[900];
  const secondaryBorder = amoreTokens.colors.navy[100];

  const dangerBg = amoreTokens.colors.status.red;
  const dangerFg = amoreTokens.colors.common.white;

  switch (variant) {
    case 'link':
      return css`
        background: transparent;
        color: ${amoreTokens.colors.gray[700]};
        border: 0;
        padding: 0;
        height: auto;
        min-width: 0;
        &:hover {
          background: transparent;
          color: ${amoreTokens.colors.gray[700]};
          text-decoration: underline;
          text-underline-offset: 4px;
        }
      `;
    case 'primary':
      return css`
        background: ${primaryBg};
        color: ${primaryFg};
        border: 1px solid ${primaryBg};
        &:hover {
          background: ${amoreTokens.colors.brand.amoreBlue};
          border-color: ${amoreTokens.colors.brand.amoreBlue};
        }
      `;
    case 'primary-outlined':
      return css`
        background: transparent;
        color: ${primaryBg};
        border: 1px solid ${primaryBg};
        &:hover {
          background: ${amoreTokens.colors.blue[50]};
        }
      `;
    case 'secondary':
      return css`
        background: ${secondaryBg};
        color: ${secondaryFg};
        border: 1px solid ${secondaryBorder};
        &:hover {
          background: ${amoreTokens.colors.gray[100]};
        }
      `;
    case 'secondary-outlined':
      return css`
        background: transparent;
        color: ${secondaryFg};
        border: 1px solid ${secondaryBorder};
        &:hover {
          background: ${amoreTokens.colors.gray[50]};
        }
      `;
    case 'danger':
      return css`
        background: ${dangerBg};
        color: ${dangerFg};
        border: 1px solid ${dangerBg};
        &:hover {
          background: #c62828;
          border-color: #c62828;
        }
      `;
    case 'danger-outlined':
      return css`
        background: transparent;
        color: ${dangerBg};
        border: 1px solid ${dangerBg};
        &:hover {
          background: #fff0f0;
        }
      `;
  }
};

const StyledButton = styled(MuiButton)<{ $variant: AppButtonVariant; $size: AppButtonSize }>`
  && {
    border-radius: ${amoreTokens.radius.base};
    text-transform: none;
    font-weight: ${amoreTokens.typography.weight.semibold};
    box-shadow: none;
    ${amoreTokens.typography.fontFamily ? `font-family: ${amoreTokens.typography.fontFamily};` : ''}

    ${({ $size, $variant }) => ($variant === 'link' ? '' : sizeCss($size))}
    ${({ $variant }) => variantCss($variant)}
  }

  &&.Mui-disabled {
    background: ${amoreTokens.colors.gray[100]};
    color: ${amoreTokens.colors.gray[500]};
    border-color: ${amoreTokens.colors.gray[200]};
  }
`;

const isExternalHref = (href: unknown) => typeof href === 'string' && /^(https?:)?\/\//i.test(href);

export const Button = ({ variant = 'primary', size = 'md', linkKind, target, rel, href, endIcon, sx, ...props }: ButtonProps) => {
  if (variant !== 'link') {
    return <StyledButton $variant={variant} $size={size} href={href} endIcon={endIcon} {...props} />;
  }

  const inferredKind: 'internal' | 'external' =
    linkKind ?? (target === '_blank' || isExternalHref(href) ? 'external' : 'internal');

  const nextEndIcon =
    endIcon ?? (inferredKind === 'external' ? <OpenInNewIcon fontSize="inherit" /> : <ArrowForwardIosIcon fontSize="inherit" />);

  const nextTarget = inferredKind === 'external' ? (target ?? '_blank') : target;
  const nextRel = inferredKind === 'external' ? (rel ?? 'noopener noreferrer') : rel;

  const anchorProps = href
    ? { component: 'a' as const, href, target: nextTarget, rel: nextRel }
    : { component: 'button' as const };

  const baseSx: SxProps<Theme> = {
    // endIcon 기본 마진 조정
    '& .MuiButton-endIcon': { ml: 0.5, mr: 0 },
    // 아이콘 SVG 자체 크기를 명시(상위 fontSize 상속 이슈 방지)
    '& .MuiButton-endIcon .MuiSvgIcon-root': { fontSize: '0.78em' },
  };
  const mergedSx: SxProps<Theme> = sx
    ? Array.isArray(sx)
      ? [baseSx, ...sx]
      : [baseSx, sx]
    : baseSx;

  return (
    <StyledButton
      $variant="link"
      $size={size}
      endIcon={nextEndIcon}
      sx={mergedSx}
      {...anchorProps}
      {...props}
    />
  );
};


