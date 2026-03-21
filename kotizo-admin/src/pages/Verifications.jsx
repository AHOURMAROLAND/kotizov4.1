import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

export default function Verifications() {
  const [verifs, setVerifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [prix, setPrix] = useState(1000);
  const [note, setNote] = useState('');

  const charger = () => {
    api.get('/admin-panel/verifications/')
      .then(res => setVerifs(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { charger(); }, []);

  const approuver = async () => {
    await api.post(`/admin-panel/verifications/${selected.id}/approuver/`, {
      prix, note_admin: note,
    });
    setSelected(null);
    setNote('');
    charger();
  };

  const rejeter = async (id, raison) => {
    await api.post(`/admin-panel/verifications/${id}/rejeter/`, { raison });
    charger();
  };

  return (
    <Layout title="Verifications d'identite">
      {loading ? (
        <div style={styles.empty}>Chargement...</div>
      ) : verifs.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>v</div>
          <div style={{ color: '#FFF', fontWeight: 600, marginBottom: 8 }}>
            Aucun dossier en attente
          </div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
            Tous les dossiers ont ete traites
          </div>
        </div>
      ) : (
        <div style={styles.grid}>
          {verifs.map((v) => (
            <div key={v.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <div style={{ color: '#FFF', fontWeight: 700, fontSize: 15 }}>
                    @{v.user_pseudo}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                    {v.user_email}
                  </div>
                </div>
                <span style={{
                  ...styles.badge,
                  backgroundColor: v.liveness_valide ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                  color: v.liveness_valide ? '#22C55E' : '#EF4444',
                }}>
                  {v.liveness_valide ? 'Liveness OK' : 'Liveness KO'}
                </span>
              </div>

              <div style={styles.docRow}>
                {v.photo_recto && (
                  <a href={v.photo_recto} target="_blank" rel="noreferrer" style={styles.docLink}>
                    Voir recto
                  </a>
                )}
                {v.photo_verso && (
                  <a href={v.photo_verso} target="_blank" rel="noreferrer" style={styles.docLink}>
                    Voir verso
                  </a>
                )}
              </div>

              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 14 }}>
                Soumis le {new Date(v.date_soumission).toLocaleDateString('fr-FR')}
              </div>

              <div style={styles.cardActions}>
                <button style={styles.btnApprouver} onClick={() => setSelected(v)}>
                  Approuver
                </button>
                <button
                  style={styles.btnRejeter}
                  onClick={() => rejeter(v.id, 'Document illisible')}
                >
                  Rejeter
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div style={styles.modal} onClick={() => setSelected(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: '#FFF', margin: '0 0 20px' }}>
              Approuver @{selected.user_pseudo}
            </h2>

            <div style={{ marginBottom: 16 }}>
              <label style={styles.label}>Prix de verification</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1000, 500].map((p) => (
                  <button
                    key={p}
                    style={{
                      flex: 1,
                      border: `1px solid ${prix === p ? '#2563EB' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: 10,
                      padding: '10px',
                      backgroundColor: prix === p ? 'rgba(37,99,235,0.2)' : 'rgba(255,255,255,0.05)',
                      color: prix === p ? '#60A5FA' : 'rgba(255,255,255,0.5)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                    onClick={() => setPrix(p)}
                  >
                    {p.toLocaleString()} FCFA {p === 500 ? '(Reduit)' : '(Normal)'}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={styles.label}>Note interne (optionnel)</label>
              <textarea
                style={styles.textarea}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Raison du prix reduit, observations..."
                rows={3}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button style={styles.btnApprouver} onClick={approuver}>
                Confirmer l'approbation
              </button>
              <button
                style={{ ...styles.btnRejeter, flex: 'none', padding: '10px 20px' }}
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
  empty: { padding: 32, textAlign: 'center', color: 'rgba(255,255,255,0.3)' },
  emptyState: { textAlign: 'center', padding: '80px 20px' },
  emptyIcon: { fontSize: 48, color: 'rgba(255,255,255,0.15)', marginBottom: 16, fontWeight: 700 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 },
  card: { backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 20 },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  docRow: { display: 'flex', gap: 8, marginBottom: 12 },
  docLink: { backgroundColor: 'rgba(37,99,235,0.15)', color: '#60A5FA', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none' },
  cardActions: { display: 'flex', gap: 8 },
  btnApprouver: { flex: 1, backgroundColor: 'rgba(34,197,94,0.15)', border: 'none', borderRadius: 10, padding: '10px', color: '#22C55E', fontWeight: 700, cursor: 'pointer', fontSize: 13 },
  btnRejeter: { flex: 1, backgroundColor: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 10, padding: '10px', color: '#EF4444', fontWeight: 700, cursor: 'pointer', fontSize: 13 },
  modal: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 420 },
  label: { display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 500, marginBottom: 8 },
  textarea: { width: '100%', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px', color: '#FFF', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box' },
};