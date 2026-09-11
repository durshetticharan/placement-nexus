import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, User, ClipboardList, Target, BarChart2,
  Activity, Briefcase, Send, Users, BookOpen, BarChart,
  Bell, Building2, CheckCircle, Shield, Library, ChevronRight,
  LogOut, X, FileText, Settings
} from 'lucide-react';
import { useAuth, type UserRole } from '../../context/AuthContext';

interface NavItem {
  icon: React.ElementType;
  label: string;
  to: string;
  end?: boolean;
}

interface NavGroup {
  section?: string;
  items: NavItem[];
}

const NAV_CONFIG: Record<UserRole, NavGroup[]> = {
  STUDENT: [
    {
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard/student', end: true },
        { icon: FileText, label: 'Resume Builder', to: '/student/resume-builder' },
        { icon: Activity, label: 'ATS Score', to: '/student/readiness' },
        { icon: Briefcase, label: 'Placement Drives', to: '/student/drives' },
        { icon: Send, label: 'My Applications', to: '/student/applications' },
      ],
    },
    {
      section: 'ACADEMICS',
      items: [
        { icon: ClipboardList, label: 'Assessments', to: '/student/assessments' },
        { icon: Target, label: 'Career', to: '/student/career' },
        { icon: BarChart2, label: 'Skill Gap', to: '/student/skill-gap' },
        { icon: BarChart, label: 'Analytics', to: '/student/analytics' },
      ],
    },
    {
      section: 'NETWORK',
      items: [
        { icon: Users, label: 'Alumni & Mentors', to: '/student/alumni' },
        { icon: BookOpen, label: 'Experiences', to: '/student/experiences' },
        { icon: Library, label: 'Resources', to: '/student/resources' },
      ],
    },
    {
      items: [
        { icon: Bell, label: 'Notifications', to: '/preferences' },
        { icon: Settings, label: 'Settings', to: '/settings' },
      ],
    },
  ],

  RECRUITER: [
    {
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard/recruiter', end: true },
        { icon: Briefcase, label: 'Drives', to: '/recruiter/drives' },
        { icon: Building2, label: 'Company', to: '/recruiter/company' },
      ],
    },
    {
      section: 'Profile',
      items: [
        { icon: User, label: 'My Profile', to: '/recruiter/profile' },
        { icon: BarChart, label: 'Analytics', to: '/recruiter/analytics' },
      ],
    },
    {
      section: 'Settings',
      items: [
        { icon: Bell, label: 'Notifications', to: '/preferences' },
      ],
    },
  ],

  PLACEMENT_OFFICER: [
    {
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard/officer', end: true },
        { icon: CheckCircle, label: 'Approvals', to: '/officer/pending-approvals' },
      ],
    },
    {
      section: 'Directory',
      items: [
        { icon: Building2, label: 'Companies', to: '/officer/companies' },
        { icon: Users, label: 'Recruiters', to: '/officer/recruiters' },
        { icon: Briefcase, label: 'Drives', to: '/officer/drives' },
      ],
    },
    {
      section: 'Content',
      items: [
        { icon: ClipboardList, label: 'Assessments', to: '/officer/assessments' },
        { icon: Shield, label: 'Moderation', to: '/officer/content-moderation' },
        { icon: Target, label: 'Career Paths', to: '/officer/career' },
      ],
    },
    {
      section: 'Reports',
      items: [
        { icon: BarChart, label: 'Analytics', to: '/officer/analytics' },
        { icon: Bell, label: 'Notifications', to: '/preferences' },
      ],
    },
  ],

  ALUMNI: [
    {
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard/alumni', end: true },
        { icon: User, label: 'Profile', to: '/alumni/profile' },
      ],
    },
    {
      section: 'Contribute',
      items: [
        { icon: BookOpen, label: 'Experiences', to: '/alumni/experiences' },
        { icon: Library, label: 'Resources', to: '/alumni/resources' },
        { icon: Send, label: 'Referrals', to: '/alumni/referrals' },
      ],
    },
    {
      section: 'Settings',
      items: [
        { icon: Bell, label: 'Notifications', to: '/preferences' },
      ],
    },
  ],
};

const ROLE_BADGE: Record<UserRole, { label: string; color: string }> = {
  STUDENT: { label: 'Student', color: 'text-indigo-400' },
  RECRUITER: { label: 'Recruiter', color: 'text-amber-400' },
  PLACEMENT_OFFICER: { label: 'Officer', color: 'text-emerald-400' },
  ALUMNI: { label: 'Alumni', color: 'text-violet-400' },
};

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role as UserRole;
  const groups = NAV_CONFIG[role] ?? [];
  const badge = ROLE_BADGE[role];

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="sidebar-overlay open" onClick={onClose} aria-hidden="true" />
      )}

      <aside className={`app-sidebar${open ? ' open' : ''}`} aria-label="Main navigation">
        {/* Brand */}
        <div style={{ padding: '1rem 0.875rem 0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '1.75rem', height: '1.75rem', borderRadius: '0.375rem',
                background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ChevronRight size={14} color="white" />
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                OPTIO
              </span>
            </div>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm"
              style={{ display: 'none' }}
              aria-label="Close sidebar"
              id="sidebar-close-btn"
            >
              <X size={16} />
            </button>
          </div>

          {/* Role badge */}
          {badge && (
            <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Signed in as</span>
              <span className={`badge badge-neutral ${badge.color}`} style={{ fontSize: '0.625rem' }}>
                {badge.label}
              </span>
            </div>
          )}
        </div>

        {/* Nav groups */}
        <nav style={{ flex: 1, padding: '0.5rem 0.5rem', overflowY: 'auto' }}>
          {groups.map((group, gi) => (
            <div key={gi} style={{ marginBottom: '0.25rem' }}>
              {group.section && (
                <p className="section-header">{group.section}</p>
              )}
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                  onClick={onClose}
                >
                  <item.icon size={16} className="nav-icon" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
          <button onClick={handleLogout} className="nav-item" style={{ color: 'var(--error)' }}>
            <LogOut size={16} className="nav-icon" />
            Log out
          </button>
        </div>
      </aside>

      {/* Mobile sidebar close btn visibility */}
      <style>{`
        @media (max-width: 768px) {
          #sidebar-close-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}
