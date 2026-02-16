// Price alert service

import { apiClient } from './client';
import {
  AlertsResponse,
  CreateAlertRequest,
  CreateAlertResponse,
} from '../../types/api';
import { Alert } from '../../types/models';

export const alertService = {
  async getAlerts(): Promise<AlertsResponse> {
    const response = await apiClient.get<AlertsResponse>('/alerts');
    return response;
  },

  async createAlert(
    productId: string,
    targetPrice: number
  ): Promise<CreateAlertResponse> {
    const response = await apiClient.post<CreateAlertResponse>('/alerts', {
      productId,
      targetPrice,
    } as CreateAlertRequest);
    return response;
  },

  async deleteAlert(alertId: string): Promise<void> {
    await apiClient.delete(`/alerts/${alertId}`);
  },

  async toggleAlert(alertId: string, isActive: boolean): Promise<Alert> {
    const response = await apiClient.put<Alert>(`/alerts/${alertId}`, {
      isActive,
    });
    return response;
  },
};
