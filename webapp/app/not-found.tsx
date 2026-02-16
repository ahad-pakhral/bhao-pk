import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <div style={{
        fontSize: '6rem',
        fontWeight: 'bold',
        color: 'var(--accent-primary)',
        marginBottom: '1rem'
      }}>
        404
      </div>
      <h1 style={{ color: 'var(--text-main)', marginBottom: '1rem', fontSize: '2rem' }}>
        Page Not Found
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '500px' }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link href="/" style={{
        backgroundColor: 'var(--accent-primary)',
        color: 'var(--bg-core)',
        padding: '1rem 2rem',
        borderRadius: '8px',
        textDecoration: 'none',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <Home size={20} />
        GO HOME
      </Link>
    </div>
  );
}
