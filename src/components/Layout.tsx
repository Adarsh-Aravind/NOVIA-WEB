import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  StickyNote,
  MessageSquareWarning,
  ListTodo,
  Lightbulb,
  CalendarHeart,
  Wallet,
  Target,
  Droplets,
  HeartPulse,
  Sparkles,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MOOD_EMOJI } from '../lib/constants';

type NavEntry = { to: string; label: string; icon: typeof LayoutDashboard; end?: boolean };

const NAV_GROUPS: { heading: string; items: NavEntry[] }[] = [
  {
    heading: 'Together',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/notes', label: 'Notes', icon: StickyNote },
      { to: '/complaints', label: 'Complaints', icon: MessageSquareWarning },
      { to: '/todos', label: 'To-dos', icon: ListTodo },
      { to: '/brainstorms', label: 'Ideas', icon: Lightbulb },
      { to: '/milestones', label: 'Milestones', icon: CalendarHeart },
    ],
  },
  {
    heading: 'Plans',
    items: [
      { to: '/finances', label: 'Finances', icon: Wallet },
      { to: '/bucket-list', label: 'Bucket List', icon: Target },
    ],
  },
  {
    heading: 'Wellness',
    items: [
      { to: '/periods', label: 'Cycle', icon: Droplets },
      { to: '/health', label: 'Health', icon: HeartPulse },
    ],
  },
  {
    heading: 'More',
    items: [{ to: '/updates', label: 'Updates', icon: Sparkles }],
  },
];

export function Layout() {
  const { profile, partnerProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = (profile?.display_name ?? '?').slice(0, 1).toUpperCase();

  return (
    <div className="app-shell">
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileOpen((o) => !o)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="brand">
          <img className="brand-mark" src="/novia-icon.png" alt="NOVIA" />
          <div>
            <div className="display brand-name">NOVIA</div>
            <div className="faint" style={{ fontSize: 11, letterSpacing: '0.14em' }}>
              WEB
            </div>
          </div>
        </div>

        <nav className="nav" onClick={() => setMobileOpen(false)}>
          {NAV_GROUPS.map((group) => (
            <div key={group.heading}>
              <div className="nav-section">{group.heading}</div>
              {group.items.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} className="nav-item">
                  <Icon size={18} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-foot">
          {partnerProfile && (
            <div className="partner-chip">
              <span style={{ fontSize: 18 }}>
                {MOOD_EMOJI[partnerProfile.current_mood] ?? '🙂'}
              </span>
              <div style={{ minWidth: 0 }}>
                <div className="partner-name">{partnerProfile.display_name}</div>
                <div className="faint" style={{ fontSize: 11 }}>
                  {partnerProfile.current_mood}
                </div>
              </div>
            </div>
          )}
          <NavLink to="/settings" className="nav-item">
            <Settings size={18} />
            <span>Settings</span>
          </NavLink>
          <button
            className="nav-item"
            onClick={async () => {
              await signOut();
              navigate('/login');
            }}
          >
            <LogOut size={18} />
            <span>Sign out</span>
          </button>
          <div className="user-badge">
            <span className="avatar-sm">{initials}</span>
            <span className="partner-name">{profile?.display_name}</span>
          </div>
        </div>
      </aside>

      {mobileOpen && <div className="scrim" onClick={() => setMobileOpen(false)} />}

      <main className="content">
        <div className="content-inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
