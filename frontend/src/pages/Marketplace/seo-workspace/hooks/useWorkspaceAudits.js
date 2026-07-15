import { useState, useCallback } from 'react';
import { message } from 'antd';
import * as workspaceApi from '../api/workspaceApi';

export function useWorkspaceAudits() {
  const [audits, setAudits] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(false);

  const fetchAudits = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const res = await workspaceApi.getAudits(params);
      setAudits(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, limit: 20, total: 0, pages: 0 });
    } catch (error) {
      console.error('Failed to fetch audits', error);
      message.error('Failed to load audits');
    } finally {
      setLoading(false);
    }
  }, []);

  const runAudit = useCallback(async (projectId) => {
    const res = await workspaceApi.runAudit(projectId);
    return res.data;
  }, []);

  return { audits, pagination, loading, fetchAudits, runAudit };
}

export default useWorkspaceAudits;
