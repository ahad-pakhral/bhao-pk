import Link from "next/link";

export default function AdminDashboard() {
  const stats = [
    { label: "Active Users", value: "1,284", change: "+12%" },
    { label: "Products Tracked", value: "45,920", change: "+5%" },
    { label: "Price Alerts Sent", value: "8,432", change: "+24%" },
    { label: "Partner Stores", value: "12", change: "Stable" },
  ];

  const recentLogs = [
    { time: "14:20:05", event: "PRICE_UPDATE_SUCCESS", detail: "iPhone 15 Pro (Daraz)" },
    { time: "14:18:22", event: "NEW_USER_REGISTRATION", detail: "user_992@gmail.com" },
    { time: "14:15:10", event: "ALERT_DISPATCHED", detail: "Target: Rs. 60,000 (AirPods)" },
    { time: "14:10:45", event: "CRAWL_COMPLETED", detail: "Telemart / Electronics" },
  ];

  return (
    <div className="container" style={{ maxWidth: '1400px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid var(--border-light)', paddingBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '28px' }}>Admin Command Center</h2>
          <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>System Status: <span style={{ color: 'var(--accent-success)' }}>OPERATIONAL</span> // Session: admin_ahad_01</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" style={{ fontSize: '12px' }}>System Logs</button>
          <button className="btn btn-primary" style={{ fontSize: '12px' }}>Global Sync</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
        {stats.map((stat, i) => (
          <div key={i} className="card" style={{ padding: '24px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>{stat.label}</div>
            <div style={{ fontSize: '32px', fontWeight: '800', marginBottom: '4px' }}>{stat.value}</div>
            <div style={{ color: stat.change.startsWith('+') ? 'var(--accent-success)' : 'var(--text-muted)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>{stat.change}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px' }}>
        {/* Main Console */}
        <div>
          <div className="section-title"><h3>Platform Activity</h3></div>
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead style={{ background: 'var(--bg-core)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '11px' }}>
                <tr>
                  <th style={{ padding: '16px' }}>Timestamp</th>
                  <th style={{ padding: '16px' }}>Event Code</th>
                  <th style={{ padding: '16px' }}>Context Details</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((log, i) => (
                  <tr key={i} style={{ borderTop: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '16px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{log.time}</td>
                    <td style={{ padding: '16px' }}><span className="badge badge-secondary" style={{ fontSize: '10px' }}>{log.event}</span></td>
                    <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{log.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: '16px', textAlign: 'center', borderTop: '1px solid var(--border-light)' }}>
              <button className="btn btn-ghost" style={{ fontSize: '12px' }}>Load More activity</button>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div>
          <div className="section-title"><h3>System Health</h3></div>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                <span>CRAWLER LOAD</span>
                <span style={{ color: 'var(--accent-primary)' }}>42%</span>
              </div>
              <div style={{ height: '4px', background: '#222', borderRadius: '2px' }}>
                <div style={{ width: '42%', height: '100%', background: 'var(--accent-primary)', borderRadius: '2px' }}></div>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                <span>DATABASE LATENCY</span>
                <span style={{ color: 'var(--accent-success)' }}>12ms</span>
              </div>
              <div style={{ height: '4px', background: '#222', borderRadius: '2px' }}>
                <div style={{ width: '15%', height: '100%', background: 'var(--accent-success)', borderRadius: '2px' }}></div>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                <span>MEMORY USAGE</span>
                <span style={{ color: 'var(--accent-alert)' }}>88%</span>
              </div>
              <div style={{ height: '4px', background: '#222', borderRadius: '2px' }}>
                <div style={{ width: '88%', height: '100%', background: 'var(--accent-alert)', borderRadius: '2px' }}></div>
              </div>
            </div>
            <button className="btn btn-secondary" style={{ width: '100%', fontSize: '12px', marginTop: '12px' }}>Open Infrastructure Monitor</button>
          </div>
        </div>
      </div>
    </div>
  );
}
