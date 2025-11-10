import api from './api';

export interface DashboardPayload {
  widgets: any[];
  layouts: any;
}

export const dashboardService = {
  async get(scope: string): Promise<DashboardPayload> {
    const { data } = await api.get(`/api/v1/dashboards/${encodeURIComponent(scope)}`);
    return { widgets: data.widgets || [], layouts: data.layouts || {} };
  },
  async save(scope: string, payload: DashboardPayload): Promise<void> {
    await api.put(`/api/v1/dashboards/${encodeURIComponent(scope)}`, payload);
  }
};

