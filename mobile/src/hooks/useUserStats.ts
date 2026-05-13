import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api/client';

export interface UserStats {
  wishlistCount: number;
  activeAlertsCount: number;
  searchesCount: number;
}

export const useUserStats = () => {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      if (!isAuthenticated) {
        setStats(null);
        return;
      }
      const data = await apiClient.get<UserStats>('/auth/stats');
      setStats(data);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return { stats, loading, loadStats };
};

