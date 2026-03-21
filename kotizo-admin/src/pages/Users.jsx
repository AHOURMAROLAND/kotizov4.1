import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

const NIVEAU_COLORS = {
  basique: { bg: 'rgba(255,255,255,0.08)', text: '#FFF' },
  verifie: { bg: 'rgba(34,197,94,0.15)', text: '#22C55E' },
  business: { bg: 'rgba(37,99,235,0.15)', text: '#60A5FA' },
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [niveau, setNiveau] = useState('');
  const [selected, setSelected] = useState(null);

  const charger = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (niveau) params.append('niveau', niveau);
    api.get(`/admin-panel/users/?${params}`)
      .then(res => setUsers(res.data))
      .finally(() => setLoading(false));
  }, [search, niveau]);

  useEffect(() => { charger(); }, [charger]);

  const suspendre = async (userId, actif) => {
    await api.patch(`/admin-panel/users/${userId}/`, { is_active: !actif });
    charger();
  };

  return (
    <Layout title="Utilisateurs">
      <div style={styles.filters}>
        <input
          style={styles.search}
          placeholder="Rechercher par pseudo, email, nom..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select style={styles.select} value={niveau} onChange={(e) => setNiveau(e.target.value)}>
          <option value="">Tous les niveaux</option>
          <option value="basique">Basique</option>
          <option value="verifie">Verifie</option>
          <option value="business">Business</option>
        </select>
      </div>

      <div style={styles.table}>
        <div style={styles.thead}>
          <div style={styles.th}>Utilisateur</div>
          <div style={styles.th}>Niveau</div>
          <div style={styles.th}>Cotisations</div>
          <div style={styles.th}>Inscription</div>
          <div style={styles.th}>Statut</div>
          <div style={styles.th}>Actions</div>
        </div>

        {loading ? (
          <div style={styles.empty}>Chargement...</div>
        ) : users.length === 0 ? (
          <div style={styles.empty}>Aucun utilisateur</div>
        ) : users.map((u) => {
          const niveauStyle = NIVEAU_COLORS[u.niveau] || NIVEAU_COLORS.basique;
          return (
            <div key={u.id} style={styles.row}>
              <div style={styles.td}>
                <div style={styles.userCell}>
                  <div style={styles.avatar}>
                    {u.pseudo?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ color: '#FFF', fontWeight: 600, fontSize: 14 }}>@{u.pseudo}</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{u.email}</div>
                  </div>
                </div>
              </div>
              <div style={styles.td}>
                <span style={{ ...styles.badge, backgroundColor: niveauStyle.bg, color: niveauStyle.text }}>
                  {u.niveau}
                </span>
              </div>
              <div style={{ ...styles.td, color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                {u.cotisations_creees_fenetre}/12
              </div>
              <div style={{ ...styles.td, color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                {new Date(u.date_inscription).toLocaleDateString('fr-FR')}
              </div>
              <div style={styles.td}>
                <span style={{
                  ...styles.badge,
                  backgroundColor: u.is_active ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                  color: u.is_active ? '#22C55E' : '#EF4444',
                }}>
                  {u.is_active ? 'Actif' : 'Suspendu'}
                </span>
              </div>
              <div style={styles.td}>
                <div style={styles.actions}>
                  <button
                    style={{ ...styles.btn, backgroundColor: 'rgba(37,99,235,0.2)', color: '#60A5FA' }}
                    onClick={() => setSelected(u)}
                  >
                    Voir
                  </button>
                  <button
                    style={{
                      ...styles.btn,
                      backgroundColor: u.is_active ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
                      color: u.is_active ? '#EF4444' : '#22C55E',
                    }}
                    onClick={() => suspendre(u.id, u.is_active)}
                  >
                    {u.is_active ? 'Suspendre' : 'Reactiver'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div style={styles.modal} onClick={() => setSelected(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={{ color: '#FFF', margin: 0 }}>@{selected.pseudo}</h2>
              <button onClick={() => setSelected(null)} style={styles.closeBtn}>x</button>
            </div>
            <div style={{ padding: '16px 24px' }}>
              {[
                ['Email', selected.email],
                ['Nom complet', `${selected.prenom} ${selected.nom}`],
                ['Telephone', selected.telephone],
                ['Niveau', selected.niveau],
                ['Pays', selected.pays],
                ['Email verifie', selected.email_verifie ? 'Oui' : 'Non'],
                ['WhatsApp verifie', selected.whatsapp_verifie ? 'Oui' : 'Non'],
                ['Code parrainage', selected.code_parrainage],
                ['Parrainages actifs', selected.nb_parrainages_actifs],
                ['Ville', selected.ville_approx || '-'],
              ].map(([label, value]) => (
                <div key={label} style={styles.detailRow}>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{label}</span>
                  <span style={{ color: '#FFF', fontSize: 13, fontWeight: 600 }}>{String(value ?? '-')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

const styles = {
  filters: { display: 'flex', gap: 12, marginBottom: 20 },
  search: { flex: 1, backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px', color: '#FFF', fontSize: 14, outline: 'none' },
  select: { backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px', color: '#FFF', fontSize: 14, outline: 'none' },
  table: { backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' },
  thead: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1.5fr', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', backgroundColor: '#0D1520' },
  th: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1.5fr', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' },
  td: {},
  empty: { padding: 32, textAlign: 'center', color: 'rgba(255,255,255,0.3)' },
  userCell: { display: 'flex', alignItems: 'center', gap: 10 },
  avatar: { width: 34, height: 34, borderRadius: '50%', backgroundColor: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 700, fontSize: 14, flexShrink: 0 },
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  actions: { display: 'flex', gap: 6 },
  btn: { border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  modal: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, width: '100%', maxWidth: 480, maxHeight: '80vh', overflow: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  closeBtn: { background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 16, cursor: 'pointer', padding: 4 },
  detailRow: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' },
};