"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../../store/authStore";

export default function AdminHealthPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading } = useAuthStore();
  const [health, setHealth] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !token) {
      router.replace("/admin/login");
      return;
    }
    if (!user || String(user.role || "").toUpperCase() !== "ADMIN") {
      router.replace("/");
      return;
    }

    fetch(`${API_BASE}/admin/health`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.ok ? res.json() : Promise.reject(new Error(`Failed to load health (${res.status})`)))
      .then((data) => setHealth(data))
      .catch((e) => setError(e?.message || "Failed to load health"));
  }, [isLoading, isAuthenticated, token, user?.role]);

  return (
    <div className="container" style={{ maxWidth: "1000px", paddingTop: "32px" }}>
      <h2 style={{ fontSize: "24px", marginBottom: "10px" }}>Admin Health</h2>
      <div style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "12px", marginBottom: "16px" }}>
        {error ? `Error: ${error}` : (health?.now ? `Updated: ${health.now}` : "Loading...")}
      </div>

      <pre className="card" style={{ padding: "16px", overflow: "auto", fontSize: "12px" }}>
        {health ? JSON.stringify(health, null, 2) : "{}"}
      </pre>
    </div>
  );
}

