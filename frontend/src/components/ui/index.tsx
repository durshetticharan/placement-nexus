// ── Shared UI Design System ────────────────────────────────────────────────────
// Import these into any page that needs them.

import type { ReactNode, ButtonHTMLAttributes } from 'react';
import { AlertCircle, Info, RefreshCw } from 'lucide-react';

// ── StatCard ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  accent?: string; // CSS color string
  onClick?: () => void;
}

export function StatCard({ title, value, subtitle, icon, accent, onClick }: StatCardProps) {
  return (
    <div
      className={`stat-card${onClick ? ' card-hover' : ''}`}
      style={{ borderLeft: accent ? `3px solid ${accent}` : undefined, cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {title}
        </span>
        {icon && (
          <span style={{ color: accent ?? 'var(--text-muted)', opacity: 0.8 }}>{icon}</span>
        )}
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: accent ?? 'var(--text-primary)', lineHeight: 1.1 }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{subtitle}</div>
      )}
    </div>
  );
}

// ── ProgressBar ───────────────────────────────────────────────────────────────
interface ProgressBarProps {
  value: number; // 0–100
  color?: string;
  height?: number;
  label?: string;
  showValue?: boolean;
}

export function ProgressBar({ value, color = 'var(--brand-light)', height = 6, label, showValue }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div>
      {(label || showValue) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.75rem' }}>
          {label && <span style={{ color: 'var(--text-secondary)' }}>{label}</span>}
          {showValue && <span style={{ color, fontWeight: 600 }}>{pct}%</span>}
        </div>
      )}
      <div className="progress-track" style={{ height }}>
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ── ProgressRing ──────────────────────────────────────────────────────────────
interface ProgressRingProps {
  value: number; // 0–100
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}

export function ProgressRing({ value, size = 80, strokeWidth = 7, color = 'var(--brand-light)', label }: ProgressRingProps) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.max(0, Math.min(100, value)) / 100) * circ;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={strokeWidth} />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size > 70 ? '1rem' : '0.75rem', fontWeight: 700, color,
        }}>
          {value}%
        </div>
      </div>
      {label && <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textAlign: 'center' }}>{label}</span>}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'brand' | 'neutral' | 'primary' | 'secondary' | 'subtle' | 'outline' | 'default' | string;

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: string;
  children: ReactNode;
}

export function Badge({ variant = 'neutral', children, className = '', size, ...rest }: BadgeProps) {
  return <span className={`badge badge-${variant} ${className}`} {...rest}>{children}</span>;
}

// ── Button ────────────────────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'success' | 'error' | 'warning' | 'brand' | 'subtle' | string;
type BtnSize = 'sm' | 'md' | 'lg' | string;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: BtnSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  isLoading?: boolean;
  loadingText?: string;
}

export function Button({ variant = 'secondary', size = 'md', leftIcon, rightIcon, children, className = '', isLoading, loadingText, ...rest }: ButtonProps) {
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';
  return (
    <button className={`btn btn-${variant} ${sizeClass} ${className}`} disabled={isLoading || rest.disabled} {...rest}>
      {isLoading ? (
        <><span className="spinner mr-2" />{loadingText || children}</>
      ) : (
        <>
          {leftIcon}
          {children}
          {rightIcon}
        </>
      )}
    </button>
  );
}

// ── PageHeader ────────────────────────────────────────────────────────────────
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  badge?: ReactNode;
  backTo?: string;
  backLabel?: string;
}

export function PageHeader({ title, subtitle, actions, action, icon, badge }: PageHeaderProps) {
  return (
    <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyItems: 'space-between', gap: '1rem', flexWrap: 'wrap', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {icon && <div className="header-icon">{icon}</div>}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 className="page-title">{title}</h1>
            {badge && badge}
          </div>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
      </div>
      {(actions || action) && <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>{actions || action}</div>}
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <p className="empty-state-title">{title}</p>
      {description && <p className="empty-state-text">{description}</p>}
      {action && <div style={{ marginTop: '1rem' }}>{action}</div>}
    </div>
  );
}

// ── LoadingState ──────────────────────────────────────────────────────────────
interface LoadingStateProps {
  message?: string;
  rows?: number;
}

export function LoadingState({ message, rows = 3 }: LoadingStateProps) {
  if (message) {
    return (
      <div className="empty-state">
        <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', border: '3px solid var(--surface-3)', borderTopColor: 'var(--brand-light)', animation: 'spin 0.8s linear infinite', marginBottom: '0.75rem' }} />
        <p className="empty-state-text">{message}</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem 0' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: '3.5rem', width: '100%' }} />
      ))}
    </div>
  );
}

// ── ErrorState ────────────────────────────────────────────────────────────────
interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Something went wrong.', onRetry }: ErrorStateProps) {
  return (
    <div className="empty-state">
      <div style={{ color: 'var(--error)', marginBottom: '0.5rem' }}><AlertCircle size={36} /></div>
      <p className="empty-state-title">Error</p>
      <p className="empty-state-text">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-secondary btn-sm" style={{ marginTop: '1rem' }}>
          <RefreshCw size={14} /> Retry
        </button>
      )}
    </div>
  );
}

// ── InfoBanner ────────────────────────────────────────────────────────────────
interface InfoBannerProps {
  variant?: 'info' | 'warning' | 'error' | 'success' | string;
  type?: string;
  title?: string;
  message?: ReactNode | string;
  icon?: ReactNode;
  
  children?: ReactNode;
}

const BANNER_STYLES: Record<string, { bg: string; border: string; color: string }> = {
  info:    { bg: 'var(--info-bg)',    border: 'rgba(59,130,246,0.3)',  color: 'var(--info)' },
  warning: { bg: 'var(--warning-bg)', border: 'rgba(245,158,11,0.3)', color: 'var(--warning)' },
  error:   { bg: 'var(--error-bg)',   border: 'rgba(239,68,68,0.3)',  color: 'var(--error)' },
  success: { bg: 'var(--success-bg)', border: 'rgba(16,185,129,0.3)', color: 'var(--success)' },
};

export function InfoBanner({ variant, type, title, message, icon, children }: InfoBannerProps) {
  const v = variant || type || 'info';
  const s = BANNER_STYLES[v] || BANNER_STYLES['info'];
  return (
    <div style={{
      background: s.bg, border: `1px solid ${s.border}`, borderRadius: '0.625rem',
      padding: '0.75rem 1rem', display: 'flex', gap: '0.625rem', alignItems: 'flex-start',
      fontSize: '0.8125rem', color: 'var(--text-primary)',
    }}>
      {icon || <Info size={14} style={{ color: s.color, flexShrink: 0, marginTop: '0.125rem' }} />}
      <div style={{ flex: 1 }}>
        {title && <div style={{ fontWeight: 600, marginBottom: '0.125rem' }}>{title}</div>}
        {message && <div>{message}</div>}
        {children}
      </div>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', style, hover, onClick }: CardProps) {
  return (
    <div
      className={`card${hover ? ' card-hover' : ''} ${className}`}
      style={{ cursor: onClick ? 'pointer' : undefined, ...style }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// ── SectionHeader ─────────────────────────────────────────────────────────────
interface SectionHeaderProps {
  title: string;
  action?: ReactNode;
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
      <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h2>
      {action && <div>{action}</div>}
    </div>
  );
}
