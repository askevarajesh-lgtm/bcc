import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const createQueryHook = (endpointFn) => {
  return (params, options = {}) => {
    const { skip } = options;
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(!skip);
    const [error, setError] = useState(null);

    const refetch = useCallback(async () => {
      if (skip) return;
      setIsLoading(true);
      try {
        const config = typeof endpointFn === 'function' ? endpointFn(params) : { url: endpointFn };
        const url = typeof config === 'string' ? config : config.url;
        const queryParams = typeof config === 'object' && config.params ? config.params : {};
        
        const response = await api.get(url, { params: queryParams });
        setData(response.data);
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }, [JSON.stringify(params), skip]);

    useEffect(() => {
      refetch();
    }, [refetch]);

    return { data, isLoading, error, refetch };
  };
};

export const createMutationHook = (endpointFn) => {
  return () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const mutate = (params) => {
      const promise = (async () => {
        setIsLoading(true);
        try {
          const config = typeof endpointFn === 'function' ? endpointFn(params) : { url: endpointFn };
          const url = typeof config === 'string' ? config : config.url;
          const method = typeof config === 'object' && config.method ? config.method : 'POST';
          const body = typeof config === 'object' ? config.body : undefined;
          const formData = typeof config === 'object' ? config.formData : undefined;
          
          const response = await api({ url, method, data: formData || body });
          setError(null);
          return { data: response.data };
        } catch (err) {
          setError(err);
          return { error: err };
        } finally {
          setIsLoading(false);
        }
      })();

      promise.unwrap = async () => {
        const result = await promise;
        if (result.error) {
          throw result.error;
        }
        return result.data;
      };

      return promise;
    };
    return [mutate, { isLoading, error }];
  };
};
