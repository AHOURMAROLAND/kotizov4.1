import React from 'react';

export default function StatCard({ label, value, icon, color = '#2563EB', trend }) {
  return (
    <div style={styles.card}>
      <div style={styles.top}>
        <div style={{ ...styles.iconBox, backgroundColor: color + '20', color }}>
          {icon}
        </div>
        {trend !== undefined && (
          <span style={{ fontSize: 12, fontWeight: 600, color: trend >= 0 ? '#22C55E' : '#EF4444' }}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div style={styles.value}>{value}</div>
      <div style={styles.label}>{label}</div>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: '#111827',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: '20px',
    flex: 1,
    minWidth: 160,
  },
  top: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconBox: {
    width: 44, height: 44,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { color: '#FFF', fontSize: 28, fontWeight: 800, marginBottom: 4 },
  label: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
};