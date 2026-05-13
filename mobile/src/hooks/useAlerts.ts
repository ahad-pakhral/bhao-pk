import { useCallback, useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api/client';

export interface EnrichedAlert {
  id: string;
  userId: string;
  targetPrice: number;
  keyword?: string | null;
  productUrl?: string | null;
  isNotified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  product?: {
    name?: string;
    imageUrl?: string | null;
    price?: number | null;
    store?: string | null;
  } | null;
}

export const useAlerts = () => {
  const { isAuthenticated } = useAuth();
  const [alerts, setAlerts] = useState<EnrichedAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      if (!isAuthenticated) {
        setAlerts([]);
        return;
      }
      const data = await apiClient.get<any>('/alerts/enriched');
      const list = Array.isArray(data?.alerts) ? data.alerts : [];
      setAlerts(list);
    } catch (e: any) {
      console.error('[Alerts] Failed to load alerts:', e);
      Toast.show({ type: 'error', text1: 'Failed to load alerts' });
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const createAlert = useCallback(
    async (params: { targetPrice: number; productUrl?: string; keyword?: string }) => {
      if (!isAuthenticated) {
        Toast.show({ type: 'info', text1: 'Login required', text2: 'Please login to set alerts' });
        return null;
      }
      const res = await apiClient.post<any>('/alerts', params);
      const created = res?.alert || null;
      await loadAlerts();
      return created;
    },
    [isAuthenticated, loadAlerts]
  );

  const deleteAlert = useCallback(
    async (id: string) => {
      if (!isAuthenticated) {
        Toast.show({ type: 'info', text1: 'Login required' });
        return;
      }
      await apiClient.delete<any>(`/alerts/${id}`);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    },
    [isAuthenticated]
  );

  return {
    alerts,
    loading,
    loadAlerts,
    createAlert,
    deleteAlert,
  };
};

