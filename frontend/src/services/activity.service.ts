import api from './api';

export interface ActivityItem {
  module: string;
  action: 'created'|'updated';
  title: string;
  user: string;
  at: string; // ISO
}

export const activityService = {
  async recent(limit = 20): Promise<ActivityItem[]> {
    const res = await api.get<ActivityItem[]>(`/api/v1/activity/recent?limit=${limit}`);
    return res.data || [];
  }
};
