import { useState, useCallback } from 'react';
import { message } from 'antd';
import * as workspaceApi from '../api/workspaceApi';

export function useWorkspaceAnalytics() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = useCallback(async (projectId) => {
    if (!projectId) return;
    try {
      setLoading(true);
      const res = await workspaceApi.getAnalytics(projectId);
      setAnalyticsData(res.data);
    } catch (error) {
      console.error('Failed to fetch analytics', error);
      message.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, []);

  return { analyticsData, loading, fetchAnalytics };
}

export default useWorkspaceAnalytics;
