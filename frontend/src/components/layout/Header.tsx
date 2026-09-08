import { Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationCenter from '../NotificationCenter';

const ROLE_COLORS: Record<string, string> = {
  STUDENT: '#818CF8',
  RECRUITER: '#F59E0B',
  PLACEMENT_OFFICER: '#10B981',
  ALUMNI: '#A78BFA',
};

function getInitials(email: string): string {
  return email ? email.slice(0, 2).toUpperCase() : '??';
}

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth();
  const color = user ? (ROLE_COLORS[user.role] ?? '#818CF8') : '#818CF8';
  const initials = getInitials(user?.email ?? '');

  return (
    <header className="app-header">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="btn btn-ghost btn-sm"
        aria-label="Open menu"
        style={{ marginRight: '0.25rem' }}
        id="mobile-menu-btn"
      >
        <Menu size={18} />
      </button>

      {/* Brand (mobile only) */}
      <span
        style={{
          fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)',
          display: 'none',
        }}
        id="mobile-brand"
      >
        Placement Nexus
      </span>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Notification center */}
      <NotificationCenter />

      {/* Avatar */}
      <div
        style={{
          width: '2rem', height: '2rem', borderRadius: '50%',
          background: `${color}22`, border: `1.5px solid ${color}66`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.6875rem', fontWeight: 700, color,
          flexShrink: 0,
        }}
        title={user?.email}
      >
        {initials}
      </div>

      {/* Email (desktop) */}
      <span
        style={{
          fontSize: '0.75rem', color: 'var(--text-secondary)',
          maxWidth: '12rem', overflow: 'hidden', textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        id="header-email"
      >
        {user?.email}
      </span>

      <style>{`
        @media (max-width: 768px) {
          #mobile-menu-btn { display: flex !important; }
          #mobile-brand { display: block !important; }
          #header-email { display: none !important; }
        }
        @media (min-width: 769px) {
          #mobile-menu-btn { display: none !important; }
        }
      `}</style>
    </header>
  );
}
