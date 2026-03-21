import React from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children, title }) {
  return (
    <div style={styles.wrapper}>
      <Sidebar />
      <main style={styles.main}>
        {title && (
          <div style={styles.pageHeader}>
            <h1 style={styles.pageTitle}>{title}</h1>
          </div>
        )}
        <div>{children}</div>
      </main>
    </div>
  );
}

const styles = {
  wrapper: { display: 'flex', minHeight: '100vh', backgroundColor: '#0A0F1E' },
  main: { marginLeft: 240, flex: 1, padding: '32px', minHeight: '100vh' },
  pageHeader: { marginBottom: 24 },
  pageTitle: { color: '#FFF', fontSize: 24, fontWeight: 700, margin: 0 },
};