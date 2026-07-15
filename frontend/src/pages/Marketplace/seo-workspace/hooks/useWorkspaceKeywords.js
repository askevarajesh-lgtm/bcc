import { useState, useCallback } from 'react';
import { message } from 'antd';
import * as workspaceApi from '../api/workspaceApi';

export function useWorkspaceKeywords() {
  const [keywords, setKeywords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(false);

  const fetchKeywords = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const res = await workspaceApi.getKeywords(params);
      setKeywords(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, limit: 20, total: 0, pages: 0 });
    } catch (error) {
      console.error('Failed to fetch keywords', error);
      message.error('Failed to load keywords');
    } finally {
      setLoading(false);
    }
  }, []);

  return { keywords, pagination, loading, fetchKeywords };
}

export default useWorkspaceKeywords;
