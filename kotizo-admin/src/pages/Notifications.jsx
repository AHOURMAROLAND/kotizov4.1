import React, { useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export default function Notifications() {
  const [form, setForm] = useState({ titre: '', message: '', canal: 'both', niveau: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const envoyer = async (e) => {
    e.preventDefault();
    if (!form.titre || !form.message) {
      setError('Titre et message obligatoires');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/notifications/admin/envoyer/', form);
      setSuccess('Notification envoyee avec succes.');
      setForm({ titre: '', message: '', canal: 'both', niveau: '' });
    } catch {
      setError('Erreur lors de l\'envoi de la notification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Envoyer une notification">
      <div style={{ maxWidth: 640 }}>
        <div style={styles.card}>
          <h2 style={{ color: '#FFF', fontSize: 18, fontWeight: 700, margin: '0 0 24px' }}>
            Nouvelle notification
          </h2>

          {success && <div style={styles.successBox}>{success}</div>}
          {error && <div style={styles.errorBox}>{error}</div>}

          <form onSubmit={envoyer}>
            <Field label="Titre">
              <input
                style={styles.input}
                value={form.titre}
                onChange={update('titre')}
                placeholder="Ex: Offre speciale de verification"
                maxLength={100}
              />
            </Field>

            <Field label="Message">
              <textarea
                style={{ ...styles.input, height: 100, resize: 'vertical' }}
                value={form.message}
                onChange={update('message')}
                placeholder="Contenu de la notification..."
                maxLength={500}
              />
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 4 }}>
                {form.message.length}/500
              </div>
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Canal d'envoi">
                <select style={styles.select} value={form.canal} onChange={update('canal')}>
                  <option value="both">WhatsApp + In-app</option>
                  <option value="whatsapp">WhatsApp uniquement</option>
                  <option value="inapp">In-app uniquement</option>
                </select>
              </Field>
              <Field label="Cibler les utilisateurs">
                <select style={styles.select} value={form.niveau} onChange={update('niveau')}>
                  <option value="">Tous les utilisateurs</option>
                  <option value="basique">Basique uniquement</option>
                  <option value="verifie">Verifie uniquement</option>
                  <option value="business">Business uniquement</option>
                </select>
              </Field>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                Apercu
              </div>
              <div style={styles.preview}>
                <div style={{ color: '#FFF', fontWeight: 700, marginBottom: 6 }}>
                  {form.titre || 'Titre de la notification'}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.6 }}>
                  {form.message || 'Le message apparaitra ici...'}
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} style={styles.btn}>
              {loading ? 'Envoi en cours...' : 'Envoyer la notification'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}

const styles = {
  card: {
    backgroundColor: '#111827',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 20,
    padding: 28,
  },
  successBox: {
    backgroundColor: 'rgba(34,197,94,0.1)',
    border: '1px solid rgba(34,197,94,0.3)',
    borderRadius: 10,
    padding: '12px 16px',
    color: '#22C55E',
    fontSize: 14,
    marginBottom: 16,
  },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 10,
    padding: '12px 16px',
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 16,
  },
  input: {
    width: '100%',
    backgroundColor: '#1E293B',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: '11px 14px',
    color: '#FFF',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    backgroundColor: '#1E293B',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: '11px 14px',
    color: '#FFF',
    fontSize: 14,
    outline: 'none',
  },
  preview: {
    backgroundColor: '#0D1520',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 16,
  },
  btn: {
    width: '100%',
    backgroundColor: '#2563EB',
    border: 'none',
    borderRadius: 12,
    padding: '14px',
    color: '#FFF',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  },
};