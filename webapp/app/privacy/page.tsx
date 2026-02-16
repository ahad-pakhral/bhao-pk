export default function PrivacyPage() {
  return (
    <div style={{ padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: 'var(--accent-primary)', marginBottom: '2rem', fontSize: '3rem' }}>Privacy Policy</h1>
      
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Last updated: {new Date().toLocaleDateString()}
      </p>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>Information We Collect</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8', marginBottom: '1rem' }}>
          We collect information you provide directly to us, such as when you create an account, set price alerts, or contact us for support.
        </p>
        <ul style={{ color: 'var(--text-secondary)', lineHeight: '2' }}>
          <li>Account information (name, email, password)</li>
          <li>Search history and preferences</li>
          <li>Wishlist and price alert settings</li>
          <li>Device and usage information</li>
        </ul>
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>How We Use Your Information</h2>
        <ul style={{ color: 'var(--text-secondary)', lineHeight: '2' }}>
          <li>To provide and improve our services</li>
          <li>To send you price alerts and notifications</li>
          <li>To personalize your experience</li>
          <li>To communicate with you about our services</li>
          <li>To detect and prevent fraud</li>
        </ul>
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>Data Security</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
          We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
        </p>
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>Your Rights</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8', marginBottom: '1rem' }}>
          You have the right to:
        </p>
        <ul style={{ color: 'var(--text-secondary)', lineHeight: '2' }}>
          <li>Access your personal information</li>
          <li>Correct inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Opt-out of marketing communications</li>
          <li>Export your data</li>
        </ul>
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>Cookies</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
          We use cookies and similar technologies to enhance your experience, analyze usage, and deliver personalized content. You can control cookies through your browser settings.
        </p>
      </section>

      <section>
        <h2 style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>Contact Us</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
          If you have questions about this privacy policy, please contact us at <a href="mailto:privacy@bhao.pk" style={{ color: 'var(--accent-primary)' }}>privacy@bhao.pk</a>
        </p>
      </section>
    </div>
  );
}
