import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import api from '../services/api';

const SVG = ({ type }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {type === 'user' && <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>}
    {type === 'users' && <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>}
    {type === 'card' && <><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></>}
    {type === 'money' && <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>}
    {type === 'chart' && <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>}
    {type === 'flash' && <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>}
    {type === 'shield' && <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>}
    {type === 'refresh' && <><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.56"/></>}
    {type === 'alert' && <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>}
    {type === 'ticket' && <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>}
  </svg>
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin-panel/dashboard/')
      .then(res => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const CARDS = stats ? [
    { label: 'Nouveaux users', value: stats.nouveaux_users_aujourd_hui, icon: <SVG type="user" />, color: '#2563EB' },
    { label: 'Users actifs', value: stats.users_actifs_total, icon: <SVG type="users" />, color: '#7C3AED' },
    { label: 'Transactions', value: stats.transactions_aujourd_hui, icon: <SVG type="card" />, color: '#059669' },
    { label: 'Revenus Kotizo', value: `${Number(stats.revenus_kotizo_aujourd_hui).toLocaleString()} F`, icon: <SVG type="money" />, color: '#F59E0B' },
    { label: 'Cotisations actives', value: stats.cotisations_actives, icon: <SVG type="chart" />, color: '#2563EB' },
    { label: 'Quick Pay actifs', value: stats.quickpay_actifs, icon: <SVG type="flash" />, color: '#059669' },
    { label: 'Verifications', value: stats.verifications_en_attente, icon: <SVG type="shield" />, color: '#F59E0B' },
    { label: 'Remboursements', value: stats.remboursements_en_attente, icon: <SVG type="refresh" />, color: '#EF4444' },
    { label: 'Alertes fraude', value: stats.alertes_fraude_nouvelles, icon: <SVG type="alert" />, color: '#EF4444' },
    { label: 'Tickets ouverts', value: stats.tickets_ouverts, icon: <SVG type="ticket" />, color: '#7C3AED' },
  ] : [];

  return (
    <Layout title="Dashboard">
      {loading ? (
        <div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: 60 }}>
          Chargement...
        </div>
      ) : (
        <>
          <div style={styles.grid}>
            {CARDS.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </div>

          {stats?.alertes_fraude_nouvelles > 0 && (
            <div style={styles.alertBanner}>
              <span style={{ fontWeight: 700 }}>Alertes fraude —</span>
              <span>
                {stats.alertes_fraude_nouvelles} alerte{stats.alertes_fraude_nouvelles > 1 ? 's' : ''} necessitent votre attention.
              </span>
            </div>
          )}

          {stats?.verifications_en_attente > 0 && (
            <div style={{ ...styles.alertBanner, borderColor: 'rgba(245,158,11,0.3)', backgroundColor: 'rgba(245,158,11,0.08)', color: '#F59E0B' }}>
              <span style={{ fontWeight: 700 }}>Verifications —</span>
              <span>
                {stats.verifications_en_attente} dossier{stats.verifications_en_attente > 1 ? 's' : ''} en attente.
              </span>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 16,
    marginBottom: 24,
  },
  alertBanner: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 12,
    padding: '14px 16px',
    color: '#EF4444',
    fontSize: 14,
    display: 'flex',
    gap: 6,
    alignItems: 'center',
    marginBottom: 12,
  },
};