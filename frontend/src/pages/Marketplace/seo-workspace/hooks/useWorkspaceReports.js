import { useState, useCallback } from 'react';
import { message } from 'antd';
import * as workspaceApi from '../api/workspaceApi';

export function useWorkspaceReports() {
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchReports = useCallback(async (projectId, params = {}) => {
    if (!projectId) return;
    try {
      setLoading(true);
      const res = await workspaceApi.getReports(projectId, params);
      setReports(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, limit: 20, total: 0, pages: 0 });
    } catch (error) {
      console.error('Failed to fetch reports', error);
      message.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, []);

  const generateReport = useCallback(async (projectId) => {
    try {
      setGenerating(true);
      await workspaceApi.generateReport(projectId);
      await fetchReports(projectId);
    } finally {
      setGenerating(false);
    }
  }, [fetchReports]);

  return { reports, pagination, loading, generating, fetchReports, generateReport };
}

export default useWorkspaceReports;
