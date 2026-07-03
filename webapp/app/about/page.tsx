export default function AboutPage() {
  return (
    <div className="container" style={{ maxWidth: '760px' }}>
      <h1 style={{ marginBottom: '12px' }}>About Bhao.pk</h1>
      <p style={{ color: 'var(--text-3)', marginBottom: '48px', fontSize: '15px' }}>
        Pakistan&apos;s intelligent price comparison engine.
      </p>

      <section style={{ marginBottom: '48px', maxWidth: '68ch' }}>
        <h2 style={{ marginBottom: '16px' }}>Our Mission</h2>
        <p style={{ color: 'var(--text-2)', lineHeight: '1.8', fontSize: '16px' }}>
          BHAO.PK is Pakistan&apos;s intelligent price comparison engine, dedicated to helping consumers find the best deals across major e-commerce platforms. We believe in transparent pricing and empowering shoppers with real-time data.
        </p>
      </section>

      <section style={{ marginBottom: '48px', maxWidth: '68ch' }}>
        <h2 style={{ marginBottom: '16px' }}>What We Do</h2>
        <ul style={{ color: 'var(--text-2)', lineHeight: '2', fontSize: '16px', paddingLeft: '20px' }}>
          <li>Track prices across multiple stores in real-time</li>
          <li>Send alerts when prices drop on products you love</li>
          <li>Provide price history charts to help you make informed decisions</li>
          <li>Compare products side-by-side for the best value</li>
        </ul>
      </section>

      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ marginBottom: '20px' }}>Our Values</h2>
        <div style={{ display: 'grid', gap: '16px' }}>
          <div className="card">
            <h3 style={{ marginBottom: '8px' }}>Transparency</h3>
            <p style={{ color: 'var(--text-2)', lineHeight: '1.7' }}>We show you real prices from real stores with no hidden fees.</p>
          </div>
          <div className="card">
            <h3 style={{ marginBottom: '8px' }}>Accuracy</h3>
            <p style={{ color: 'var(--text-2)', lineHeight: '1.7' }}>Our scraping technology ensures up-to-date pricing information.</p>
          </div>
          <div className="card">
            <h3 style={{ marginBottom: '8px' }}>User-First</h3>
            <p style={{ color: 'var(--text-2)', lineHeight: '1.7' }}>Your savings are our priority. We&apos;re here to help you shop smarter.</p>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: '68ch' }}>
        <h2 style={{ marginBottom: '16px' }}>Contact Us</h2>
        <p style={{ color: 'var(--text-2)', lineHeight: '1.8', fontSize: '16px' }}>
          Have questions or feedback? Reach out to us at <a href="mailto:hello@bhao.pk" style={{ color: 'var(--accent)', textDecoration: 'none' }}>hello@bhao.pk</a>
        </p>
      </section>
    </div>
  );
}
