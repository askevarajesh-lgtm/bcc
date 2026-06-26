import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const createQueryHook = (endpointFn) => {
  return (params, options = {}) => {
    const { skip } = options;
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(!skip);
    const [error, setError] = useState(null);

    const paramsStr = JSON.stringify(params);

    const fetchData = useCallback(async () => {
      if (skip) return;
      setIsLoading(true);
      try {
        const parsedParams = paramsStr ? JSON.parse(paramsStr) : undefined;
        const route = typeof endpointFn === 'function' ? endpointFn(parsedParams) : endpointFn;
        const config = typeof route === 'object' ? route : { url: route };
        const response = await api.request({ method: 'GET', ...config });
        setData(response.data?.data || response.data || []);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }, [paramsStr, skip]);

    useEffect(() => { fetchData(); }, [fetchData]);

    return { data, isLoading, error, refetch: fetchData };
  };
};

export const useGetTimelineEventsQuery = createQueryHook((params) => ({ url: '/timeline', params }));
