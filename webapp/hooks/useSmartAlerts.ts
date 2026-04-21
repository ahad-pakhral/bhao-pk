'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface AlertData {
  id: string;
  userId: string;
  targetPrice: number;
  keyword: string | null;
  productUrl: string | null;
  isNotified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EnrichedProductData {
  name: string;
  imageUrl: string;
  price: number;
  store: string;
}

export interface EnrichedAlertData extends AlertData {
  product: EnrichedProductData | null;
}

function normalizeAlert(raw: any): AlertData {
  const a = raw || {};
  // Accept both camelCase and snake_case payloads, and coerce types.
  const targetPriceRaw = a.targetPrice ?? a.target_price;
  const targetPriceNum = typeof targetPriceRaw === 'number' ? targetPriceRaw : Number(targetPriceRaw);
  return {
    id: String(a.id ?? ''),
    userId: String(a.userId ?? a.user_id ?? ''),
    targetPrice: Number.isFinite(targetPriceNum) ? targetPriceNum : 0,
    keyword: a.keyword ?? null,
    productUrl: a.productUrl ?? a.product_url ?? null,
    isNotified: Boolean(a.isNotified ?? a.is_notified ?? false),
    createdAt: String(a.createdAt ?? a.created_at ?? ''),
    updatedAt: String(a.updatedAt ?? a.updated_at ?? ''),
  };
}

export const useSmartAlerts = () => {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [enrichedAlerts, setEnrichedAlerts] = useState<EnrichedAlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const { token, isAuthenticated } = useAuthStore();

  const loadAlerts = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setAlerts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/alerts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts((data.alerts || []).map(normalizeAlert));
      }
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  const loadEnrichedAlerts = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setEnrichedAlerts([]);
      setAlerts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/alerts/enriched`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const mapped = (data.alerts || []).map((raw: any) => {
          const normalized = normalizeAlert(raw);
          return {
            ...normalized,
            product: raw.product || null,
          } as EnrichedAlertData;
        });
        setEnrichedAlerts(mapped);
        // Also update plain alerts for backward compat
        setAlerts(mapped);
      }
    } catch (error) {
      console.error('Failed to load enriched alerts:', error);
      // Fallback to plain alerts
      await loadAlerts();
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token, loadAlerts]);

  const addAlert = useCallback(async (alertData: any) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(alertData),
      });
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        throw new Error(data?.error || `Failed to add alert (${res.status})`);
      }
      const alert = normalizeAlert(data.alert);
      setAlerts(prev => [alert, ...prev]);
      return alert;
    } catch (error) {
      console.error('Failed to add alert:', error);
      throw error;
    }
  }, [token]);

  const removeAlert = useCallback(async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/alerts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setAlerts(prev => prev.filter(a => a.id !== id));
        setEnrichedAlerts(prev => prev.filter(a => a.id !== id));
      }
    } catch (error) {
      console.error('Failed to remove alert:', error);
    }
  }, [token]);

  useEffect(() => {
    loadEnrichedAlerts();
  }, [loadEnrichedAlerts]);

  return {
    alerts,
    enrichedAlerts,
    loading,
    addAlert,
    removeAlert,
    refreshPrices: loadEnrichedAlerts,
  };
};
