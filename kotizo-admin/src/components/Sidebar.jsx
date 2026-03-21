import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

const IC = ({ d, d2, type }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {type === 'grid' && <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>}
    {type === 'users' && <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>}
    {type === 'shield' && <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>}
    {type === 'card' && <><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></>}
    {type === 'ticket' && <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>}
    {type === 'bell' && <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>}
    {type === 'logout' && <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>}
  </svg>
);

const MENU = [
  { path: '/', label: 'Dashboard', type: 'grid' },
  { path: '/users', label: 'Utilisateurs', type: 'users' },
  { path: '/verifications', label: 'Verifications', type: 'shield' },
  { path: '/transactions', label: 'Transactions', type: 'card' },
  { path: '/tickets', label: 'Tickets', type: 'ticket' },
  { path: '/notifications', label: 'Notifications', type: 'bell' },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logo}>
        <div style={styles.logoBox}>
          <span style={styles.logoLetter}>k</span>
        </div>
        <div>
          <div style={styles.logoText}>Kotizo</div>
          <div style={styles.logoSub}>Admin Panel</div>
        </div>
      </div>

      <nav style={styles.nav}>
        {MENU.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            style={({ isActive }) => ({
              ...styles.navItem,
              ...(isActive ? styles.navItemActive : {}),
            })}
          >
            <span style={styles.navIcon}><IC type={item.type} /></span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div style={styles.userSection}>
        <div style={styles.userAvatar}>
          {user?.pseudo?.charAt(0)?.toUpperCase()}
        </div>
        <div style={styles.userInfo}>
          <div style={styles.userName}>@{user?.pseudo}</div>
          <div style={styles.userRole}>{user?.admin_role || 'Admin'}</div>
        </div>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          style={styles.logoutBtn}
          title="Deconnexion"
        >
          <IC type="logout" />
        </button>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: 240,
    minHeight: '100vh',
    backgroundColor: '#0D1520',
    borderRight: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    left: 0, top: 0, bottom: 0,
    zIndex: 100,
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '24px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  logoBox: {
    width: 40, height: 40, backgroundColor: '#2563EB', borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoLetter: { color: '#FFF', fontSize: 20, fontWeight: 900 },
  logoText: { color: '#FFF', fontWeight: 700, fontSize: 16 },
  logoSub: { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
  nav: {
    flex: 1, padding: '12px',
    display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto',
  },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 12px', borderRadius: 10,
    color: 'rgba(255,255,255,0.5)',
    textDecoration: 'none', fontSize: 14, fontWeight: 500,
  },
  navItemActive: {
    backgroundColor: 'rgba(37,99,235,0.15)',
    color: '#3B82F6', fontWeight: 600,
  },
  navIcon: { width: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  userSection: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '16px', borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  userAvatar: {
    width: 34, height: 34, borderRadius: '50%', backgroundColor: '#2563EB',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#FFF', fontWeight: 700, fontSize: 14, flexShrink: 0,
  },
  userInfo: { flex: 1, minWidth: 0 },
  userName: {
    color: '#FFF', fontSize: 13, fontWeight: 600,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  userRole: { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
  logoutBtn: {
    background: 'none', border: 'none',
    color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', padding: 4,
  },
};