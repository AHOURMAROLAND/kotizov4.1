import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

const PRIORITE_COLORS = {
  urgente: '#EF4444',
  haute: '#F59E0B',
  normale: '#60A5FA',
  faible: 'rgba(255,255,255,0.4)',
};

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    api.get('/admin-panel/tickets/')
      .then(res => setTickets(res.data))
      .finally(() => setLoading(false));
  }, []);

  const fermer = async (id) => {
    await api.patch(`/admin-panel/tickets/${id}/`, { statut: 'ferme', note_admin: note });
    setSelected(null);
    setNote('');
    setTickets(prev => prev.map(t => t.id === id ? { ...t, statut: 'ferme' } : t));
  };

  return (
    <Layout title="Tickets Support">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <div style={styles.empty}>Chargement...</div>
        ) : tickets.length === 0 ? (
          <div style={styles.empty}>Aucun ticket</div>
        ) : tickets.map((t) => (
          <div key={t.id} style={styles.card}>
            <div style={{ display: 'flex', flex: 1, alignItems: 'flex-start' }}>
              <div style={{
                width: 4,
                alignSelf: 'stretch',
                borderRadius: 2,
                backgroundColor: PRIORITE_COLORS[t.priorite] || '#60A5FA',
                marginRight: 16,
                flexShrink: 0,
              }} />
              <div>
                <div style={{ color: '#FFF', fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                  {t.sujet}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 8 }}>
                  {t.description?.slice(0, 120)}{t.description?.length > 120 ? '...' : ''}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={styles.badgeDefault}>@{t.user_pseudo}</span>
                  <span style={{ ...styles.badgeDefault, backgroundColor: 'rgba(37,99,235,0.12)', color: '#60A5FA' }}>
                    {t.priorite}
                  </span>
                  {t.cree_par_ia && (
                    <span style={{ ...styles.badgeDefault, backgroundColor: 'rgba(124,58,237,0.12)', color: '#A78BFA' }}>
                      Via IA
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0, marginLeft: 16 }}>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
                {new Date(t.date_creation).toLocaleDateString('fr-FR')}
              </span>
              <span style={{
                ...styles.badgeDefault,
                backgroundColor: t.statut === 'ouvert' ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.06)',
                color: t.statut === 'ouvert' ? '#22C55E' : 'rgba(255,255,255,0.4)',
              }}>
                {t.statut}
              </span>
              {t.statut === 'ouvert' && (
                <button style={styles.btnFermer} onClick={() => setSelected(t)}>
                  Fermer
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div style={styles.modal} onClick={() => setSelected(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: '#FFF', margin: '0 0 16px' }}>Fermer le ticket</h3>
            <textarea
              style={styles.textarea}
              placeholder="Note de resolution (optionnel)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                style={{ flex: 1, backgroundColor: '#2563EB', border: 'none', borderRadius: 10, padding: '10px', color: '#FFF', fontWeight: 700, cursor: 'pointer' }}
                onClick={() => fermer(selected.id)}
              >
                Confirmer
              </button>
              <button
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 10, padding: '10px 20px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, cursor: 'pointer' }}
                onClick={() => setSelected(null)}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

const styles = {
  empty: { padding: 60, textAlign: 'center', color: 'rgba(255,255,255,0.3)' },
  card: { backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  badgeDefault: { display: 'inline-block', padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' },
  btnFermer: { backgroundColor: 'rgba(34,197,94,0.15)', border: 'none', borderRadius: 8, padding: '7px 14px', color: '#22C55E', fontWeight: 700, cursor: 'pointer', fontSize: 12 },
  modal: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400 },
  textarea: { width: '100%', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px', color: '#FFF', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box' },
};