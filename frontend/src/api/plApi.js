import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const createQueryHook = (endpointFn) => {
  return (params, options = {}) => {
    const { skip } = options;
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(!skip);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
      if (skip) return;
      setIsLoading(true);
      try {
        const route = typeof endpointFn === 'function' ? endpointFn(params) : endpointFn;
        const config = typeof route === 'object' ? route : { url: route };
        const response = await api.request({ method: 'GET', ...config });
        setData(response.data?.data || response.data || []);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }, [params, skip]);

    useEffect(() => { fetchData(); }, [fetchData]);

    return { data, isLoading, error, refetch: fetchData };
  };
};

export const useGetProjectPLQuery = createQueryHook((id) => `/projects/${id}/pl`);
