export default function AboutPage() {
  return (
    <div style={{ padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: 'var(--accent-primary)', marginBottom: '2rem', fontSize: '3rem' }}>About BHAO.PK</h1>
      
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>Our Mission</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
          BHAO.PK is Pakistan's intelligent price comparison engine, dedicated to helping consumers find the best deals across major e-commerce platforms. We believe in transparent pricing and empowering shoppers with real-time data.
        </p>
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>What We Do</h2>
        <ul style={{ color: 'var(--text-secondary)', lineHeight: '2' }}>
          <li>Track prices across multiple stores in real-time</li>
          <li>Send alerts when prices drop on products you love</li>
          <li>Provide price history charts to help you make informed decisions</li>
          <li>Compare products side-by-side for the best value</li>
        </ul>
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>Our Values</h2>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
            <h3 style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>Transparency</h3>
            <p style={{ color: 'var(--text-secondary)' }}>We show you real prices from real stores with no hidden fees.</p>
          </div>
          <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
            <h3 style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>Accuracy</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Our scraping technology ensures up-to-date pricing information.</p>
          </div>
          <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
            <h3 style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>User-First</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Your savings are our priority. We're here to help you shop smarter.</p>
          </div>
        </div>
      </section>

      <section>
        <h2 style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>Contact Us</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Have questions or feedback? Reach out to us at <a href="mailto:hello@bhao.pk" style={{ color: 'var(--accent-primary)' }}>hello@bhao.pk</a>
        </p>
      </section>
    </div>
  );
}
