import { useState, useCallback } from 'react';
import { message } from 'antd';
import * as workspaceApi from '../api/workspaceApi';

export function useWorkspaceDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await workspaceApi.getDashboard();
      setDashboard(res.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard', error);
      message.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  return { dashboard, loading, fetchDashboard };
}

export default useWorkspaceDashboard;
