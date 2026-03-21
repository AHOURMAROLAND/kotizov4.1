import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoSection}>
          <div style={styles.logoBox}>
            <span style={{ color: '#FFF', fontSize: 28, fontWeight: 900 }}>k</span>
          </div>
          <h1 style={styles.title}>Kotizo Admin</h1>
          <p style={styles.subtitle}>Connectez-vous au dashboard</p>
        </div>

        {error && (
          <div style={styles.errorBox}>{error}</div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Adresse email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              style={styles.input}
              placeholder="admin@kotizo.app"
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Mot de passe</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              style={styles.input}
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh', backgroundColor: '#0A0F1E',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
  },
  card: {
    backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 20, padding: '40px', width: '100%', maxWidth: 420,
  },
  logoSection: { textAlign: 'center', marginBottom: 32 },
  logoBox: {
    width: 60, height: 60, backgroundColor: '#2563EB', borderRadius: 16,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  title: { color: '#FFF', fontSize: 24, fontWeight: 700, margin: '0 0 8px' },
  subtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: 0 },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 10, padding: '12px 16px', color: '#EF4444',
    fontSize: 14, marginBottom: 20,
  },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 500 },
  input: {
    backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10, padding: '12px 14px', color: '#FFF', fontSize: 14,
    outline: 'none', width: '100%', boxSizing: 'border-box',
  },
  btn: {
    backgroundColor: '#2563EB', border: 'none', borderRadius: 12,
    padding: '14px', color: '#FFF', fontSize: 15, fontWeight: 700,
    cursor: 'pointer', marginTop: 8, width: '100%',
  },
};