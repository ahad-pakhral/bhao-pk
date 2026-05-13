"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../../store/authStore";
import { useToast } from "../../../components/Toast";

export default function AdminDashboard() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user, token, isAuthenticated, isLoading } = useAuthStore();

  const [stats, setStats] = useState<null | {
    totalUsers: number;
    activeAlerts: number;
    searchesToday: number;
    wishlistItems: number;
  }>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const [activity, setActivity] = useState<Array<{ ts: string; code: string; detail: string }>>([]);
  const [activityCursor, setActivityCursor] = useState<string | null>(null);
  const [hasMoreActivity, setHasMoreActivity] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(false);

  const [health, setHealth] = useState<any>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [realtimeOn, setRealtimeOn] = useState(true);
  const [lastRealtimeUpdate, setLastRealtimeUpdate] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  const fetchStats = () => {
    if (!token) return;
    setLoadingStats(true);
    fetch(`${API_BASE}/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.ok ? res.json() : Promise.reject(new Error(`Failed to load stats (${res.status})`)))
      .then((data) => {
        const s = data?.stats || null;
        if (s) {
          setStats({
            totalUsers: Number(s.totalUsers || 0),
            activeAlerts: Number(s.activeAlerts || 0),
            searchesToday: Number(s.searchesToday || 0),
            wishlistItems: Number(s.wishlistItems || 0),
          });
        } else {
          setStats(null);
        }
      })
      .catch((err) => {
        console.error(err);
        showToast(err?.message || "Failed to load admin stats", "error");
        setStats(null);
      })
      .finally(() => setLoadingStats(false));
  };

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !token) {
      router.replace("/admin/login");
      return;
    }
    if (!user || String(user.role || "").toUpperCase() !== "ADMIN") {
      showToast("Forbidden", "error");
      router.replace("/");
      return;
    }

    fetchStats();
    fetchActivityLatest();
    fetchHealth();
  }, [isLoading, isAuthenticated, token, user?.role]);

  const statCards = [
    { label: "Total Users", value: stats ? stats.totalUsers.toLocaleString() : "—" },
    { label: "Active Alerts", value: stats ? stats.activeAlerts.toLocaleString() : "—" },
    { label: "Searches Today", value: stats ? stats.searchesToday.toLocaleString() : "—" },
    { label: "Wishlist Items", value: stats ? stats.wishlistItems.toLocaleString() : "—" },
  ];

  function recomputeCursor(nextEvents: Array<{ ts: string; code: string; detail: string }>) {
    const last = nextEvents.length > 0 ? nextEvents[nextEvents.length - 1] : null;
    const nextCursor = last ? last.ts : null;
    setActivityCursor((prev) => (prev === nextCursor ? prev : nextCursor));
  }

  const fetchActivityLatest = () => {
    if (!token) return;
    if (loadingActivity) return;
    setLoadingActivity(true);

    const qs = new URLSearchParams();
    qs.set("limit", "20");

    fetch(`${API_BASE}/admin/activity?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.ok ? res.json() : Promise.reject(new Error(`Failed to load activity (${res.status})`)))
      .then((data) => {
        const items = Array.isArray(data?.events) ? data.events : [];
        setActivity((prev) => {
          // Merge newest items into existing, dedupe, keep newest-first.
          const seen = new Set<string>();
          const merged: Array<{ ts: string; code: string; detail: string }> = [];
          for (const e of [...items, ...prev]) {
            const key = `${e.ts}|${e.code}|${e.detail}`;
            if (seen.has(key)) continue;
            seen.add(key);
            merged.push(e);
          }
          merged.sort((a, b) => (a.ts > b.ts ? -1 : a.ts < b.ts ? 1 : 0));
          return merged.slice(0, 200);
        });
      })
      .catch((err) => {
        console.error(err);
        showToast(err?.message || "Failed to load activity", "error");
      })
      .finally(() => setLoadingActivity(false));
  };

  const fetchActivityOlder = () => {
    if (!token) return;
    if (loadingActivity) return;
    if (!activityCursor) return;
    setLoadingActivity(true);

    const qs = new URLSearchParams();
    qs.set("limit", "20");
    qs.set("before", activityCursor);

    fetch(`${API_BASE}/admin/activity?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.ok ? res.json() : Promise.reject(new Error(`Failed to load activity (${res.status})`)))
      .then((data) => {
        const items = Array.isArray(data?.events) ? data.events : [];
        if (items.length === 0) {
          setHasMoreActivity(false);
          return;
        }
        setActivity((prev) => {
          const combined = [...prev, ...items];
          // Keep order newest-first
          combined.sort((a, b) => (a.ts > b.ts ? -1 : a.ts < b.ts ? 1 : 0));
          // Dedupe after sorting
          const seen = new Set<string>();
          const deduped: Array<{ ts: string; code: string; detail: string }> = [];
          for (const e of combined) {
            const key = `${e.ts}|${e.code}|${e.detail}`;
            if (seen.has(key)) continue;
            seen.add(key);
            deduped.push(e);
          }
          return deduped.slice(0, 200);
        });
      })
      .catch((err) => {
        console.error(err);
        showToast(err?.message || "Failed to load activity", "error");
      })
      .finally(() => setLoadingActivity(false));
  };

  const fetchHealth = () => {
    if (!token) return;
    if (loadingHealth) return;
    setLoadingHealth(true);
    fetch(`${API_BASE}/admin/health`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.ok ? res.json() : Promise.reject(new Error(`Failed to load health (${res.status})`)))
      .then((data) => setHealth(data))
      .catch((err) => {
        console.error(err);
        showToast(err?.message || "Failed to load health", "error");
      })
      .finally(() => setLoadingHealth(false));
  };

  const runAlertCheck = () => {
    if (!token) return;
    fetch(`${API_BASE}/admin/run-alert-check`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.ok ? res.json() : Promise.reject(new Error(`Failed to start alert check (${res.status})`)))
      .then(() => {
        showToast("Alert check started", "success");
        // Refresh activity shortly after kick-off.
        setTimeout(() => fetchActivityLatest(), 1500);
      })
      .catch((err) => {
        console.error(err);
        showToast(err?.message || "Failed to start alert check", "error");
      });
  };

  const formatTs = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  };

  // Keep activity cursor aligned to the oldest loaded event (used for pagination).
  useEffect(() => {
    recomputeCursor(activity);
  }, [activity]);

  // "Realtime" for admin: polling every 5 seconds (keeps it simple and robust).
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !token) return;
    if (!user || String(user.role || "").toUpperCase() !== "ADMIN") return;
    if (!realtimeOn) return;

    const tick = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      fetchStats();
      fetchActivityLatest();
      fetchHealth();
      setLastRealtimeUpdate(new Date().toISOString());
    };

    const id = window.setInterval(tick, 5000);
    return () => window.clearInterval(id);
  }, [realtimeOn, isLoading, isAuthenticated, token, user?.role]);

  return (
    <div className="container" style={{ maxWidth: '1400px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid var(--border-light)', paddingBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '28px' }}>Admin Command Center</h2>
          <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
            System Status: <span style={{ color: 'var(--accent-success)' }}>OPERATIONAL</span> // Session: {user?.email || "admin"}
          </p>
          <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '11px', marginTop: '6px' }}>
            Realtime: {realtimeOn ? "ON" : "OFF"}{lastRealtimeUpdate ? ` // Last: ${formatTs(lastRealtimeUpdate)}` : ""}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" style={{ fontSize: '12px' }} onClick={runAlertCheck}>Run Alert Check</button>
          <button
            className="btn btn-secondary"
            style={{ fontSize: '12px' }}
            onClick={() => setRealtimeOn(v => !v)}
          >
            {realtimeOn ? "Pause Realtime" : "Resume Realtime"}
          </button>
          <button
            className="btn btn-primary"
            style={{ fontSize: '12px' }}
            disabled={loadingStats || loadingActivity || loadingHealth}
            onClick={() => { fetchStats(); fetchActivityLatest(); fetchHealth(); }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
        {statCards.map((stat, i) => (
          <div key={i} className="card" style={{ padding: '24px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>{stat.label}</div>
            <div style={{ fontSize: '32px', fontWeight: '800', marginBottom: '4px' }}>{stat.value}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
              {loadingStats ? "Loading..." : "Live"}
            </div>
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
                {activity.length === 0 ? (
                  <tr style={{ borderTop: '1px solid var(--border-light)' }}>
                    <td colSpan={3} style={{ padding: '16px', color: 'var(--text-muted)' }}>
                      {loadingActivity ? "Loading activity..." : "No activity yet."}
                    </td>
                  </tr>
                ) : (
                  activity.map((log, i) => (
                    <tr key={`${log.ts}-${i}`} style={{ borderTop: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '16px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{formatTs(log.ts)}</td>
                      <td style={{ padding: '16px' }}><span className="badge badge-secondary" style={{ fontSize: '10px' }}>{log.code}</span></td>
                      <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{log.detail}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div style={{ padding: '16px', textAlign: 'center', borderTop: '1px solid var(--border-light)' }}>
              <button
                className="btn btn-ghost"
                style={{ fontSize: '12px' }}
                disabled={loadingActivity || !hasMoreActivity || !activityCursor}
                onClick={fetchActivityOlder}
              >
                {hasMoreActivity && activityCursor ? (loadingActivity ? "Loading..." : "Load More activity") : "No more activity"}
              </button>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div>
          <div className="section-title"><h3>System Health</h3></div>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {loadingHealth ? "Loading..." : (health?.now ? `Updated: ${formatTs(health.now)}` : "No health data")}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span>DB LATENCY</span>
                <span style={{ color: 'var(--accent-success)' }}>{health?.db?.latencyMs != null ? `${health.db.latencyMs}ms` : "—"}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span>REDIS</span>
                <span style={{ color: health?.cache?.connected ? 'var(--accent-success)' : 'var(--accent-alert)' }}>
                  {health?.cache?.connected ? "Connected" : "Disconnected"}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span>MEMORY (RSS)</span>
                <span style={{ color: 'var(--accent-primary)' }}>{health?.memory?.rssMB != null ? `${health.memory.rssMB}MB` : "—"}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span>UPTIME</span>
                <span style={{ color: 'var(--text-secondary)' }}>{health?.uptimeSeconds != null ? `${health.uptimeSeconds}s` : "—"}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span>ALERT CHECKER</span>
                <span style={{ color: 'var(--text-secondary)' }}>{health?.alertChecker?.schedule || "—"}</span>
              </div>
            </div>

            <button
              className="btn btn-secondary"
              style={{ width: '100%', fontSize: '12px', marginTop: '8px' }}
              onClick={() => window.open(`/admin/health`, "_blank")}
              disabled={!token}
            >
              Open Health JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
