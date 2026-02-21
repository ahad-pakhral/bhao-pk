// Smart alerts hook — manages cross-store alerts with alternative discovery

import { useState, useEffect, useCallback } from 'react';
import { SmartAlert } from '../types/models';
import { smartAlertsStorage } from '../services/storage.service';
import { findAlternatives, shouldAlertTrigger } from '../utils/smartAlerts';
import { ALL_PRODUCTS } from '../constants/dummyData';

export const useSmartAlerts = () => {
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggeredAlerts, setTriggeredAlerts] = useState<SmartAlert[]>([]);

  const loadAlerts = useCallback(async () => {
    try {
      const stored = await smartAlertsStorage.getAlerts();
      setAlerts(stored);
      setTriggeredAlerts(stored.filter(a => shouldAlertTrigger(a)));
    } catch (error) {
      console.error('Failed to load smart alerts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addAlert = useCallback(async (alert: SmartAlert) => {
    await smartAlertsStorage.addAlert(alert);
    setAlerts(prev => [...prev, alert]);
  }, []);

  const removeAlert = useCallback(async (id: string) => {
    await smartAlertsStorage.removeAlert(id);
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  const refreshPrices = useCallback(async () => {
    const currentAlerts = await smartAlertsStorage.getAlerts();
    const updated = currentAlerts.map(alert => {
      const product = ALL_PRODUCTS.find(p => p.id === alert.productId);
      if (!product) return alert;

      const alternatives = findAlternatives(
        { ...product, category: alert.category },
        ALL_PRODUCTS,
        3
      );
      return {
        ...alert,
        alternatives,
        lastCheckedAt: new Date(),
      };
    });

    for (const alert of updated) {
      await smartAlertsStorage.updateAlert(alert.id, alert);
    }
    setAlerts(updated);
    setTriggeredAlerts(updated.filter(a => shouldAlertTrigger(a)));
  }, []);

  useEffect(() => { loadAlerts(); }, [loadAlerts]);

  return {
    alerts,
    triggeredAlerts,
    loading,
    addAlert,
    removeAlert,
    refreshPrices,
  };
};
