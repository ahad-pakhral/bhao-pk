export default function PrivacyPage() {
  return (
    <div className="container" style={{ maxWidth: '760px' }}>
      <h1 style={{ marginBottom: '12px' }}>Privacy Policy</h1>

      <p style={{ color: 'var(--text-3)', marginBottom: '48px', fontSize: '14px' }}>
        Last updated: {new Date().toLocaleDateString()}
      </p>

      <section style={{ marginBottom: '48px', maxWidth: '68ch' }}>
        <h2 style={{ marginBottom: '16px' }}>Information We Collect</h2>
        <p style={{ color: 'var(--text-2)', lineHeight: '1.8', marginBottom: '16px', fontSize: '16px' }}>
          We collect information you provide directly to us, such as when you create an account, set price alerts, or contact us for support.
        </p>
        <ul style={{ color: 'var(--text-2)', lineHeight: '2', fontSize: '16px', paddingLeft: '20px' }}>
          <li>Account information (name, email, password)</li>
          <li>Search history and preferences</li>
          <li>Wishlist and price alert settings</li>
          <li>Device and usage information</li>
        </ul>
      </section>

      <section style={{ marginBottom: '48px', maxWidth: '68ch' }}>
        <h2 style={{ marginBottom: '16px' }}>How We Use Your Information</h2>
        <ul style={{ color: 'var(--text-2)', lineHeight: '2', fontSize: '16px', paddingLeft: '20px' }}>
          <li>To provide and improve our services</li>
          <li>To send you price alerts and notifications</li>
          <li>To personalize your experience</li>
          <li>To communicate with you about our services</li>
          <li>To detect and prevent fraud</li>
        </ul>
      </section>

      <section style={{ marginBottom: '48px', maxWidth: '68ch' }}>
        <h2 style={{ marginBottom: '16px' }}>Data Security</h2>
        <p style={{ color: 'var(--text-2)', lineHeight: '1.8', fontSize: '16px' }}>
          We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
        </p>
      </section>

      <section style={{ marginBottom: '48px', maxWidth: '68ch' }}>
        <h2 style={{ marginBottom: '16px' }}>Your Rights</h2>
        <p style={{ color: 'var(--text-2)', lineHeight: '1.8', marginBottom: '16px', fontSize: '16px' }}>
          You have the right to:
        </p>
        <ul style={{ color: 'var(--text-2)', lineHeight: '2', fontSize: '16px', paddingLeft: '20px' }}>
          <li>Access your personal information</li>
          <li>Correct inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Opt-out of marketing communications</li>
          <li>Export your data</li>
        </ul>
      </section>

      <section style={{ marginBottom: '48px', maxWidth: '68ch' }}>
        <h2 style={{ marginBottom: '16px' }}>Cookies</h2>
        <p style={{ color: 'var(--text-2)', lineHeight: '1.8', fontSize: '16px' }}>
          We use cookies and similar technologies to enhance your experience, analyze usage, and deliver personalized content. You can control cookies through your browser settings.
        </p>
      </section>

      <section style={{ maxWidth: '68ch' }}>
        <h2 style={{ marginBottom: '16px' }}>Contact Us</h2>
        <p style={{ color: 'var(--text-2)', lineHeight: '1.8', fontSize: '16px' }}>
          If you have questions about this privacy policy, please contact us at <a href="mailto:privacy@bhao.pk" style={{ color: 'var(--accent)', textDecoration: 'none' }}>privacy@bhao.pk</a>
        </p>
      </section>
    </div>
  );
}
