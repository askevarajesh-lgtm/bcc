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
    }, [JSON.stringify(params), skip]);

    useEffect(() => {
      refetch();
    }, [refetch]);

    return { data, isLoading, error, refetch };
  };
};

const createMutationHook = (method) => {
  return (urlFn) => {
    return () => {
      const [isLoading, setIsLoading] = useState(false);
      const [error, setError] = useState(null);

      const trigger = useCallback((arg) => {
        setIsLoading(true);
        setError(null);

        const execute = async () => {
          const config = typeof urlFn === 'function' ? urlFn(arg) : { url: urlFn, body: arg };
          const url = typeof config === 'string' ? config : config.url;
          const body = typeof config === 'object' && config.body ? config.body : arg;
          
          let response;
          if (method === 'post') response = await api.post(url, body);
          else if (method === 'put') response = await api.put(url, body);
          else if (method === 'delete') response = await api.delete(url, { data: body });
          
          return response.data;
        };

        const promise = execute().finally(() => setIsLoading(false));
        const resultPromise = promise.catch(err => {
          setError(err);
          return { error: err };
        });
        
        resultPromise.unwrap = () => promise.catch(err => Promise.reject(err.response?.data || err));
        return resultPromise;
      }, []);

      return [trigger, { isLoading, error }];
    };
  };
};

export const useGetDeliverablesQuery = createQueryHook((params) => ({ url: '/deliverables', params }));
export const useGetDeliverableByIdQuery = (id, options) => createQueryHook(() => `/deliverables/${id}`)(null, options);
export const useGetDeliverableAnalyticsQuery = createQueryHook('/deliverables/analytics');

export const useCreateDeliverableMutation = createMutationHook('post')('/deliverables');
export const useUpdateDeliverableMutation = createMutationHook('put')((arg) => {
  const { id, ...rest } = arg;
  return { url: `/deliverables/${id}`, body: rest };
});
export const useDeleteDeliverableMutation = createMutationHook('delete')((id) => `/deliverables/${id}`);

export const useSubmitForApprovalMutation = createMutationHook('put')(({ id, remarks }) => ({
  url: `/deliverables/${id}/submit`,
  body: { remarks }
}));
export const useApproveDeliverableMutation = createMutationHook('put')(({ id, remarks }) => ({
  url: `/deliverables/${id}/approve`,
  body: { remarks }
}));
export const useRequestRevisionMutation = createMutationHook('put')(({ id, remarks }) => ({
  url: `/deliverables/${id}/revision`,
  body: { remarks }
}));

export const useUploadDeliverableFileMutation = createMutationHook('post')(({ id, ...body }) => ({
  url: `/deliverables/${id}/files`,
  body
}));
export const useAddDeliverableCommentMutation = createMutationHook('post')(({ id, ...body }) => ({
  url: `/deliverables/${id}/comments`,
  body
}));
