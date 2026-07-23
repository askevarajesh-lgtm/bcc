import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const createQueryHook = (endpointFn) => {
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
    }, [endpointFn, params, skip]);

    useEffect(() => {
      refetch();
    }, [refetch]);

    return { data, isLoading, error, refetch };
  };
};

const createMutationHook = (endpointFn) => {
  return () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const mutate = async (params) => {
      setIsLoading(true);
      try {
        const config = typeof endpointFn === 'function' ? endpointFn(params) : (typeof endpointFn === 'object' ? endpointFn : { url: endpointFn });
        const url = typeof config === 'string' ? config : config.url;
        const method = typeof config === 'object' && config.method ? config.method : 'POST';
        const body = typeof config === 'object' ? config.body : undefined;
        const formData = typeof config === 'object' ? config.formData : undefined;
        
        const dataPayload = method === 'GET' ? undefined : (formData || body || params);
        
        const response = await api({ url, method, data: dataPayload });
        setError(null);
        return { data: response.data };
      } catch (err) {
        setError(err);
        return { error: err.response || err };
      } finally {
        setIsLoading(false);
      }
    };

    return [mutate, { isLoading, error }];
  };
};

export const useGetMarketplacePurchasesQuery = createQueryHook(() => "/marketplace/purchases");

export const useInitiatePurchaseMutation = createMutationHook({
  url: "/marketplace/purchase",
  method: "POST",
});

export const useVerifyPurchaseMutation = createMutationHook({
  url: "/marketplace/verify",
  method: "POST",
});
