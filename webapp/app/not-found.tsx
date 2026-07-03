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
      <div style={{ marginBottom: '8px' }}>
        <span className="eyebrow">Error 404</span>
      </div>
      <h1 style={{
        fontSize: 'clamp(56px, 12vw, 96px)',
        lineHeight: '1',
        marginBottom: '20px'
      }}>
        Page not found
      </h1>
      <p style={{ color: 'var(--text-2)', marginBottom: '36px', maxWidth: '46ch', fontSize: '16px', lineHeight: '1.7' }}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/" className="btn btn-primary btn-lg">
        <Home size={18} />
        Back home
      </Link>
    </div>
  );
}
