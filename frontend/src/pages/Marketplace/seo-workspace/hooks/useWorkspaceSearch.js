import { useState, useCallback } from 'react';
import { message } from 'antd';
import * as workspaceApi from '../api/workspaceApi';

export function useWorkspaceSearch() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q) => {
    if (!q || !q.trim()) {
      setResults(null);
      return;
    }
    try {
      setLoading(true);
      const res = await workspaceApi.globalSearch(q.trim());
      setResults(res.data.data);
    } catch (error) {
      console.error('Search failed', error);
      message.error('Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => setResults(null), []);

  return { results, loading, search, clear };
}

export default useWorkspaceSearch;
