import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin-panel/transactions/')
      .then(res => setTransactions(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout title="Transactions">
      <div style={styles.table}>
        <div style={styles.thead}>
          <div style={styles.th}>Utilisateur</div>
          <div style={styles.th}>Type</div>
          <div style={styles.th}>Montant</div>
          <div style={styles.th}>Frais Kotizo</div>
          <div style={styles.th}>Statut</div>
          <div style={styles.th}>Date</div>
        </div>

        {loading ? (
          <div style={styles.empty}>Chargement...</div>
        ) : transactions.length === 0 ? (
          <div style={styles.empty}>Aucune transaction</div>
        ) : transactions.map((t) => (
          <div key={t.id} style={styles.row}>
            <div style={{ color: '#FFF', fontSize: 13, fontWeight: 600 }}>
              @{t.user_pseudo}
            </div>
            <div>
              <span style={{
                ...styles.badge,
                backgroundColor: t.type_transaction === 'payin' ? 'rgba(34,197,94,0.12)' : 'rgba(37,99,235,0.12)',
                color: t.type_transaction === 'payin' ? '#22C55E' : '#60A5FA',
              }}>
                {t.type_transaction}
              </span>
            </div>
            <div style={{ color: '#FFF', fontWeight: 700 }}>
              {Number(t.montant).toLocaleString()} F
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
              {Number(t.frais_kotizo).toLocaleString()} F
            </div>
            <div>
              <span style={{
                ...styles.badge,
                backgroundColor: t.statut === 'complete' ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)',
                color: t.statut === 'complete' ? '#22C55E' : '#F59E0B',
              }}>
                {t.statut}
              </span>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
              {new Date(t.date_creation).toLocaleDateString('fr-FR')}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}

const styles = {
  table: { backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' },
  thead: { display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1fr', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', backgroundColor: '#0D1520' },
  th: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1fr', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' },
  empty: { padding: 32, textAlign: 'center', color: 'rgba(255,255,255,0.3)' },
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
};